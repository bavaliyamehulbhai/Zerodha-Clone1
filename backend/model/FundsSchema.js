const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    availableBalance: { type: Number, default: 0 }, // Cash available for trading
    usedMargin: { type: Number, default: 0 }, // Blocked for open positions
    unsettledBalance: { type: Number, default: 0 }, // T+1 pending credits (from Sells)
    currency: { type: String, default: "INR" },
    isFrozen: { type: Boolean, default: false },
    withdrawals: [
      {
        amount: Number,
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
          default: "PENDING",
        },
        requestedAt: { type: Date, default: Date.now },
        processedAt: Date,
        adminComment: String,
      },
    ],
    deposits: [
      {
        amount: Number,
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED"],
          default: "PENDING",
        },
        paymentId: String,
        requestedAt: { type: Date, default: Date.now },
        processedAt: Date,
        adminComment: String,
      },
    ],
    bankAccounts: [
      {
        accountNumber: { type: String, required: true },
        ifsc: { type: String, required: true },
        bankName: { type: String, required: true },
        branch: String,
        isPrimary: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        beneficiaryName: String,
      },
    ],
    upiIds: [
      {
        vpa: { type: String, required: true }, // Virtual Payment Address
        isPrimary: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

const LedgerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  transactionType: {
    type: String,
    enum: [
      "DEPOSIT",
      "WITHDRAWAL",
      "TRADE_DEBIT",
      "TRADE_CREDIT",
      "SETTLEMENT",
      "MARGIN_BLOCK",
      "MARGIN_RELEASE",
      "ADMIN_ADJUSTMENT",
    ],
    required: true,
  },
  amount: { type: Number, required: true }, // +/- amount
  balanceAfter: { type: Number, required: true },
  description: String,
  referenceId: String, // Order ID or Payment ID
  date: { type: Date, default: Date.now },
});

module.exports = {
  WalletModel: mongoose.model("Wallet", WalletSchema),
  LedgerModel: mongoose.model("Ledger", LedgerSchema),
};
