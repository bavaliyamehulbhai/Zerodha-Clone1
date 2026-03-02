const mongoose = require("mongoose");

const MarketStatusSchema = new mongoose.Schema({
  exchangeStatus: { type: String, enum: ["OPEN", "CLOSED", "HALTED"], default: "OPEN" },
  feedMode: { type: String, enum: ["PRIMARY", "FALLBACK"], default: "PRIMARY" },
  spikeThreshold: { type: Number, default: 10 }, // Percentage
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = { MarketStatusModel: mongoose.model("MarketStatus", MarketStatusSchema) };