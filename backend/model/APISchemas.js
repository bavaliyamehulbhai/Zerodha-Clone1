const mongoose = require("mongoose");

const APIKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  key: { type: String, required: true, unique: true },
  name: { type: String, default: "Default Key" },
  permissions: [{ type: String }], // e.g., ["READ_MARKET", "PLACE_ORDER"]
  rateLimit: { type: Number, default: 60 }, // Requests per minute
  ipWhitelist: [{ type: String }], // Empty = allow all
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const APIUsageSchema = new mongoose.Schema({
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: "APIKey" },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  ip: String,
  timestamp: { type: Date, default: Date.now, expires: "30d" }, // Auto-delete after 30 days
});

const PartnerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  companyName: String,
  status: {
    type: String,
    enum: ["PENDING", "ACTIVE", "REJECTED"],
    default: "PENDING",
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // Linked user account
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  APIKeyModel: mongoose.model("APIKey", APIKeySchema),
  APIUsageModel: mongoose.model("APIUsage", APIUsageSchema),
  PartnerModel: mongoose.model("Partner", PartnerSchema),
};
