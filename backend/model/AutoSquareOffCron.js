const cron = require("node-cron");
const { PositionsModel } = require("../model/PositionsModel");
const { OrdersModel } = require("../model/OrdersModel");
const { executeOrder } = require("./OrdersController");
const NotificationService = require("./NotificationService");
const MarketDataService = require("./MarketDataService");

const runAutoSquareOff = () => {
  // Run at 3:20 PM every weekday (Mon-Fri)
  // cron.schedule("20 15 * * 1-5", async () => {
  //   console.log("[AutoSquareOff] Running MIS Square Off...");
  //   try {
  //     // Find all open MIS positions
  //     const positions = await PositionsModel.find({ product: "MIS" });
  //
  //     for (const pos of positions) {
  //       if (pos.qty === 0) continue;
  //
  //       // Determine counter order mode
  //       const mode = pos.qty > 0 ? "SELL" : "BUY";
  //       const qty = Math.abs(pos.qty);
  //
  //       // Get current market price
  //       const ltp = MarketDataService.getLastPrice(pos.name) || pos.avg;
  //
  //       // Create Square Off Order
  //       const order = new OrdersModel({
  //         name: pos.name,
  //         qty: qty,
  //         price: ltp,
  //         mode: mode,
  //         type: "MARKET",
  //         product: "MIS",
  //         userId: pos.userId,
  //         status: "PENDING",
  //         rejectionReason: "Auto Square Off",
  //       });
  //
  //       await order.save();
  //
  //       // Execute immediately
  //       await executeOrder(order._id, pos.userId);
  //
  //       // Notify User
  //       await NotificationService.send({
  //         userId: pos.userId,
  //         title: "MIS Auto Square Off",
  //         message: `Your MIS position for ${pos.name} was auto-squared off at 3:20 PM.`,
  //         type: "FORCED_SQUAREOFF",
  //         channels: ["IN_APP", "EMAIL"],
  //       });
  //     }
  //   } catch (err) {
  //     console.error("[AutoSquareOff] Error:", err);
  //   }
  // });
  console.log("[AutoSquareOff] Feature disabled.");
};

module.exports = runAutoSquareOff;
