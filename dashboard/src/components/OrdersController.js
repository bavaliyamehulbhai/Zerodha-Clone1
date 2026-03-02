const { OrdersModel } = require("../model/OrdersModel");
const { PositionModel } = require("../model/RMSSchemas");
const {
  PaperOrderModel,
  PaperPositionModel,
} = require("../../backend/model/PaperTradingSchema");
const { WalletModel, LedgerModel } = require("../../backend/model/FundsSchema");
const {
  simulateExchangeExecution,
} = require("../../backend/utils/ExchangeSimulator"); // Adjust path if needed based on actual structure
const { updateRiskScore } = require("../../backend/controllers/RiskController");
const {
  runRealTimeSurveillance,
} = require("../../backend/controllers/SurveillanceController");
const {
  logComplianceEvent,
} = require("../../backend/middlewares/AuditMiddleware");
const { BrokerConfigModel } = require("../../backend/model/BrokerConfigSchema");

module.exports.newOrder = async (req, res) => {
  try {
    // --- Broker Config Checks ---
    const configs = await BrokerConfigModel.find({});
    const configMap = {};
    configs.forEach((c) => (configMap[c.key] = c.value));

    // 0. Holiday Check
    if (configMap.holidays && Array.isArray(configMap.holidays)) {
      const timezone = configMap.trading_hours?.timezone || "Asia/Kolkata";
      const todayStr = new Date().toLocaleDateString("en-CA", {
        timeZone: timezone,
      }); // Returns YYYY-MM-DD in specific timezone
      if (configMap.holidays.includes(todayStr)) {
        return res
          .status(400)
          .json({
            message: "Market is closed today (Holiday)",
            success: false,
          });
      }
    }

    // 1. Trading Hours Check
    if (configMap.trading_hours) {
      const timezone = configMap.trading_hours.timezone || "Asia/Kolkata";
      const nowStr = new Date().toLocaleString("en-US", { timeZone: timezone });
      const now = new Date(nowStr);

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startH, startM] = configMap.trading_hours.start
        .split(":")
        .map(Number);
      const [endH, endM] = configMap.trading_hours.end.split(":").map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      if (currentTime < startTime || currentTime >= endTime) {
        return res
          .status(400)
          .json({ message: "Market is closed", success: false });
      }
    }

    // 2. Segment Check
    // Assuming 'equity' for now, or derive from instrument
    if (configMap.segments && configMap.segments.equity === false) {
      return res
        .status(400)
        .json({
          message: "Equity trading is currently disabled",
          success: false,
        });
    }

    // 3. Risk Threshold Check (Max Order Value)
    const orderValue = req.body.price * req.body.qty;
    if (
      configMap.risk_thresholds &&
      orderValue > configMap.risk_thresholds.maxOrderValue
    ) {
      return res
        .status(400)
        .json({
          message: `Order value exceeds limit of ${configMap.risk_thresholds.maxOrderValue}`,
          success: false,
        });
    }

    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (wallet && wallet.isFrozen) {
      return res
        .status(403)
        .json({
          message: "Account is frozen. Trading disabled.",
          success: false,
        });
    }

    let newOrder = new OrdersModel({
      name: req.body.name,
      qty: req.body.qty,
      price: req.body.price,
      mode: req.body.mode,
      type: req.body.type || "LIMIT", // Default to LIMIT if not specified
      triggerPrice: req.body.triggerPrice,
      userId: req.user._id,
      ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
      deviceId: req.headers["device-id"] || "unknown",
      status: "PENDING",
    });

    // RMS: Deduct Margin
    let requiredMargin = req.rms ? req.rms.requiredMargin : 0;

    // Dynamic Margin Override
    if (configMap.dynamic_margins && configMap.dynamic_margins[req.body.name]) {
      const marginPercent = configMap.dynamic_margins[req.body.name];
      const orderValue = req.body.price * req.body.qty;
      // Override standard margin with dynamic percentage (e.g., 100% for volatile stocks)
      requiredMargin = (orderValue * marginPercent) / 100;
    }

    if (requiredMargin > 0) {
      if (!wallet || wallet.availableBalance < requiredMargin) {
        return res
          .status(400)
          .json({ message: "Insufficient funds in wallet", success: false });
      }

      // Block Margin
      wallet.availableBalance -= requiredMargin;
      wallet.usedMargin += requiredMargin;
      await wallet.save();

      // Ledger Entry for Margin Block
      await LedgerModel.create({
        userId: req.user._id,
        transactionType: "MARGIN_BLOCK",
        amount: -requiredMargin,
        balanceAfter: wallet.availableBalance,
        description: `Margin blocked for ${req.body.name}`,
        referenceId: newOrder._id.toString(),
      });
    }

    await newOrder.save();

    // Async Execution (Smart Order Routing)
    executeOrder(newOrder._id, requiredMargin);

    // Async Risk Recalculation (Dynamic Leverage Adjustment)
    updateRiskScore(req.user._id).catch((err) =>
      console.error("Risk update failed", err),
    );

    // Async Surveillance Checks (Wash Trades, IP Clash)
    runRealTimeSurveillance(newOrder).catch((err) =>
      console.error("Surveillance check failed", err),
    );

    // Log Compliance Event
    logComplianceEvent(
      req.user._id,
      "USER",
      "ORDER_PLACED",
      newOrder._id.toString(),
      "ORDER",
      {
        name: req.body.name,
        qty: req.body.qty,
        price: req.body.price,
        mode: req.body.mode,
      },
      req,
    );

    res.json({ success: true, message: "Order placed", orderId: newOrder._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error saving order", success: false });
  }
};

// --- Smart Order Execution Engine ---
const executeOrder = async (orderId, blockedMargin) => {
  try {
    const order = await OrdersModel.findById(orderId);
    if (!order) return;

    // 1. Handle Stop Loss Orders (State: TRIGGER_PENDING)
    if (order.type === "SL" || order.type === "SL-M") {
      order.status = "TRIGGER_PENDING";
      await order.save();
      // In a real system, a separate "Ticker" service would monitor price vs triggerPrice
      // Here we simulate immediate trigger for demo
      console.log(
        `[SOR] SL Order ${orderId} triggered immediately for simulation.`,
      );
    }

    // 2. Smart Order Routing (Retry Logic)
    const MAX_RETRIES = 3;
    let attempts = 0;
    let executionResult = null;

    while (attempts < MAX_RETRIES) {
      attempts++;

      // Simulate routing to best exchange (NSE/BSE)
      order.exchange = Math.random() > 0.5 ? "NSE" : "BSE";

      console.log(
        `[SOR] Routing order ${orderId} to ${order.exchange} (Attempt ${attempts})`,
      );

      executionResult = await simulateExchangeExecution(order);

      if (executionResult.status !== "REJECTED") {
        break; // Success or Partial Fill
      }

      // If rejected, wait before retry
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. Process Execution Result
    if (executionResult.status === "REJECTED") {
      order.status = "REJECTED";
      order.rejectionReason = executionResult.reason;
      order.retryCount = attempts;
      await order.save();

      // Refund Margin
      if (blockedMargin > 0) {
        const wallet = await WalletModel.findOne({ userId: order.userId });
        wallet.availableBalance += blockedMargin;
        wallet.usedMargin -= blockedMargin;
        await wallet.save();

        // Ledger Entry for Refund
        await LedgerModel.create({
          userId: order.userId,
          transactionType: "MARGIN_RELEASE",
          amount: blockedMargin,
          balanceAfter: wallet.availableBalance,
          description: `Margin released for rejected order ${orderId}`,
          referenceId: orderId,
        });
      }
      console.log(
        `[SOR] Order ${orderId} REJECTED after ${attempts} attempts. Margin refunded.`,
      );
      return;
    }

    // 4. Update Order on Success
    order.status = executionResult.status; // FILLED or PARTIALLY_FILLED
    order.filledQty = executionResult.filledQty;
    order.averagePrice = executionResult.avgPrice;
    order.exchangeOrderId = executionResult.exchangeOrderId;

    // Calculate Brokerage
    if (order.status === "FILLED" || order.status === "PARTIALLY_FILLED") {
      const turnover = order.averagePrice * order.filledQty;
      // Simple Zerodha-like model: Flat ₹20 or 0.03% for Intraday, Free for Delivery

      // Dynamic Brokerage Calculation
      let brokerage = 0;
      const brokerageConfig = await BrokerConfigModel.findOne({
        key: "brokerage_slabs",
      });
      if (brokerageConfig && order.mode === "MIS") {
        const { amount, percent } = brokerageConfig.value;
        brokerage = Math.min(amount, turnover * percent);
      } else if (!brokerageConfig && order.mode === "MIS") {
        brokerage = Math.min(20, turnover * 0.0003); // Fallback
      }
      order.brokerage = parseFloat(brokerage.toFixed(2));
    }

    await order.save();

    // Handle Funds Settlement on Fill
    const wallet = await WalletModel.findOne({ userId: order.userId });

    if (order.mode === "BUY" && order.product === "CNC") {
      // Delivery Buy: Margin is permanently deducted (converted to asset)
      // We already deducted availableBalance and added to usedMargin.
      // Now we remove from usedMargin as it's no longer "margin" but "spent".
      wallet.usedMargin -= blockedMargin;
      await wallet.save();

      await LedgerModel.create({
        userId: order.userId,
        transactionType: "TRADE_DEBIT",
        amount: -blockedMargin,
        balanceAfter: wallet.availableBalance,
        description: `Buy Delivery: ${order.name}`,
        referenceId: orderId,
      });
    } else if (order.mode === "SELL" && order.product === "CNC") {
      // Delivery Sell: Proceeds go to Unsettled Balance (T+1)
      const saleValue = order.filledQty * order.averagePrice;
      wallet.unsettledBalance += saleValue;
      await wallet.save();

      await LedgerModel.create({
        userId: order.userId,
        transactionType: "TRADE_CREDIT",
        amount: saleValue,
        balanceAfter: wallet.availableBalance, // Balance doesn't increase yet
        description: `Sell Delivery: ${order.name} (Unsettled)`,
        referenceId: orderId,
      });
    }

    // 5. Update Positions (Post-Trade)
    if (executionResult.filledQty > 0) {
      await updatePosition(
        order,
        executionResult.filledQty,
        executionResult.avgPrice,
        blockedMargin,
      );
    }

    console.log(
      `[SOR] Order ${orderId} executed: ${order.status} @ ${order.averagePrice}`,
    );
  } catch (err) {
    console.error("[SOR] Execution Error:", err);
  }
};

const updatePosition = async (order, qty, price, marginUsed) => {
  // Check if position exists
  let position = await PositionModel.findOne({
    userId: order.userId,
    name: order.name,
    product: order.mode,
  });

  if (position) {
    // Update existing position
    const newQty = position.qty + qty;
    const newAvg = (position.avgPrice * position.qty + price * qty) / newQty;

    position.qty = newQty;
    position.avgPrice = newAvg;
    // Only add margin if it wasn't fully added before (simplified)
    // In a real system, margin is recalculated based on net position
    position.marginUsed += marginUsed;
    await position.save();
  } else {
    // Create new position
    await PositionModel.create({
      userId: order.userId,
      instrumentToken: order.name,
      name: order.name,
      product: order.mode,
      type: "BUY", // Simplified assumption
      qty: qty,
      avgPrice: price,
      marginUsed: marginUsed,
    });
  }
};

module.exports.getOrders = async (req, res) => {
  try {
    const orders = await OrdersModel.find({ userId: req.user._id });
    const paperOrders = await PaperOrderModel.find({ userId: req.user._id });

    const allOrders = [
      ...orders.map((o) => ({ ...o.toObject(), isPaper: false })),
      ...paperOrders.map((o) => ({ ...o.toObject(), isPaper: true })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt || b.orderDate) -
        new Date(a.createdAt || a.orderDate),
    );

    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", success: false });
  }
};

module.exports.getPositions = async (req, res) => {
  try {
    const positions = await PositionModel.find({ userId: req.user._id });
    const paperPositions = await PaperPositionModel.find({
      userId: req.user._id,
    });

    const allPositions = [
      ...positions.map((p) => ({ ...p.toObject(), isPaper: false })),
      ...paperPositions.map((p) => ({ ...p.toObject(), isPaper: true })),
    ];

    res.json(allPositions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching positions", success: false });
  }
};

module.exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrdersModel.findOne({ _id: id, userId: req.user._id });
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found", success: false });
    }
    await OrdersModel.findByIdAndDelete(id);
    res.json({ message: "Order deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", success: false });
  }
};

module.exports.liquidateUser = async (req, res) => {
  const { userId } = req.body;
  try {
    // Delete all positions for the user
    await PositionModel.deleteMany({ userId: userId });

    // Reset used margin for the user
    await WalletModel.findOneAndUpdate({ userId: userId }, { usedMargin: 0 });

    // Log Compliance Event for Admin Action
    logComplianceEvent(
      req.user._id, // Admin ID
      "ADMIN",
      "FORCED_LIQUIDATION",
      userId,
      "USER",
      { reason: "Risk Management" },
      req,
    );

    res.json({ success: true, message: "User liquidated successfully" });
  } catch (error) {
    console.error("Liquidation Error:", error);
    res.status(500).json({ success: false, message: "Error liquidating user" });
  }
};
