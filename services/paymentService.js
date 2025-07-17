const { Order } = require('../models/database');

/**
 * Payment Service - Handles payment operations
 */
class PaymentService {
  constructor() {
    // UPI payment configuration
    this.upiId = process.env.UPI_ID || 'restaurant@paytm'; // Replace with actual UPI ID
    this.restaurantName = process.env.RESTAURANT_NAME || 'Delicious Bites';
  }

  /**
   * Generate UPI payment link
   * @param {Object} order - Order object
   * @returns {string} UPI payment link
   */
  generateUPILink(order) {
    const amount = parseFloat(order.totalAmount);
    const orderId = order.orderId;
    const description = `Payment for Order ${orderId}`;
    
    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${this.upiId}&pn=${encodeURIComponent(this.restaurantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}&tr=${orderId}`;
    
    return upiLink;
  }

  /**
   * Generate payment QR code URL (using QR code API)
   * @param {string} upiLink - UPI payment link
   * @returns {string} QR code image URL
   */
  generateQRCode(upiLink) {
    // Using a free QR code API
    const encodedUPI = encodeURIComponent(upiLink);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUPI}`;
  }

  /**
   * Update payment status for an order
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - Payment status ('pending', 'paid', 'cod', 'failed')
   * @param {string} paymentMethod - Payment method
   * @param {string} paymentId - Payment transaction ID (optional)
   * @returns {Promise<Object|null>} Updated order or null
   */
  async updatePaymentStatus(orderId, paymentStatus, paymentMethod = null, paymentId = null) {
    try {
      const order = await Order.findOne({ where: { orderId } });
      if (!order) {
        return null;
      }

      const updateData = { paymentStatus };
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (paymentId) updateData.paymentId = paymentId;

      await order.update(updateData);
      return order;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return null;
    }
  }

  /**
   * Get payment options message for customer
   * @param {Object} order - Order object
   * @returns {string} Payment options message
   */
  getPaymentOptionsMessage(order) {
    return `💳 *Payment Options for Order #${order.orderId}*\n\n` +
      `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n` +
      `*Choose your payment method:*\n\n` +
      `🚚 *1. Cash on Delivery (COD)*\n` +
      `   Reply: "pay cod"\n` +
      `   Pay when food is delivered\n\n` +
      `� *2. UPI Payment (Instant)*\n` +
      `   Reply: "pay upi"\n` +
      `   PhonePe, Google Pay, Paytm, etc.\n\n` +
      `❓ Need help? Reply "payment help"`;
  }

  /**
   * Get UPI payment details message
   * @param {Object} order - Order object
   * @returns {string} UPI payment message
   */
  getUPIPaymentMessage(order) {
    const upiLink = this.generateUPILink(order);
    const qrCodeUrl = this.generateQRCode(upiLink);
    
    return `📱 *UPI Payment for Order #${order.orderId}*\n\n` +
      `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n` +
      `*Payment Methods:*\n\n` +
      `🔗 *Option 1: Click UPI Link*\n` +
      `${upiLink}\n\n` +
      `📸 *Option 2: Scan QR Code*\n` +
      `${qrCodeUrl}\n\n` +
      `💳 *Option 3: Manual Transfer*\n` +
      `UPI ID: ${this.upiId}\n` +
      `Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
      `Reference: ${order.orderId}\n\n` +
      `✅ After payment, reply "paid [transaction_id]"\n` +
      `📞 Or call us to confirm payment!`;
  }



  /**
   * Get COD confirmation message
   * @param {Object} order - Order object
   * @returns {string} COD confirmation message
   */
  getCODConfirmationMessage(order) {
    return `🚚 *Cash on Delivery Selected*\n\n` +
      `📋 Order #${order.orderId}\n` +
      `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n` +
      `✅ Your order is confirmed!\n` +
      `💵 Please keep exact cash ready for delivery\n\n` +
      `🕐 Estimated delivery: 30-45 minutes\n` +
      `📱 We'll notify you when order is ready!`;
  }

  /**
   * Get payment help message
   * @returns {string} Payment help message
   */
  getPaymentHelpMessage() {
    return `💡 *Payment Help*\n\n` +
      `*Available Payment Methods:*\n\n` +
      `🚚 *Cash on Delivery (COD)*\n` +
      `   Type: "pay cod"\n` +
      `   Pay when food is delivered\n` +
      `   No advance payment needed\n\n` +
      `📱 *UPI Payment (Instant)*\n` +
      `   Type: "pay upi"\n` +
      `   PhonePe, Google Pay, Paytm, etc.\n` +
      `   Get UPI link and QR code\n\n` +
      `*Commands:*\n` +
      `- "payment status" - Check payment status\n` +
      `- "paid [transaction_id]" - Confirm UPI payment\n` +
      `- "payment help" - This help message\n\n` +
      `📞 Need assistance? Call us directly!`;
  }

  /**
   * Get payment status message
   * @param {Object} order - Order object
   * @returns {string} Payment status message
   */
  getPaymentStatusMessage(order) {
    const statusEmojis = {
      'pending': '⏳',
      'paid': '✅',
      'cod': '🚚',
      'failed': '❌'
    };

    const methodNames = {
      'cod': 'Cash on Delivery',
      'upi': 'UPI Payment',
      'card': 'Card Payment',
      'bank_transfer': 'Bank Transfer',
      'wallet': 'Digital Wallet'
    };

    return `💳 *Payment Status*\n\n` +
      `📋 Order #${order.orderId}\n` +
      `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
      `📊 Order Status: ${order.status.toUpperCase()}\n` +
      `${statusEmojis[order.paymentStatus]} Payment: ${order.paymentStatus.toUpperCase()}\n` +
      `💳 Method: ${methodNames[order.paymentMethod] || 'Not selected'}\n\n` +
      (order.paymentId ? `🆔 Payment ID: ${order.paymentId}\n\n` : '') +
      `${order.paymentStatus === 'pending' ? '💡 Need to pay? Reply "payment options"' : ''}` +
      `${order.paymentStatus === 'paid' ? '🎉 Payment confirmed! Order in progress.' : ''}` +
      `${order.paymentStatus === 'cod' ? '🚚 Pay cash when delivered.' : ''}`;
  }

  /**
   * Validate and process payment confirmation
   * @param {string} orderId - Order ID
   * @param {string} transactionId - Transaction ID provided by customer
   * @param {string} method - Payment method
   * @returns {Promise<Object>} Validation result
   */
  async confirmPayment(orderId, transactionId, method = 'upi') {
    try {
      // In a real implementation, this would verify with payment gateway
      // For now, we'll accept the transaction ID and mark as paid
      
      const order = await this.updatePaymentStatus(orderId, 'paid', method, transactionId);
      
      if (!order) {
        return {
          success: false,
          message: `❌ Order #${orderId} not found.`
        };
      }

      return {
        success: true,
        order: order,
        message: `✅ *Payment Confirmed!*\n\n` +
          `📋 Order #${orderId}\n` +
          `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
          `🆔 Transaction ID: ${transactionId}\n\n` +
          `🎉 Payment received successfully!\n` +
          `👨‍🍳 Your order is now being prepared.\n\n` +
          `📱 We'll notify you when it's ready for delivery!`
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        message: '❌ Error confirming payment. Please try again or contact support.'
      };
    }
  }
}

module.exports = PaymentService;
