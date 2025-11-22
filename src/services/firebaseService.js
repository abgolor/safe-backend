const { database, admin } = require("../config/firebase");

class FirebaseService {
  /**
   * Save transaction to Firebase (global + user-scoped)
   */
  async saveTransaction(userId, transactionData) {
    try {
      const {
        transactionId,
        orderId,
        amount,
        virtualAccountNumber,
        virtualBankCode,
        expiredAt,
      } = transactionData;

      const updates = {};

      // Global transaction
      updates[`transactions/${transactionId}`] = {
        transactionId,
        invoiceId: orderId,
        transactionAmount: amount,
        transactionStatus: "pending",
        virtualAccountNumber,
        virtualBankCode,
        expiredAt,
        creationTime: admin.database.ServerValue.TIMESTAMP,
        completionTime: null,
        userId,
      };

      // User-scoped reference
      updates[`users/${userId}/transactions/${transactionId}`] = true;

      await database.ref().update(updates);

      return { success: true };
    } catch (error) {
      console.error("Error saving transaction:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    userId,
    transactionId,
    status,
    completionTime = null
  ) {
    try {
      const updates = {
        [`transactions/${transactionId}/transactionStatus`]: status,
      };

      if (completionTime) {
        updates[`transactions/${transactionId}/completionTime`] =
          completionTime;
      }

      await database.ref().update(updates);

      return { success: true };
    } catch (error) {
      console.error("Error updating transaction status:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(userId, transactionId) {
    try {
      const snapshot = await database
        .ref(`transactions/${transactionId}`)
        .once("value");
      const transaction = snapshot.val();

      if (transaction) {
        return { success: true, data: transaction };
      } else {
        return { success: false, error: "Transaction not found" };
      }
    } catch (error) {
      console.error("Error getting transaction:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all pending transactions
   */
  async getPendingTransactions() {
    try {
      const snapshot = await database
        .ref("transactions")
        .orderByChild("transactionStatus")
        .equalTo("pending")
        .once("value");

      const pendingTransactions = [];
      const now = Date.now();

      snapshot.forEach((child) => {
        const transaction = child.val();
        const transactionId = child.key;

        if (
          transaction.expiredAt &&
          now > new Date(transaction.expiredAt).getTime()
        ) {
          // Mark as expired
          this.updateTransactionStatus(
            transaction.userId,
            transactionId,
            "expired"
          );
        } else {
          pendingTransactions.push(transaction);
        }
      });

      return { success: true, data: pendingTransactions };
    } catch (error) {
      console.error("Error getting pending transactions:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate subscription
   */
  /**
   * Activate subscription
   */
  async activateSubscription(userId, amount) {
    try {
      const userRef = database.ref(`users/${userId}`);

      // Fetch user data first
      const snapshot = await userRef.once("value");
      const userData = snapshot.val();

      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      let baseDate = now;

      // If user already has an active subscription
      if (
        userData &&
        userData.subscriptionEndDate &&
        userData.subscriptionEndDate > now
      ) {
        // Extend from current subscription end date
        baseDate = userData.subscriptionEndDate;
      }

      // New subscription end date = baseDate + 30 days
      const subscriptionEndDate = baseDate + thirtyDays;

      await userRef.update({
        isSubscriptionActive: true,
        subscriptionEndDate,
        subscriptionAmount: amount,
      });

      // 🔥 Send FCM notification
      await this.sendSubscriptionSuccessNotification(userId);

      return { success: true };
    } catch (error) {
      console.error("Error activating subscription:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription success notification to user topic
   */
  async sendSubscriptionSuccessNotification(userId) {
    try {
      const message = {
        topic: userId,
        notification: {
          title: "Subscription Activated! 🎉",
          body: "Your subscription has been activated successfully!",
        },
        data: {
          command: "STN_SUBSCRIPTION_SUCCESS",
          message: "Your subscription has been activated successfully!",
        },
        android: {
          notification: {
            priority: "high",
          },
        },
      };

      await admin.messaging().send(message);
      console.log(
        `[FCM] Subscription success notification sent to user ${userId}`
      );
      return { success: true };
    } catch (error) {
      console.error("Error sending subscription notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Archive expired transactions older than 1 year
   */
  async archiveOldExpiredTransactions() {
    try {
      const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
      const cutoff = Date.now() - ONE_YEAR;

      const snapshot = await database
        .ref("transactions")
        .orderByChild("transactionStatus")
        .equalTo("expired")
        .once("value");

      const updates = {};

      snapshot.forEach((child) => {
        const data = child.val();
        const id = child.key;

        if (data.expiredAt && new Date(data.expiredAt).getTime() < cutoff) {
          // Move to archive
          updates[`archive/transactions/${id}`] = data;

          // Remove from global
          updates[`transactions/${id}`] = null;

          // Remove from user-scoped reference
          updates[`users/${data.userId}/transactions/${id}`] = null;
        }
      });

      if (Object.keys(updates).length > 0) {
        await database.ref().update(updates);
        console.log(
          `[Archive] Archived ${
            Object.keys(updates).length / 3
          } old expired transactions`
        );
      } else {
        console.log("[Archive] No expired transactions eligible for archive");
      }
    } catch (error) {
      console.error("Error archiving expired transactions:", error);
      return { success: false, error: error.message };
    }
  }
}



module.exports = new FirebaseService();
