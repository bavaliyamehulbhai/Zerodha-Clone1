const { model, Schema } = require("mongoose");

const OrdersSchema = new Schema(
  {
    name: String,
    qty: Number,
    filledQty: { type: Number, default: 0 },
    price: Number,
    mode: String,
    product: {
      type: String,
      enum: ["CNC", "MIS", "NRML"],
      default: "CNC",
    },
    type: {
      type: String,
      enum: ["MARKET", "LIMIT", "SL", "SL-M", "TSL", "TSL-M"],
      default: "LIMIT",
    },
    triggerPrice: Number, // For SL orders
    trailingStopLoss: {
      value: Number,
      isPercent: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "OPEN",
        "PARTIALLY_FILLED",
        "FILLED",
        "REJECTED",
        "CANCELLED",
        "TRIGGER_PENDING",
        "AMO_REQ",
      ],
      default: "PENDING",
    },
    userId: {
      type: String,
      required: true,
    },
    exchangeOrderId: String,
    exchange: String,
    averagePrice: { type: Number, default: 0 },
    rejectionReason: String,
    brokerage: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    ipAddress: String,
    deviceId: String,
    blockedMargin: { type: Number, default: 0 }, // Track actual margin blocked
  },
  { timestamps: true },
);

module.exports = { OrdersModel: model("order", OrdersSchema) };
