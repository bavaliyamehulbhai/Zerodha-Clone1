const { BrokerConfigModel } = require("../model/BrokerConfigSchema");

// Initialize default configs if not present
const initializeConfigs = async () => {
  const defaults = [
    {
      key: "brokerage_slabs",
      value: { type: "flat", amount: 20, percent: 0.03 },
      description: "Brokerage calculation rules"
    },
    {
      key: "margin_rules",
      value: { MIS: 5, CNC: 1, NRML: 1 },
      description: "Leverage multipliers per product"
    },
    {
      key: "trading_hours",
      value: { start: "09:15", end: "15:30", timezone: "Asia/Kolkata" },
      description: "Market open/close times"
    },
    {
      key: "segments",
      value: { equity: true, fno: true, commodity: false },
      description: "Enabled trading segments"
    },
    {
      key: "risk_thresholds",
      value: { maxOrderValue: 1000000, maxDailyLoss: 50000 },
      description: "Risk management limits"
    },
    {
      key: "holidays",
      value: [], // Array of date strings "YYYY-MM-DD"
      description: "Market holidays"
    },
    {
      key: "dynamic_margins",
      value: {}, // Object { "ADANIENT": 50, "PAYTM": 100 } (Percentage required)
      description: "Stock specific margin requirements (%)"
    }
  ];

  for (const def of defaults) {
    await BrokerConfigModel.findOneAndUpdate(
      { key: def.key },
      { $setOnInsert: def },
      { upsert: true }
    );
  }
};

module.exports.getConfigs = async (req, res) => {
  try {
    await initializeConfigs(); // Ensure defaults exist
    const configs = await BrokerConfigModel.find({});
    // Convert array to object for easier frontend consumption
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);
    res.json({ success: true, configs: configMap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.updateConfig = async (req, res) => {
  const { key, value } = req.body;

  // Validation
  if (key === "trading_hours") {
    if (!value.start || !value.end) {
      return res.status(400).json({ success: false, message: "Start and End times are required" });
    }
    if (value.start >= value.end) {
      return res.status(400).json({ success: false, message: "Start time must be before End time" });
    }
  }

  try {
    await BrokerConfigModel.findOneAndUpdate(
      { key },
      { value, lastUpdated: Date.now() },
      { upsert: true }
    );
    res.json({ success: true, message: "Configuration updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.resetConfigs = async (req, res) => {
  try {
    await BrokerConfigModel.deleteMany({});
    await initializeConfigs();
    res.json({ success: true, message: "Configurations reset to defaults" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};