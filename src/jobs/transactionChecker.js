// src/jobs/transactionChecker.js
const cron = require("node-cron");
const transactionService = require("../services/transactionService");
const firebaseService = require("../services/firebaseService")

function startTransactionChecker() {
  console.log("[Cron] Transaction checker initialized");

  // Run every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    console.log("[Cron] Running transaction check...");
    await transactionService.monitorPendingTransactions();
  });

  console.log("[Cron] Transaction checker is now running (every 30 seconds)");
}

function stimulateSubscriptionService(){
  firebaseService.activateSubscription("92AP0lmFKsMZWJ6eGfaRRPB6fKe2", 1000);
}

module.exports = { startTransactionChecker, stimulateSubscriptionService };
