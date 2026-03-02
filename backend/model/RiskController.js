const { RiskModel } = require("../model/RiskSchema");
const { OrdersModel } = require("../model/OrdersModel");
const { WalletModel } = require("./FundsSchema");
const NotificationService = require("./NotificationService");

// --- Scoring Algorithm ---
const calculateRiskScore = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch data
  const [orders, wallet] = await Promise.all([
    OrdersModel.find({ userId, createdAt: { $gte: today } }),
    WalletModel.findOne({ userId }),
  ]);

  let score = 100;
  const metrics = {
    dailyTradeCount: orders.length,
    marginUtilization: 0,
    rejectionRate: 0,
    maxDrawdown: 0, // Requires historical equity tracking (omitted for brevity)
  };

  // 1. Over-trading Penalty
  if (metrics.dailyTradeCount > 50) score -= 20;
  else if (metrics.dailyTradeCount > 20) score -= 10;

  // 2. Margin Utilization Penalty
  if (wallet) {
    const totalCapital = wallet.availableBalance + wallet.usedMargin;
    if (totalCapital > 0) {
      metrics.marginUtilization = (wallet.usedMargin / totalCapital) * 100;
      if (metrics.marginUtilization > 90) score -= 15;
      else if (metrics.marginUtilization > 75) score -= 5;
    }
  }

  // 3. Rejection Rate Penalty (Spamming/Misuse)
  const rejectedCount = orders.filter((o) => o.status === "REJECTED").length;
  if (orders.length > 5) {
    metrics.rejectionRate = (rejectedCount / orders.length) * 100;
    if (metrics.rejectionRate > 50) score -= 20;
    else if (metrics.rejectionRate > 20) score -= 10;
  }

  // Clamp Score
  score = Math.max(0, Math.min(100, score));

  // Determine Broker Action (Dynamic Leverage)
  let leverage = 1;
  let status = "ACTIVE";
  if (score >= 80) leverage = 5;
  else if (score >= 60) leverage = 3;
  else if (score >= 40) leverage = 2;
  else {
    leverage = 1;
    status = "RESTRICTED"; // Block new MIS orders
  }

  // Save Risk Profile
  await RiskModel.findOneAndUpdate(
    { userId },
    {
      score,
      leverageAllowed: leverage,
      metrics,
      status,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true },
  );

  // Trigger Notification if Risk is High
  if (score < 40) {
    NotificationService.send({
      userId,
      title: "High Risk Alert",
      message:
        "Your risk score has dropped below 40. Leverage is restricted to 1x.",
      type: "RMS_ALERT",
      channels: ["EMAIL", "IN_APP", "WEBSOCKET"],
    });
  }

  return { score, leverage };
};

module.exports.getRiskProfile = async (req, res) => {
  try {
    let riskProfile = await RiskModel.findOne({ userId: req.user._id });
    if (!riskProfile) {
      // Initialize if not exists
      await calculateRiskScore(req.user._id);
      riskProfile = await RiskModel.findOne({ userId: req.user._id });
    }
    res.json({ success: true, riskProfile });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching risk profile" });
  }
};

module.exports.updateRiskScore = calculateRiskScore;
