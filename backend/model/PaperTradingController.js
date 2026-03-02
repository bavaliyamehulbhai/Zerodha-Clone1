const {
  PaperWalletModel,
  PaperOrderModel,
  PaperPositionModel,
  LeaderboardModel,
} = require("../model/PaperTradingSchema");
const { UserModel } = require("../model/UserModel");

// --- Portfolio & Wallet ---
module.exports.getPaperProfile = async (req, res) => {
  try {
    let wallet = await PaperWalletModel.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await PaperWalletModel.create({ userId: req.user._id });
    }

    const positions = await PaperPositionModel.find({ userId: req.user._id });
    const orders = await PaperOrderModel.find({ userId: req.user._id }).sort({
      orderDate: -1,
    });

    // Calculate Total Portfolio Value
    let holdingsValue = 0;
    positions.forEach((pos) => {
      // Assuming LTP is updated or passed from frontend, for backend calc we use avgPrice as placeholder if LTP missing
      const currentPrice = pos.ltp || pos.avgPrice;
      holdingsValue += currentPrice * pos.qty;
    });

    res.json({ success: true, wallet, positions, orders, holdingsValue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.resetPortfolio = async (req, res) => {
  try {
    await PaperOrderModel.deleteMany({ userId: req.user._id });
    await PaperPositionModel.deleteMany({ userId: req.user._id });
    await PaperWalletModel.findOneAndUpdate(
      { userId: req.user._id },
      {
        availableBalance: 1000000,
        usedMargin: 0,
        realizedPnL: 0,
        lastReset: Date.now(),
      },
      { upsert: true, new: true },
    );
    res.json({
      success: true,
      message: "Paper trading portfolio reset to ₹10,00,000",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Order Execution Logic ---
module.exports.placePaperOrder = async (req, res) => {
  const { name, qty, price, mode, type } = req.body;
  const userId = req.user._id;

  try {
    const wallet = await PaperWalletModel.findOne({ userId });
    const orderValue = price * qty;

    // Margin Check
    if (mode === "BUY" && wallet.availableBalance < orderValue) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient virtual funds" });
    }

    const newOrder = await PaperOrderModel.create({
      userId,
      name,
      qty,
      price,
      mode,
      type,
      status: "PENDING",
    });

    // Simulate Execution (Async)
    setTimeout(async () => {
      await executePaperOrder(newOrder._id, orderValue);
    }, 1000); // 1 second delay

    res.json({ success: true, message: "Paper order placed", order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const executePaperOrder = async (orderId, orderValue) => {
  const order = await PaperOrderModel.findById(orderId);
  if (!order) return;

  // 1. Update Order Status
  order.status = "FILLED";
  order.filledQty = order.qty;
  order.averagePrice = order.price; // Assuming Limit order fills at price
  await order.save();

  // 2. Update Wallet & Positions
  const wallet = await PaperWalletModel.findOne({ userId: order.userId });
  let position = await PaperPositionModel.findOne({
    userId: order.userId,
    name: order.name,
  });

  if (order.mode === "BUY") {
    // Debit Wallet
    wallet.availableBalance -= orderValue;
    wallet.usedMargin += orderValue;

    // Update Position
    if (position) {
      const newQty = position.qty + order.qty;
      const newAvg = (position.avgPrice * position.qty + orderValue) / newQty;
      position.qty = newQty;
      position.avgPrice = newAvg;
    } else {
      position = new PaperPositionModel({
        userId: order.userId,
        name: order.name,
        qty: order.qty,
        avgPrice: order.price,
      });
    }
  } else {
    // SELL
    // Credit Wallet (Realized PnL logic simplified)
    wallet.availableBalance += orderValue;
    wallet.usedMargin -= position ? position.avgPrice * order.qty : 0; // Release margin

    if (position) {
      // Calculate Realized PnL
      const pnl = (order.price - position.avgPrice) * order.qty;
      wallet.realizedPnL += pnl;
      wallet.availableBalance += pnl; // Add profit to balance

      position.qty -= order.qty;
      if (position.qty <= 0) {
        await PaperPositionModel.deleteOne({ _id: position._id });
        position = null;
      }
    } else {
      // Short selling logic (simplified: create negative position)
      position = new PaperPositionModel({
        userId: order.userId,
        name: order.name,
        qty: -order.qty,
        avgPrice: order.price,
      });
    }
  }

  await wallet.save();
  if (position) await position.save();
};

// --- Leaderboard ---
module.exports.getLeaderboard = async (req, res) => {
  try {
    // Aggregate all wallets to calculate ranking
    const wallets = await PaperWalletModel.find().populate(
      "userId",
      "username",
    );

    const leaderboard = wallets.map((w) => {
      const totalValue = w.availableBalance + w.usedMargin; // Simplified equity
      const startValue = 1000000;
      const pnlPercent = ((totalValue - startValue) / startValue) * 100;

      return {
        username: w.userId ? w.userId.username : "Unknown",
        totalValue,
        pnlPercent,
        trades: 0, // Could aggregate order count
      };
    });

    // Sort by PnL
    leaderboard.sort((a, b) => b.pnlPercent - a.pnlPercent);

    // Add Rank
    const ranked = leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    res.json({ success: true, leaderboard: ranked.slice(0, 10) }); // Top 10
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
