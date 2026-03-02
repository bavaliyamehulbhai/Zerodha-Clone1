const { model, Schema } = require("mongoose");

const KYCSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
  },
  username: String,
  email: String,
  panUrl: String,
  aadhaarUrl: String,
  selfieUrl: String,
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "DRAFT"],
    default: "PENDING",
  },
  rejectionReason: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = { KYCModel: model("kyc", KYCSchema) };
