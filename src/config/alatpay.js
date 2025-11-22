// src/config/alatpay.js
module.exports = {
  apiKey: process.env.ALATPAY_API_KEY,
  businessId: process.env.ALATPAY_BUSINESS_ID,
  baseUrl: process.env.ALATPAY_BASE_URL || "https://api.wemapay.com",
  endpoints: {
    generateVirtualAccount: "/bank-transfer/api/v1/bankTransfer/virtualAccount",
    checkTransaction: "/bank-transfer/api/v1/bankTransfer/transactions",
  },
};
