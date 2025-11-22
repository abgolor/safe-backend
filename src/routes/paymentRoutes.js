// src/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// Create payment (generate virtual account)
router.post("/create", paymentController.createPayment);

// Check transaction status
router.get("/status/:transactionId", paymentController.checkStatus);

// Get all transactions for user
router.get("/transactions", paymentController.getTransactions);

// Get specific transaction
router.get("/transaction/:transactionId", paymentController.getTransaction);

module.exports = router;
