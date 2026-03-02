const { model, Schema } = require("mongoose");

const RiskSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  score: { type: Number, default: 100 }, // 0 (High Risk) - 100 (Safe)
  leverageAllowed: { type: Number, default: 5 }, // Dynamic leverage multiplier
  metrics: {
    dailyTradeCount: { type: Number, default: 0 },
    marginUtilization: { type: Number, default: 0 }, // Percentage
    rejectionRate: { type: Number, default: 0 }, // Percentage
    maxDrawdown: { type: Number, default: 0 }, // Percentage
  },
  status: {
    type: String,
    enum: ["ACTIVE", "RESTRICTED", "BLOCKED"],
    default: "ACTIVE",
  },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = { RiskModel: model("risk", RiskSchema) };
