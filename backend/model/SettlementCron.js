const cron = require("node-cron");
const { WalletModel, LedgerModel } = require("../model/FundsSchema");

const runSettlementCron = () => {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[Settlement] Running T+1 Settlement...");

    try {
      // Find unsettled credits older than 24 hours (T+1)
      // In a real system, we'd query the Ledger for specific 'TRADE_CREDIT' entries that haven't been settled.
      // For this design, we assume 'unsettledBalance' holds the total pending amount and we settle it daily.
      // A more granular approach would track each trade's settlement date.

      const wallets = await WalletModel.find({ unsettledBalance: { $gt: 0 } });

      for (const wallet of wallets) {
        const amountToSettle = wallet.unsettledBalance;

        if (amountToSettle > 0) {
          wallet.availableBalance += amountToSettle;
          wallet.unsettledBalance = 0;
          await wallet.save();

          await LedgerModel.create({
            userId: wallet.userId,
            transactionType: "SETTLEMENT",
            amount: amountToSettle,
            balanceAfter: wallet.availableBalance,
            description: "T+1 Settlement Credit",
            referenceId: `SETTLE-${Date.now()}`,
          });
        }
      }
    } catch (err) {
      console.error("[Settlement] Error:", err);
    }
  });
};

module.exports = runSettlementCron;
