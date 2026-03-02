const cron = require("node-cron");
const { OrdersModel } = require("../model/OrdersModel");
const { cancelOrderInternal } = require("./OrdersController");
const NotificationService = require("./NotificationService");

const runMarketCloseCron = () => {
  // Run at 3:30 PM every weekday (Mon-Fri)
  cron.schedule("30 15 * * 1-5", async () => {
    console.log("[MarketClose] Cancelling pending orders...");
    try {
      const pendingOrders = await OrdersModel.find({
        status: { $in: ["PENDING", "TRIGGER_PENDING", "PARTIALLY_FILLED"] },
      });

      for (const order of pendingOrders) {
        await cancelOrderInternal(
          order._id,
          order.userId,
          "Market Closed - Auto Cancel",
        );

        await NotificationService.send({
          userId: order.userId,
          title: "Order Cancelled",
          message: `Your pending order for ${order.name} was cancelled as market is closed.`,
          type: "GENERAL",
          channels: ["IN_APP", "WEBSOCKET"],
        });
      }
    } catch (err) {
      console.error("[MarketClose] Error:", err);
    }
  });
};

module.exports = runMarketCloseCron;
