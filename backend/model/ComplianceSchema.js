const mongoose = require("mongoose");

const ComplianceLogSchema = new mongoose.Schema({
  actorId: { type: String, required: true }, // UserID or AdminID
  actorType: {
    type: String,
    enum: ["USER", "ADMIN", "SYSTEM", "BROKER"],
    required: true,
  },
  action: { type: String, required: true }, // e.g., "LOGIN", "ORDER_PLACED", "FREEZE_ACCOUNT"
  targetId: { type: String }, // e.g., OrderID, UserID being modified
  targetType: { type: String }, // e.g., "ORDER", "USER"
  details: { type: mongoose.Schema.Types.Mixed }, // Snapshot of changes or request body
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ["SUCCESS", "FAILURE"], default: "SUCCESS" },
  timestamp: { type: Date, default: Date.now, immutable: true }, // Enforce immutability
});

module.exports = {
  ComplianceLogModel: mongoose.model("ComplianceLog", ComplianceLogSchema),
};
