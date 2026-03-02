const mongoose = require("mongoose");

const BrokerConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = { BrokerConfigModel: mongoose.model("BrokerConfig", BrokerConfigSchema) };