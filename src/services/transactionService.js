const alatPayService = require("./alatPayService");
const firebaseService = require("./firebaseService");

class TransactionService {
  /**
   * Create a new payment transaction
   */
  async createPayment(userId, amount, userInfo) {
    try {
      const orderId = `ORDER_${Date.now()}_${userId.substring(0, 8)}`;

      const result = await alatPayService.generateVirtualAccount(
        amount,
        orderId,
        "Safe App Subscription Payment",
        {
          email: userInfo.email,
          phone: userInfo.phoneNumber,
          firstName: userInfo.firstName || "User",
          lastName: userInfo.lastName || "",
          metadata: null,
        }
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const accountData = result.data;

      if (accountData.virtualBankCode === "035") {
        accountData.virtualBankAccountName = "AJAY INNOVATIONS LTD";
        accountData.virtualBankName = "WEMA Bank";
      } else {
        return {
          success: false,
          error: "Bank code changed by CBN. Expected '035' for Wema Bank.",
        };
      }

      const saveResult = await firebaseService.saveTransaction(userId, {
        transactionId: accountData.transactionId,
        orderId,
        amount,
        virtualAccountNumber: accountData.virtualBankAccountNumber,
        virtualBankCode: accountData.virtualBankCode,
        expiredAt: accountData.expiredAt,
      });

      if (!saveResult.success) {
        return {
          success: false,
          error: "Failed to save transaction to database",
        };
      }

      return { success: true, data: accountData };
    } catch (error) {
      console.error("Error creating payment:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check and update transaction status
   */
  async checkAndUpdateStatus(userId, transactionId) {
    try {
      const transactionResult = await firebaseService.getTransaction(
        userId,
        transactionId
      );

      if (!transactionResult.success) {
        return { success: false, error: "Transaction not found" };
      }

      const transaction = transactionResult.data;

      // Already completed
      if (["success"].includes(transaction.transactionStatus)) {
        return {
          success: true,
          data: {
            status: transaction.transactionStatus,
            alreadyProcessed: true,
          },
        };
      }

      // Check expiration
      const now = Date.now();
      if (
        transaction.expiredAt &&
        now > new Date(transaction.expiredAt).getTime()
      ) {
        await firebaseService.updateTransactionStatus(
          userId,
          transactionId,
          "expired"
        );
        return { success: true, data: { status: "expired" } };
      }

      // Check via ALAT API
      const statusResult = await alatPayService.checkTransactionStatus(
        transactionId
      );

      if (!statusResult.success) {
        return { success: false, error: statusResult.error };
      }

      let apiStatus = statusResult.data.status.toLowerCase();

      // 🔥 Normalize completed → success
      if (["success", "completed"].includes(apiStatus)) {
        apiStatus = "success";
      }

      await firebaseService.updateTransactionStatus(
        userId,
        transactionId,
        apiStatus,
        apiStatus === "success" ? Date.now() : null
      );

      // Activate subscription if successful
      if (apiStatus === "success") {
        await firebaseService.activateSubscription(
          userId,
          transaction.transactionAmount
        );
      }

      return {
        success: true,
        data: { status: apiStatus, ...statusResult.data },
      };
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor all pending transactions (called by cron job)
   */
  async monitorPendingTransactions() {
    try {
      console.log("[Transaction Monitor] Checking pending transactions...");

      const result = await firebaseService.getPendingTransactions();
      if (!result.success) {
        console.error(
          "[Transaction Monitor] Failed to get pending transactions"
        );
        return;
      }

      const pendingTransactions = result.data;
      console.log(
        `[Transaction Monitor] Found ${pendingTransactions.length} pending transactions`
      );

      for (const transaction of pendingTransactions) {
        try {
          const checkResult = await this.checkAndUpdateStatus(
            transaction.userId,
            transaction.transactionId
          );
          if (checkResult.success) {
            console.log(
              `[Transaction Monitor] Transaction ${transaction.transactionId}: ${checkResult.data.status}`
            );
          }
        } catch (error) {
          console.error(
            `[Transaction Monitor] Error checking transaction ${transaction.transactionId}:`,
            error
          );
        }
      }

      console.log("[Transaction Monitor] Check completed");
    } catch (error) {
      console.error("[Transaction Monitor] Error in monitoring:", error);
    }
  }
}

module.exports = new TransactionService();
