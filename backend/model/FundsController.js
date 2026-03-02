const { WalletModel, LedgerModel } = require("../model/FundsSchema");
const { UserModel } = require("../model/UserModel");
const { PositionsModel } = require("./PositionsModel");
const NotificationService = require("./NotificationService");
const MarketDataService = require("./MarketDataService");
const { AuditLogModel } = require("../model/SurveillanceSchema");

const emitWalletUpdate = async (userId) => {
  try {
    const wallet = await WalletModel.findOne({ userId });
    if (wallet) {
      if (wallet.availableBalance < 0 && !wallet.isFrozen) {
        wallet.isFrozen = true;
        await wallet.save();

        await NotificationService.send({
          userId: userId,
          title: "Account Frozen",
          message:
            "Your account has been frozen due to negative balance. Please add funds immediately.",
          type: "RMS_ALERT",
          channels: ["EMAIL", "IN_APP", "WEBSOCKET"],
        });
      }

      MarketDataService.emit("wallet_update", {
        userId: userId.toString(),
        data: {
          availableBalance: wallet.availableBalance,
          usedMargin: wallet.usedMargin,
          unsettledBalance: wallet.unsettledBalance,
          currency: wallet.currency,
          isFrozen: wallet.isFrozen,
        },
      });
    }
  } catch (err) {
    console.error("Error emitting wallet update:", err);
  }
};

// Helper to create ledger entry
const createLedgerEntry = async (userId, type, amount, description, refId) => {
  const wallet = await WalletModel.findOne({ userId });
  const balanceAfter = wallet.availableBalance + wallet.unsettledBalance; // Total Equity

  await LedgerModel.create({
    userId,
    transactionType: type,
    amount,
    balanceAfter,
    description,
    referenceId: refId,
  });
};

module.exports.getWallet = async (req, res) => {
  try {
    let wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await WalletModel.create({ userId: req.user._id });
    }
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getWalletBalance = async (req, res) => {
  try {
    let wallet = await WalletModel.findOne(
      { userId: req.user._id },
      "availableBalance usedMargin unsettledBalance currency",
    );
    if (!wallet) {
      const newWallet = await WalletModel.create({ userId: req.user._id });
      wallet = {
        availableBalance: newWallet.availableBalance,
        usedMargin: newWallet.usedMargin,
        unsettledBalance: newWallet.unsettledBalance,
        currency: newWallet.currency,
      };
    }
    res.json({ success: true, balance: wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getBrokerDashboard = async (req, res) => {
  try {
    const totalClients = await UserModel.countDocuments({ role: "user" });

    // Active clients: usedMargin > 0
    const activeWallets = await WalletModel.find({ usedMargin: { $gt: 0 } });
    const activeClients = activeWallets.length;

    const totalMarginUsed = activeWallets.reduce(
      (acc, w) => acc + w.usedMargin,
      0,
    );

    // Risk Alerts: Utilization > 90%
    let riskAlerts = 0;
    const clients = [];

    const allWallets = await WalletModel.find({});

    for (const w of allWallets) {
      const user = await UserModel.findById(w.userId);
      if (!user || user.role !== "user") continue;

      const totalEquity = w.availableBalance + w.usedMargin;
      const utilization =
        totalEquity > 0 ? (w.usedMargin / totalEquity) * 100 : 0;

      if (utilization > 90) riskAlerts++;

      clients.push({
        id: user._id,
        username: user.username,
        marginUsed: w.usedMargin,
        available: w.availableBalance,
        utilization: utilization,
        status: w.isFrozen ? "Frozen" : utilization > 90 ? "Critical" : "Safe",
      });
    }

    res.json({
      stats: { totalClients, activeClients, totalMarginUsed, riskAlerts },
      clients,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.liquidateUser = async (req, res) => {
  const { userId } = req.body;
  try {
    await PositionsModel.deleteMany({ userId: userId });
    await WalletModel.findOneAndUpdate({ userId: userId }, { usedMargin: 0 });
    await emitWalletUpdate(userId);
    res.json({ success: true, message: "User liquidated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error liquidating user" });
  }
};

module.exports.downloadTransactionHistory = async (req, res) => {
  try {
    const PDFDocument = require("pdfkit");
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = [
      ...wallet.deposits.map((d) => ({ ...d.toObject(), type: "Deposit" })),
      ...wallet.withdrawals.map((w) => ({
        ...w.toObject(),
        type: "Withdrawal",
      })),
    ].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=transaction_history.pdf",
    );

    doc.pipe(res);

    doc.fontSize(18).text("Transaction History", { align: "center" });
    doc.moveDown();

    const tableTop = 100;
    let y = tableTop;

    // Headers
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Date", 50, y);
    doc.text("Type", 200, y);
    doc.text("Amount", 350, y);
    doc.text("Status", 450, y);
    doc.font("Helvetica");

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    doc.fontSize(10);
    transactions.forEach((txn) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(new Date(txn.requestedAt).toLocaleDateString(), 50, y);
      doc.text(txn.type, 200, y);
      doc.text(txn.amount.toFixed(2), 350, y);
      doc.text(txn.status, 450, y);
      y += 20;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
};

module.exports.getPendingWithdrawals = async (req, res) => {
  try {
    const requester = await UserModel.findById(req.user._id);
    const status = req.query.status || "PENDING";
    let query = {};
    if (status !== "ALL") {
      query = { "withdrawals.status": status };
    } else {
      query = { "withdrawals.0": { $exists: true } };
    }

    const wallets = await WalletModel.find(query);
    const withdrawals = [];

    for (const wallet of wallets) {
      const relevantWithdrawals = wallet.withdrawals.filter((w) => {
        return status === "ALL" ? true : w.status === status;
      });

      if (relevantWithdrawals.length > 0) {
        const user = await UserModel.findById(wallet.userId);
        if (!user) continue;

        // Hierarchy Logic: Broker -> User, Admin -> Broker
        let isVisible = false;
        if (requester.role === "broker" && user.role === "user") {
          isVisible = true;
        } else if (requester.role === "admin") {
          isVisible = true;
        }

        if (isVisible) {
          relevantWithdrawals.forEach((w) => {
            withdrawals.push({
              _id: w._id,
              userId: wallet.userId,
              username: user ? user.username : "Unknown",
              email: user ? user.email : "Unknown",
              amount: w.amount,
              requestedAt: w.requestedAt,
              status: w.status,
            });
          });
        }
      }
    }

    // Sort by date descending
    withdrawals.sort(
      (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt),
    );

    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.addFunds = async (req, res) => {
  const { amount, paymentId } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = new WalletModel({ userId: req.user._id });
    }
    if (wallet.isFrozen) {
      return res
        .status(403)
        .json({ success: false, message: "Account is frozen" });
    }

    if (user.role === "admin") {
      const adminCount = await UserModel.countDocuments({ role: "admin" });
      if (adminCount === 1) {
        wallet.availableBalance += Number(amount);
        wallet.deposits.push({
          amount,
          paymentId,
          status: "APPROVED",
          processedAt: Date.now(),
          adminComment: "Auto-approved (Sole Admin)",
        });
        await wallet.save();

        const depositId = wallet.deposits[wallet.deposits.length - 1]._id;
        await createLedgerEntry(
          req.user._id,
          "DEPOSIT",
          Number(amount),
          "Deposit Approved (Self)",
          depositId,
        );

        await emitWalletUpdate(req.user._id);
        return res.json({ success: true, message: "Funds added successfully" });
      }
    }

    wallet.deposits.push({ amount, paymentId, status: "PENDING" });
    await wallet.save();

    // Notification Logic
    if (user) {
      if (user.role === "broker" || user.role === "admin") {
        // Notify Admins
        const admins = await UserModel.find({
          role: "admin",
          _id: { $ne: user._id },
        });
        for (const admin of admins) {
          await NotificationService.send({
            userId: admin._id,
            title: "Fund Request",
            message: `${user.role === "admin" ? "Admin" : "Broker"} ${user.username} has requested to add ₹${amount}`,
            type: "GENERAL",
            channels: ["IN_APP", "WEBSOCKET"],
          });
        }
      } else if (user.role === "user") {
        // Notify Brokers
        const brokers = await UserModel.find({ role: "broker" });
        for (const broker of brokers) {
          await NotificationService.send({
            userId: broker._id,
            title: "User Fund Request",
            message: `User ${user.username} has requested to add ₹${amount}`,
            type: "GENERAL",
            channels: ["IN_APP", "WEBSOCKET"],
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Deposit request submitted for approval",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.requestWithdrawal = async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (wallet.isFrozen) {
      return res
        .status(403)
        .json({ success: false, message: "Account is frozen" });
    }
    if (wallet.availableBalance < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient funds" });
    }

    // Ensure user has a linked bank account for withdrawal
    if (
      user.role !== "admin" &&
      (!wallet.bankAccounts || wallet.bankAccounts.length === 0)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please link a bank account before withdrawing funds",
        });
    }

    let status = "PENDING";
    let adminComment = undefined;
    let processedAt = undefined;

    if (user.role === "admin") {
      const adminCount = await UserModel.countDocuments({ role: "admin" });
      if (adminCount === 1) {
        status = "APPROVED";
        adminComment = "Auto-approved (Sole Admin)";
        processedAt = Date.now();
      }
    }

    // Lock funds
    wallet.availableBalance -= amount;
    wallet.withdrawals.push({ amount, status, adminComment, processedAt });
    const withdrawal = wallet.withdrawals[wallet.withdrawals.length - 1];
    await wallet.save();

    await createLedgerEntry(
      req.user._id,
      "WITHDRAWAL",
      -amount,
      status === "APPROVED"
        ? "Withdrawal Auto-Approved (Self)"
        : "Withdrawal Request",
      withdrawal._id,
    );

    await emitWalletUpdate(req.user._id);

    // Notify Logic
    if (user.role === "admin") {
      if (status === "PENDING") {
        const admins = await UserModel.find({
          role: "admin",
          _id: { $ne: user._id },
        });
        for (const admin of admins) {
          await NotificationService.send({
            userId: admin._id,
            title: "Admin Withdrawal Request",
            message: `Admin ${user.username} requested withdrawal of ₹${amount}`,
            type: "GENERAL",
            channels: ["IN_APP", "WEBSOCKET"],
          });
        }
      }
    } else if (user.role === "broker") {
      const admins = await UserModel.find({ role: "admin" });
      for (const admin of admins) {
        await NotificationService.send({
          userId: admin._id,
          title: "Broker Withdrawal Request",
          message: `Broker ${user.username} requested withdrawal of ₹${amount}`,
          type: "GENERAL",
          channels: ["IN_APP", "WEBSOCKET"],
        });

        if (amount > 100000) {
          await NotificationService.send({
            userId: admin._id,
            title: "High Value Withdrawal Alert",
            message: `Broker ${user.username} has requested a large withdrawal of ₹${amount}. Please review immediately.`,
            type: "RMS_ALERT",
            channels: ["IN_APP", "WEBSOCKET", "EMAIL"],
          });
        }
      }
    } else if (user.role === "user") {
      const brokers = await UserModel.find({ role: "broker" });
      for (const broker of brokers) {
        await NotificationService.send({
          userId: broker._id,
          title: "New Withdrawal Request",
          message: `User ${user ? user.username : "Unknown"} requested withdrawal of ₹${amount}`,
          type: "GENERAL",
          channels: ["IN_APP", "WEBSOCKET"],
        });
      }
    }

    res.json({
      success: true,
      message:
        status === "APPROVED"
          ? "Withdrawal processed successfully"
          : "Withdrawal requested",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.unfreezeAccount = async (req, res) => {
  const { userId } = req.body;
  try {
    const wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    wallet.isFrozen = false;
    await wallet.save();

    await AuditLogModel.create({
      adminId: req.user._id,
      action: "UNFREEZE_ACCOUNT",
      targetUserId: userId,
      reason: "Manual unfreeze by admin",
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    await NotificationService.send({
      userId: userId,
      title: "Account Unfrozen",
      message: "Your account has been manually unfrozen by an admin.",
      type: "GENERAL",
      channels: ["EMAIL", "IN_APP", "WEBSOCKET"],
    });

    await emitWalletUpdate(userId);
    res.json({ success: true, message: "Account unfrozen successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.toggleFreeze = async (req, res) => {
  const { userId } = req.body;
  try {
    let wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      wallet = await WalletModel.create({ userId });
    }
    wallet.isFrozen = !wallet.isFrozen;
    await wallet.save();
    await emitWalletUpdate(userId);

    res.json({
      success: true,
      message: `User account ${wallet.isFrozen ? "frozen" : "unfrozen"}`,
      isFrozen: wallet.isFrozen,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getAllWallets = async (req, res) => {
  try {
    const wallets = await WalletModel.find({}, "userId isFrozen");
    res.json({ success: true, wallets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.cancelWithdrawal = async (req, res) => {
  const { withdrawalId } = req.body;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    const withdrawal = wallet.withdrawals.id(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid or non-pending withdrawal request",
      });
    }

    // Refund balance
    wallet.availableBalance += withdrawal.amount;
    withdrawal.status = "CANCELLED";
    withdrawal.processedAt = new Date();

    await wallet.save();

    await createLedgerEntry(
      req.user._id,
      "DEPOSIT",
      withdrawal.amount,
      "Withdrawal Cancelled by User",
      withdrawalId,
    );

    await emitWalletUpdate(req.user._id);

    res.json({ success: true, message: "Withdrawal request cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getPendingDeposits = async (req, res) => {
  try {
    const requester = await UserModel.findById(req.user._id);
    const wallets = await WalletModel.find({ "deposits.status": "PENDING" });
    const deposits = [];

    for (const wallet of wallets) {
      const pending = wallet.deposits.filter((d) => d.status === "PENDING");
      if (pending.length > 0) {
        const user = await UserModel.findById(wallet.userId);
        if (!user) continue;

        // Hierarchy Logic: Broker -> User, Admin -> Broker
        let isVisible = false;
        if (requester.role === "broker" && user.role === "user") {
          isVisible = true;
        } else if (requester.role === "admin") {
          isVisible = true;
        }

        if (isVisible) {
          pending.forEach((d) => {
            deposits.push({
              _id: d._id,
              userId: wallet.userId,
              username: user ? user.username : "Unknown",
              email: user ? user.email : "Unknown",
              amount: d.amount,
              paymentId: d.paymentId,
              requestedAt: d.requestedAt,
            });
          });
        }
      }
    }
    res.json({ success: true, deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.processDeposit = async (req, res) => {
  const { targetUserId, depositId, action } = req.body; // action: APPROVED/REJECTED
  try {
    const wallet = await WalletModel.findOne({ userId: targetUserId });
    const deposit = wallet.deposits.id(depositId);

    if (!deposit || deposit.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid deposit request" });
    }

    deposit.status = action;
    deposit.processedAt = new Date();

    if (action === "APPROVED") {
      wallet.availableBalance += deposit.amount;
      await createLedgerEntry(
        targetUserId,
        "DEPOSIT",
        deposit.amount,
        "Deposit Approved",
        depositId,
      );
    }

    await wallet.save();
    await emitWalletUpdate(targetUserId);
    res.json({ success: true, message: `Deposit ${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin Actions
module.exports.adminAdjustment = async (req, res) => {
  const { targetUserId, amount, type, reason } = req.body; // type: CREDIT/DEBIT
  try {
    const adjustment = type === "CREDIT" ? amount : -amount;

    const wallet = await WalletModel.findOneAndUpdate(
      { userId: targetUserId },
      { $inc: { availableBalance: adjustment } },
      { new: true },
    );

    await createLedgerEntry(
      targetUserId,
      "ADMIN_ADJUSTMENT",
      adjustment,
      reason,
      "ADMIN",
    );
    await emitWalletUpdate(targetUserId);
    res.json({ success: true, message: "Adjustment successful", wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.processWithdrawal = async (req, res) => {
  const { targetUserId, withdrawalId, action } = req.body; // action: APPROVED/REJECTED
  try {
    const wallet = await WalletModel.findOne({ userId: targetUserId });
    const withdrawal = wallet.withdrawals.id(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid withdrawal request" });
    }

    withdrawal.status = action;
    withdrawal.processedAt = new Date();

    if (action === "REJECTED") {
      // Refund balance
      wallet.availableBalance += withdrawal.amount;
      await createLedgerEntry(
        targetUserId,
        "DEPOSIT",
        withdrawal.amount,
        "Withdrawal Rejected - Refund",
        withdrawalId,
      );
    } else {
      // Approved - Money already deducted from availableBalance during request
      // Just log finalization if needed or integrate with Bank API here
      await createLedgerEntry(
        targetUserId,
        "WITHDRAWAL_APPROVED",
        0,
        "Withdrawal Processed Successfully",
        withdrawalId,
      );
    }

    await wallet.save();
    await emitWalletUpdate(targetUserId);

    // Send Notification
    const user = await UserModel.findById(targetUserId);
    if (user) {
      const message =
        action === "APPROVED"
          ? `Your withdrawal request for ₹${withdrawal.amount} has been approved.`
          : `Your withdrawal request for ₹${withdrawal.amount} has been rejected.`;

      await NotificationService.send({
        userId: targetUserId,
        title: `Withdrawal ${action === "APPROVED" ? "Approved" : "Rejected"}`,
        message: message,
        type: "GENERAL",
        channels: ["EMAIL", "IN_APP", "WEBSOCKET"],
      });
    }

    res.json({ success: true, message: `Withdrawal ${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getPendingAdminWithdrawals = async (req, res) => {
  try {
    const requester = await UserModel.findById(req.user._id);
    if (requester.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const admins = await UserModel.find({ role: "admin" });
    const adminIds = admins.map((a) => a._id);

    const wallets = await WalletModel.find({
      userId: { $in: adminIds },
      "withdrawals.status": "PENDING",
    });

    const withdrawals = [];
    for (const wallet of wallets) {
      const user = admins.find(
        (a) => a._id.toString() === wallet.userId.toString(),
      );
      const pending = wallet.withdrawals.filter((w) => w.status === "PENDING");

      pending.forEach((w) => {
        withdrawals.push({
          _id: w._id,
          userId: wallet.userId,
          username: user ? user.username : "Unknown",
          email: user ? user.email : "Unknown",
          amount: w.amount,
          requestedAt: w.requestedAt,
          status: w.status,
        });
      });
    }

    withdrawals.sort(
      (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt),
    );
    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.processAdminWithdrawal = async (req, res) => {
  const { targetUserId, withdrawalId, action } = req.body; // action: APPROVED/REJECTED
  try {
    const requester = await UserModel.findById(req.user._id);
    if (requester.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser || targetUser.role !== "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Target user is not an admin" });
    }

    const wallet = await WalletModel.findOne({ userId: targetUserId });
    const withdrawal = wallet.withdrawals.id(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid withdrawal request" });
    }

    withdrawal.status = action;
    withdrawal.processedAt = new Date();
    withdrawal.adminComment = `Processed by Admin ${requester.username}`;

    if (action === "REJECTED") {
      wallet.availableBalance += withdrawal.amount;
      await createLedgerEntry(
        targetUserId,
        "DEPOSIT",
        withdrawal.amount,
        "Admin Withdrawal Rejected - Refund",
        withdrawalId,
      );
    } else {
      await createLedgerEntry(
        targetUserId,
        "WITHDRAWAL_APPROVED",
        0,
        "Admin Withdrawal Approved",
        withdrawalId,
      );
    }

    await wallet.save();
    await emitWalletUpdate(targetUserId);

    await NotificationService.send({
      userId: targetUserId,
      title: `Admin Withdrawal ${action === "APPROVED" ? "Approved" : "Rejected"}`,
      message: `Your withdrawal request for ₹${withdrawal.amount} has been ${action.toLowerCase()} by ${requester.username}.`,
      type: "GENERAL",
      channels: ["EMAIL", "IN_APP", "WEBSOCKET"],
    });

    res.json({ success: true, message: `Admin withdrawal ${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.addBankAccount = async (req, res) => {
  const { accountNumber, ifsc, bankName, branch } = req.body;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // Check if account already exists
    const exists = wallet.bankAccounts.some(
      (b) => b.accountNumber === accountNumber,
    );
    if (exists)
      return res.status(400).json({ message: "Bank account already linked" });

    const isPrimary = wallet.bankAccounts.length === 0;
    wallet.bankAccounts.push({
      accountNumber,
      ifsc,
      bankName,
      branch,
      isPrimary,
    });
    await wallet.save();

    res.json({
      success: true,
      message: "Bank account added successfully",
      bankAccounts: wallet.bankAccounts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.deleteBankAccount = async (req, res) => {
  const { bankId } = req.params;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    wallet.bankAccounts = wallet.bankAccounts.filter(
      (b) => b._id.toString() !== bankId,
    );
    await wallet.save();
    res.json({
      success: true,
      message: "Bank account removed",
      bankAccounts: wallet.bankAccounts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.verifyBankAccount = async (req, res) => {
  const { bankId } = req.body;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const bankAccount = wallet.bankAccounts.id(bankId);
    if (!bankAccount)
      return res.status(404).json({ message: "Bank account not found" });

    if (bankAccount.isVerified) {
      return res.json({
        success: true,
        message: "Bank account already verified",
      });
    }

    // Mock Penny Drop API Logic
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock Failure Condition: Account numbers ending in '00' fail verification
    if (bankAccount.accountNumber.endsWith("00")) {
      return res.status(400).json({
        success: false,
        message:
          "Penny drop verification failed: Invalid Account Number (Mock)",
      });
    }

    // Mock Success
    const user = await UserModel.findById(req.user._id);
    bankAccount.isVerified = true;
    bankAccount.beneficiaryName = user
      ? user.username.toUpperCase()
      : "VERIFIED USER";

    await wallet.save();

    res.json({
      success: true,
      message: "Bank account verified successfully",
      bankAccount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.setPrimaryBankAccount = async (req, res) => {
  const { bankId } = req.body;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const bankAccount = wallet.bankAccounts.id(bankId);
    if (!bankAccount)
      return res.status(404).json({ message: "Bank account not found" });

    wallet.bankAccounts.forEach((b) => {
      b.isPrimary = false;
    });

    bankAccount.isPrimary = true;
    await wallet.save();

    res.json({
      success: true,
      message: "Primary bank account updated",
      bankAccounts: wallet.bankAccounts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.addUPI = async (req, res) => {
  const { vpa } = req.body;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // Basic VPA validation
    if (!vpa.includes("@")) {
      return res.status(400).json({ message: "Invalid UPI ID format" });
    }

    const exists = wallet.upiIds.some((u) => u.vpa === vpa);
    if (exists)
      return res.status(400).json({ message: "UPI ID already linked" });

    const isPrimary = wallet.upiIds.length === 0;
    wallet.upiIds.push({ vpa, isPrimary });
    await wallet.save();

    res.json({
      success: true,
      message: "UPI ID added successfully",
      upiIds: wallet.upiIds,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.deleteUPI = async (req, res) => {
  const { upiId } = req.params;
  try {
    const wallet = await WalletModel.findOne({ userId: req.user._id });
    wallet.upiIds = wallet.upiIds.filter((u) => u._id.toString() !== upiId);
    await wallet.save();
    res.json({
      success: true,
      message: "UPI ID removed",
      upiIds: wallet.upiIds,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getUserTransactionHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const transactions = await LedgerModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
