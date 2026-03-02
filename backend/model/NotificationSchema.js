const { model, Schema } = require("mongoose");

const NotificationSchema = new Schema({
  userId: { type: String, required: true }, // "ALL" for broadcast
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["RMS_ALERT", "MARKET_CRASH", "TRADE_HALT", "FORCED_SQUAREOFF", "GENERAL"],
    default: "GENERAL",
  },
  channels: [{ type: String, enum: ["EMAIL", "SMS", "IN_APP", "WEBSOCKET"] }],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = { NotificationModel: model("notification", NotificationSchema) };