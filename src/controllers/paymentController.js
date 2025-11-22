// src/controllers/paymentController.js
const transactionService = require("../services/transactionService");
const firebaseService = require("../services/firebaseService");

class PaymentController {
  /**
   * Create virtual account for payment
   * POST /api/payment/create
   */
  async createPayment(req, res) {
    try {
      const userId = req.user.uid; // From auth middleware
      const { amount, userInfo } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount",
        });
      }

      if (!userInfo || !userInfo.email || !userInfo.phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "User information is required",
        });
      }

      // Create payment
      const result = await transactionService.createPayment(
        userId,
        amount,
        userInfo
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Virtual account created successfully",
        data: result.data,
      });
    } catch (error) {
      console.error("Error in createPayment:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Check transaction status
   * GET /api/payment/status/:transactionId
   */
  async checkStatus(req, res) {
    try {
      const userId = req.user.uid;
      const { transactionId } = req.params;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: "Transaction ID is required",
        });
      }

      const result = await transactionService.checkAndUpdateStatus(
        userId,
        transactionId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transaction status retrieved successfully",
        data: result.data,
      });
    } catch (error) {
      console.error("Error in checkStatus:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Get user's transaction history
   * GET /api/payment/transactions
   */
  async getTransactions(req, res) {
    try {
      const userId = req.user.uid;

      const result = await firebaseService.getUser(userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const transactions = result.data.transactionDetails || {};

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error("Error in getTransactions:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Get specific transaction details
   * GET /api/payment/transaction/:transactionId
   */
  async getTransaction(req, res) {
    try {
      const userId = req.user.uid;
      const { transactionId } = req.params;

      const result = await firebaseService.getTransaction(
        userId,
        transactionId
      );

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: "Transaction not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error in getTransaction:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

module.exports = new PaymentController();
