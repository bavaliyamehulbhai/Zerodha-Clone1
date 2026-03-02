const cron = require("node-cron");
const { WalletModel } = require("../model/FundsSchema");
const NotificationService = require("./NotificationService");
const MarketDataService = require("./MarketDataService");

const runUnfreezeCron = () => {
  // Run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("[UnfreezeCron] Checking for accounts to unfreeze...");

    try {
      // Find wallets that are frozen but have a non-negative balance
      const frozenWallets = await WalletModel.find({
        isFrozen: true,
        availableBalance: { $gte: 0 },
      });

      for (const wallet of frozenWallets) {
        wallet.isFrozen = false;
        await wallet.save();

        // Notify User
        await NotificationService.send({
          userId: wallet.userId,
          title: "Account Unfrozen",
          message:
            "Your account has been automatically unfrozen as your balance is now positive.",
          type: "GENERAL",
          channels: ["EMAIL", "IN_APP", "WEBSOCKET"],
        });

        // Real-time Update
        MarketDataService.emit("wallet_update", {
          userId: wallet.userId.toString(),
          data: {
            availableBalance: wallet.availableBalance,
            usedMargin: wallet.usedMargin,
            unsettledBalance: wallet.unsettledBalance,
            currency: wallet.currency,
            isFrozen: wallet.isFrozen,
          },
        });

        console.log(`[UnfreezeCron] Unfrozen wallet for user ${wallet.userId}`);
      }
    } catch (err) {
      console.error("[UnfreezeCron] Error:", err);
    }
  });
};

module.exports = runUnfreezeCron;
