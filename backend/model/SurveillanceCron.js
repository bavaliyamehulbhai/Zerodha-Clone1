const cron = require("node-cron");
const { OrdersModel } = require("../model/OrdersModel");
const { SurveillanceAlertModel } = require("../model/SurveillanceSchema");

const runSurveillanceCron = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[Surveillance] Running Batch Checks...");
    await detectUnusualVolumes();
    await detectCircularTrading();
  });
};

const detectUnusualVolumes = async () => {
  // Rule: Volume > 5x of 30-day average for the instrument
  // Simplified: Check for single orders > 10,000 qty (Demo logic)

  const largeOrders = await OrdersModel.find({
    qty: { $gt: 10000 },
    createdAt: { $gte: new Date(Date.now() - 3600000) }, // Last hour
  });

  for (const order of largeOrders) {
    await SurveillanceAlertModel.create({
      userId: order.userId,
      type: "UNUSUAL_VOLUME",
      severity: "MEDIUM",
      details: {
        orderId: order._id,
        qty: order.qty,
        instrument: order.name,
        message: "Single order quantity exceeded threshold",
      },
    });
  }
};

const detectCircularTrading = async () => {
  // Rule: Detect groups of users trading same instrument repeatedly
  // Simplified: Find users with > 50 trades in same instrument in last hour

  const oneHourAgo = new Date(Date.now() - 3600000);

  const highFreqTraders = await OrdersModel.aggregate([
    { $match: { createdAt: { $gte: oneHourAgo } } },
    {
      $group: {
        _id: { userId: "$userId", name: "$name" },
        count: { $sum: 1 },
        totalQty: { $sum: "$qty" },
      },
    },
    { $match: { count: { $gt: 50 } } }, // Threshold
  ]);

  for (const trader of highFreqTraders) {
    // Check if alert already exists
    const exists = await SurveillanceAlertModel.findOne({
      userId: trader._id.userId,
      type: "CIRCULAR_TRADING",
      createdAt: { $gte: oneHourAgo },
    });

    if (!exists) {
      await SurveillanceAlertModel.create({
        userId: trader._id.userId,
        type: "CIRCULAR_TRADING",
        severity: "HIGH",
        details: {
          instrument: trader._id.name,
          tradeCount: trader.count,
          totalVolume: trader.totalQty,
          message: "High frequency churning detected",
        },
      });
    }
  }
};

module.exports = runSurveillanceCron;
