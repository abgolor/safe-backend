// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const paymentRoutes = require("./routes/paymentRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { startTransactionChecker } = require("./jobs/transactionChecker");
const { startArchiveExpiredTransactions } = require("./jobs/archiveExpiredTransactions");


const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;


// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: "*", // In production, specify your Android app's origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/payment", paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Public URL (use this for clients): ${PUBLIC_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

  if (process.env.RUN_JOBS === "true") {
    startTransactionChecker();
    startArchiveExpiredTransactions();
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️  Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⏹️  Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
