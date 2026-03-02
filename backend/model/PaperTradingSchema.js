const mongoose = require("mongoose");

const PaperWalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
  },
  availableBalance: { type: Number, default: 1000000 }, // Default 10L virtual funds
  usedMargin: { type: Number, default: 0 },
  realizedPnL: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now },
});

const PaperOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  name: String,
  qty: Number,
  price: Number,
  mode: { type: String, enum: ["BUY", "SELL"] },
  type: { type: String, default: "LIMIT" },
  status: {
    type: String,
    enum: ["PENDING", "FILLED", "REJECTED", "CANCELLED"],
    default: "PENDING",
  },
  filledQty: { type: Number, default: 0 },
  averagePrice: { type: Number, default: 0 },
  orderDate: { type: Date, default: Date.now },
});

const PaperPositionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  name: String,
  qty: { type: Number, default: 0 },
  avgPrice: { type: Number, default: 0 },
  ltp: { type: Number, default: 0 }, // Last Traded Price (updated via market feed)
  product: { type: String, default: "MIS" }, // Paper trading usually Intraday
});

const LeaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  username: String,
  totalPortfolioValue: Number,
  pnlPercentage: Number,
  rank: Number,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = {
  PaperWalletModel: mongoose.model("PaperWallet", PaperWalletSchema),
  PaperOrderModel: mongoose.model("PaperOrder", PaperOrderSchema),
  PaperPositionModel: mongoose.model("PaperPosition", PaperPositionSchema),
  LeaderboardModel: mongoose.model("Leaderboard", LeaderboardSchema),
};
