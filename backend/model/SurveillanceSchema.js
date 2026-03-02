const mongoose = require("mongoose");

const SurveillanceAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  type: {
    type: String,
    enum: [
      "WASH_TRADE",
      "CIRCULAR_TRADING",
      "UNUSUAL_VOLUME",
      "IP_CLASH",
      "FRONT_RUNNING",
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    required: true,
  },
  details: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ["OPEN", "INVESTIGATING", "CLOSED", "FALSE_POSITIVE"],
    default: "OPEN",
  },
  createdAt: { type: Date, default: Date.now },
});

const AuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  action: { type: String, required: true }, // e.g., "FREEZE_ACCOUNT", "CLOSE_ALERT"
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  reason: String,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = {
  SurveillanceAlertModel: mongoose.model(
    "SurveillanceAlert",
    SurveillanceAlertSchema,
  ),
  AuditLogModel: mongoose.model("AuditLog", AuditLogSchema),
};
