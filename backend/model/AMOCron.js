const cron = require("node-cron");
const { OrdersModel } = require("../model/OrdersModel");
const { executeOrder } = require("./OrdersController");
const NotificationService = require("./NotificationService");

const runAMOCron = () => {
  // Run at 9:15 AM every weekday (Mon-Fri)
  cron.schedule("15 9 * * 1-5", async () => {
    console.log("[AMO] Processing After Market Orders...");
    try {
      const amoOrders = await OrdersModel.find({ status: "AMO_REQ" });

      for (const order of amoOrders) {
        // Determine new status based on type
        const isStopLoss = ["SL", "SL-M", "TSL", "TSL-M"].includes(order.type);
        const newStatus = isStopLoss ? "TRIGGER_PENDING" : "PENDING";

        order.status = newStatus;
        await order.save();

        // If Market order, execute immediately
        // Limit orders will be picked up by the tick listener since status is now PENDING
        if (order.type === "MARKET") {
          await executeOrder(order._id, order.userId);
        }

        await NotificationService.send({
          userId: order.userId,
          title: "AMO Triggered",
          message: `Your AMO for ${order.name} has been placed.`,
          type: "GENERAL",
          channels: ["IN_APP", "WEBSOCKET"],
        });
      }
    } catch (err) {
      console.error("[AMO] Error:", err);
    }
  });
};

module.exports = runAMOCron;
