const { OrdersModel } = require("../model/OrdersModel");
const {
  SurveillanceAlertModel,
  AuditLogModel,
} = require("../model/SurveillanceSchema");
const { RiskModel } = require("../model/RiskSchema");

// --- Real-time Detection Logic ---

const detectWashTrades = async (order) => {
  // Rule: Same user, same instrument, opposite side, within 60 seconds
  const timeWindow = new Date(Date.now() - 60000);

  const conflictingOrder = await OrdersModel.findOne({
    userId: order.userId,
    name: order.name,
    mode: order.mode === "BUY" ? "SELL" : "BUY",
    status: { $in: ["FILLED", "PENDING"] },
    createdAt: { $gte: timeWindow },
    // Check for similar price (within 1%)
    price: { $gte: order.price * 0.99, $lte: order.price * 1.01 },
  });

  if (conflictingOrder) {
    await createAlert(order.userId, "WASH_TRADE", "HIGH", {
      orderId1: order._id,
      orderId2: conflictingOrder._id,
      instrument: order.name,
      message: "Self-trade detected within 60s window",
    });
  }
};

const detectIPClash = async (order) => {
  if (!order.ipAddress) return;

  // Rule: More than 3 distinct users from same IP today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const distinctUsers = await OrdersModel.distinct("userId", {
    ipAddress: order.ipAddress,
    createdAt: { $gte: startOfDay },
  });

  if (distinctUsers.length >= 3) {
    // Alert for all involved users
    for (const uid of distinctUsers) {
      await createAlert(uid, "IP_CLASH", "MEDIUM", {
        ip: order.ipAddress,
        distinctUsersCount: distinctUsers.length,
        message: "Multiple accounts operating from same IP",
      });
    }
  }
};

// --- Helper to Create Alerts ---
const createAlert = async (userId, type, severity, details) => {
  // Avoid duplicate open alerts for same type/user today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const exists = await SurveillanceAlertModel.findOne({
    userId,
    type,
    status: "OPEN",
    createdAt: { $gte: startOfDay },
  });

  if (!exists) {
    await SurveillanceAlertModel.create({ userId, type, severity, details });
    console.log(`[SURVEILLANCE] New Alert: ${type} for User ${userId}`);
  }
};

// --- Admin Actions ---

module.exports.freezeAccount = async (req, res) => {
  const { targetUserId, reason } = req.body;
  const adminId = req.user._id;

  try {
    // 1. Update Risk Profile
    await RiskModel.findOneAndUpdate(
      { userId: targetUserId },
      { status: "BLOCKED", leverageAllowed: 0 },
    );

    // 2. Log Audit
    await AuditLogModel.create({
      adminId,
      action: "FREEZE_ACCOUNT",
      targetUserId,
      reason,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "Account frozen successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getAlerts = async (req, res) => {
  try {
    const alerts = await SurveillanceAlertModel.find({
      status: { $ne: "CLOSED" },
    })
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLogModel.find()
      .populate("adminId", "username")
      .populate("targetUserId", "username")
      .sort({ timestamp: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export real-time checks for OrdersController
module.exports.runRealTimeSurveillance = async (order) => {
  try {
    await Promise.all([detectWashTrades(order), detectIPClash(order)]);
  } catch (err) {
    console.error("Surveillance Error:", err);
  }
};
