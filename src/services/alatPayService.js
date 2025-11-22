// src/services/alatPayService.js
const axios = require("axios");
const alatConfig = require("../config/alatpay");

class AlatPayService {
  constructor() {
    this.apiKey = alatConfig.apiKey;
    this.businessId = alatConfig.businessId;
    this.baseUrl = alatConfig.baseUrl;
  }

  /**
   * Generate virtual account for payment
   */
  async generateVirtualAccount(amount, orderId, description, customer) {
    try {

        console.log(`Business id is ${this.businessId}`);
        console.log(`API Key is ${this.apiKey}`);
        console.log(`Base URL is ${this.baseUrl}`);

      const response = await axios.post(
        `${this.baseUrl}${alatConfig.endpoints.generateVirtualAccount}`,
        {
          businessId: this.businessId,
          amount: amount,
          currency: "NGN",
          orderId: orderId,
          description: description,
          customer: {
            email: customer.email,
            phone: customer.phone,
            firstName: customer.firstName,
            lastName: customer.lastName,
            metadata: customer.metadata || null,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": this.apiKey,
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.status) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to generate virtual account",
        };
      }
    } catch (error) {
      console.error("Error generating virtual account:", error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}${alatConfig.endpoints.checkTransaction}/${transactionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": this.apiKey,
          },
          timeout: 30000,
        }
      );

      console.log(`Transaction status is ${JSON.stringify(response.data)}`)

      if (response.data && response.data.status) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to check transaction status",
        };
      }
    } catch (error) {
      console.error("Error checking transaction status:", error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

module.exports = new AlatPayService();
