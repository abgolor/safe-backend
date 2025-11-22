// src/jobs/transactionChecker.js
const cron = require("node-cron");
const transactionService = require("../services/transactionService");

function startTransactionChecker() {
  console.log("[Cron] Transaction checker initialized");

  // Run every 30 seconds
  cron.schedule("*/5 * * * * *", async () => {
    console.log("[Cron] Running transaction check...");
    await transactionService.monitorPendingTransactions();
  });

  console.log("[Cron] Transaction checker is now running (every 30 seconds)");
}

module.exports = { startTransactionChecker };
