const router = require("express").Router();
const {
  getWallet,
  addFunds,
  requestWithdrawal,
  getWalletBalance,
  cancelWithdrawal,
  adminAdjustment,
  processWithdrawal,
  getPendingAdminWithdrawals,
  processAdminWithdrawal,
  getPendingWithdrawals,
  getPendingDeposits,
  processDeposit,
  downloadTransactionHistory,
  getUserTransactionHistory,
  toggleFreeze,
  unfreezeAccount,
  getAllWallets,
  getBrokerDashboard,
  liquidateUser,
  addBankAccount,
  deleteBankAccount,
  verifyBankAccount,
  setPrimaryBankAccount,
  addUPI,
  deleteUPI,
} = require("./FundsController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// User Routes
router.get("/wallet", userVerification, getWallet);
router.get("/wallet/balance", userVerification, getWalletBalance);
router.post("/add", userVerification, addFunds);
router.post("/withdraw", userVerification, requestWithdrawal);
router.post("/withdraw/cancel", userVerification, cancelWithdrawal);
router.get("/transactions/pdf", userVerification, downloadTransactionHistory);

// Wallet Components (Bank & UPI)
router.post("/wallet/bank", userVerification, addBankAccount);
router.delete("/wallet/bank/:bankId", userVerification, deleteBankAccount);
router.post("/wallet/bank/verify", userVerification, verifyBankAccount);
router.put("/wallet/bank/primary", userVerification, setPrimaryBankAccount);
router.post("/wallet/upi", userVerification, addUPI);
router.delete("/wallet/upi/:upiId", userVerification, deleteUPI);

// Admin Routes (Middleware for admin check assumed)
router.post("/admin/adjust", userVerification, adminAdjustment);
router.get("/broker/deposits", userVerification, getPendingDeposits);
router.post("/broker/deposit-process", userVerification, processDeposit);
router.get("/broker/withdrawals", userVerification, getPendingWithdrawals);
router.post("/broker/withdraw-process", userVerification, processWithdrawal);
router.get(
  "/admin/withdrawals/pending",
  userVerification,
  getPendingAdminWithdrawals,
);
router.post(
  "/admin/withdrawals/process",
  userVerification,
  processAdminWithdrawal,
);
router.get(
  "/admin/transactions/:userId",
  userVerification,
  getUserTransactionHistory,
);
router.post("/admin/freeze", userVerification, toggleFreeze);
router.post("/admin/unfreeze", userVerification, unfreezeAccount);
router.get("/admin/wallets", userVerification, getAllWallets);
router.get("/broker/dashboard", userVerification, getBrokerDashboard);
router.post("/liquidate", userVerification, liquidateUser);

module.exports = router;
