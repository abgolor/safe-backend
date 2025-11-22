const cron = require("node-cron");
const firebaseService = require("../services/firebaseService");

function startArchiveExpiredTransactions() {
  console.log("[Cron] Archive expired transactions initialized");

  // Run once a day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running archive of expired transactions...");
    await firebaseService.archiveOldExpiredTransactions();
  });

  console.log("[Cron] Archive checker running (daily at midnight)");
}

module.exports = { startArchiveExpiredTransactions };
