const {
  APIKeyModel,
  PartnerModel,
  APIUsageModel,
} = require("../model/APISchemas");
const crypto = require("crypto");

// Generate a secure random key
const generateKeyString = () => {
  return "pk_" + crypto.randomBytes(16).toString("hex");
};

module.exports.createAPIKey = async (req, res) => {
  const { name, permissions, ipWhitelist } = req.body;
  const userId = req.user._id;

  try {
    const newKey = await APIKeyModel.create({
      userId,
      key: generateKeyString(),
      name,
      permissions,
      ipWhitelist: ipWhitelist
        ? ipWhitelist.split(",").map((ip) => ip.trim())
        : [],
    });
    res.json({ success: true, apiKey: newKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.registerPartner = async (req, res) => {
  const { companyName, email } = req.body;
  const userId = req.user._id;

  try {
    const partner = await PartnerModel.create({
      userId,
      companyName,
      email,
      status: "PENDING",
    });
    res.json({
      success: true,
      message: "Partner application submitted",
      partner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getAPIKeys = async (req, res) => {
  try {
    const keys = await APIKeyModel.find({ userId: req.user._id });
    res.json({ success: true, keys });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.updateKeySettings = async (req, res) => {
  const { keyId, ipWhitelist, isActive } = req.body;
  try {
    const key = await APIKeyModel.findOneAndUpdate(
      { _id: keyId, userId: req.user._id },
      {
        ipWhitelist: ipWhitelist
          ? ipWhitelist.split(",").map((ip) => ip.trim())
          : [],
        isActive,
      },
      { new: true },
    );
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getUsageAnalytics = async (req, res) => {
  const userId = req.user._id;
  try {
    // Get all keys for user
    const keys = await APIKeyModel.find({ userId }).select("_id");
    const keyIds = keys.map((k) => k._id);

    // Aggregate usage
    const usage = await APIUsageModel.aggregate([
      { $match: { apiKeyId: { $in: keyIds } } },
      {
        $group: {
          _id: {
            endpoint: "$endpoint",
            method: "$method",
            status: "$statusCode",
          },
          count: { $sum: 1 },
          lastUsed: { $max: "$timestamp" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, usage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
