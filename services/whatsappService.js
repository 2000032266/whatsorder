const twilio = require('twilio');

/**
 * WhatsApp Service - Handles Twilio WhatsApp API operations
 */
class WhatsAppService {
  constructor(accountSid, authToken, phoneNumber) {
    this.client = twilio(accountSid, authToken);
    this.phoneNumber = phoneNumber;
  }

  /**
   * Send WhatsApp message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message text
   * @returns {Promise<Object>} Message response
   */
  async sendMessage(to, message) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });
      
      console.log(`✅ Message sent to ${to}: ${response.sid}`);
      return response;
    } catch (error) {
      // Handle specific Twilio errors
      if (error.code === 63038) {
        console.warn(`⚠️ Daily message limit exceeded for ${to}. Order processed but notification not sent.`);
        return { 
          success: false, 
          error: 'DAILY_LIMIT_EXCEEDED',
          message: 'Daily message limit exceeded' 
        };
      } else if (error.code === 21211) {
        console.warn(`⚠️ Invalid phone number: ${to}`);
        return { 
          success: false, 
          error: 'INVALID_PHONE_NUMBER',
          message: 'Invalid phone number' 
        };
      } else {
        console.error('❌ Error sending WhatsApp message:', error.message || error);
        return { 
          success: false, 
          error: 'SEND_ERROR',
          message: error.message || 'Unknown error' 
        };
      }
    }
  }

  /**
   * Send order confirmation to customer
   * @param {string} customerPhone - Customer phone number
   * @param {Object} order - Order object
   * @returns {Promise<Object>} Message response
   */
  async sendOrderConfirmation(customerPhone, order) {
    const message = this.formatOrderConfirmation(order);
    const result = await this.sendMessage(customerPhone, message);
    
    if (result.success === false) {
      console.log(`📝 Order ${order.orderId} processed but customer notification failed: ${result.message}`);
      this.logOrderFallback(order, 'customer');
    }
    
    return result;
  }

  /**
   * Send order notification to restaurant owner
   * @param {string} ownerPhone - Owner phone number
   * @param {Object} order - Order object
   * @returns {Promise<Object>} Message response
   */
  async sendOwnerNotification(ownerPhone, order) {
    const message = this.formatOwnerNotification(order);
    const result = await this.sendMessage(ownerPhone, message);
    
    if (result.success === false) {
      console.log(`📝 Order ${order.orderId} processed but owner notification failed: ${result.message}`);
      this.logOrderFallback(order, 'owner');
    }
    
    return result;
  }

  /**
   * Format order confirmation message for customer
   * @param {Object} order - Order object
   * @returns {string} Formatted message
   */
  formatOrderConfirmation(order) {
    let message = `🎉 *Thank you for your order!*\n\n`;
    message += `📋 Order ID: *${order.orderId}*\n`;
    message += `📅 Date: ${order.orderDate.toLocaleDateString()}\n`;
    message += `🕐 Time: ${order.orderDate.toLocaleTimeString()}\n\n`;
    
    message += `🛍️ *Your Order:*\n`;
    order.items.forEach(item => {
      message += `• ${item.quantity}x ${item.name} - ₹${item.total.toFixed(2)}\n`;
    });
    
    message += `\n💰 *Total: ₹${order.totalAmount.toFixed(2)}*\n\n`;
    message += `⏱️ Estimated preparation time: 15-20 minutes\n`;
    message += `📱 We'll send you updates about your order status\n\n`;
    message += `🙏 Thank you for choosing us!`;
    
    return message;
  }

  /**
   * Format owner notification message
   * @param {Object} order - Order object
   * @returns {string} Formatted message
   */
  formatOwnerNotification(order) {
    let message = `🔔 *NEW ORDER RECEIVED*\n\n`;
    message += `📋 Order ID: *${order.orderId}*\n`;
    message += `👤 Customer: ${order.customerName}\n`;
    message += `📞 Phone: ${order.customerPhone}\n`;
    
    // Add delivery location information
    if (order.deliveryAddress && order.deliveryAddress.trim()) {
      message += `📍 *Delivery Location:*\n`;
      message += `   ${order.deliveryAddress}\n`;
    }
    
    message += `📅 Time: ${order.orderDate.toLocaleTimeString()}\n\n`;
    
    message += `📝 *Items:*\n`;
    order.items.forEach(item => {
      message += `• ${item.quantity}x ${item.name}\n`;
    });
    
    message += `\n💰 *Total: ₹${parseFloat(order.totalAmount).toFixed(2)}*\n\n`;
    
    // Add location-based urgency indicators
    if (order.deliveryAddress) {
      const location = order.deliveryAddress.toLowerCase();
      if (location.includes('hospital') || location.includes('emergency')) {
        message += `🚨 *HIGH PRIORITY - HOSPITAL/EMERGENCY*\n`;
      } else if (location.includes('airport') || location.includes('station') || location.includes('railway')) {
        message += `⚡ *URGENT - TRAVEL LOCATION*\n`;
      } else if (location.includes('office') && location.includes('late')) {
        message += `🏢 *WORK URGENCY - LATE OFFICE*\n`;
      }
    }
    
    message += `⚡ Please prepare this order and update the status accordingly.`;
    
    return message;
  }

  /**
   * Send welcome message
   * @param {string} to - Recipient phone number
   * @param {string} customerName - Customer name
   * @returns {Promise<Object>} Message response
   */
  async sendWelcomeMessage(to, customerName = 'Customer') {
    const message = `👋 Welcome to our restaurant, ${customerName}!\n\n` +
      `🍽️ You can:\n` +
      `• Type 'menu' or 'hi' to see today's menu\n` +
      `• Place orders like: 'Order 2 Chicken Biryani'\n` +
      `• Use item numbers: 'Order 1 item 3'\n` +
      `• Ask for 'help' if you need assistance\n\n` +
      `We're here to serve you delicious food! 😊`;
    
    return await this.sendMessage(to, message);
  }

  /**
   * Send help message
   * @param {string} to - Recipient phone number
   * @returns {Promise<Object>} Message response
   */
  async sendHelpMessage(to) {
    const message = `❓ *How to use our WhatsApp ordering system:*\n\n` +
      `📋 *Commands:*\n` +
      `• 'menu' or 'hi' - View today's menu\n` +
      `• 'order [quantity] [item name]' - Place an order\n` +
      `• 'order [quantity] item [number]' - Order by item number\n` +
      `• 'help' - Show this help message\n` +
      `• 'status' - Check your recent orders\n\n` +
      `📱 *Examples:*\n` +
      `• "Order 2 Chicken Biryani"\n` +
      `• "Order 1 item 3"\n` +
      `• "Order 3 #1"\n\n` +
      `💡 Need assistance? Just ask us anything!`;
    
    return await this.sendMessage(to, message);
  }

  /**
   * Send order status update
   * @param {string} customerPhone - Customer phone number
   * @param {Object} order - Order object
   * @param {string} status - New status
   * @returns {Promise<Object>} Message response
   */
  async sendStatusUpdate(customerPhone, order, status) {
    const statusMessages = {
      confirmed: `✅ Your order #${order.orderId} has been confirmed and is being prepared!`,
      preparing: `👨‍🍳 Your order #${order.orderId} is being prepared with love!`,
      ready: `🎉 Great news! Your order #${order.orderId} is ready for pickup/delivery!`,
      completed: `✅ *Order Completed!*\n\n🎉 Your order #${order.orderId} has been completed and is ready for pickup!\n💰 Total: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n📍 Please come to collect your order.\nThank you for choosing us! 😊`,
      delivered: `📦 Your order #${order.orderId} has been delivered. Enjoy your meal! 😊`,
      cancelled: `❌ Sorry, your order #${order.orderId} has been cancelled. Please contact us for details.`
    };

    const message = statusMessages[status] || `📊 Order #${order.orderId} status updated to: ${status}`;
    return await this.sendMessage(customerPhone, message);
  }

  /**
   * Log order for fallback when WhatsApp fails
   * @param {Object} order - Order object
   * @param {string} type - Type of notification (customer/owner)
   */
  logOrderFallback(order, type) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      orderId: order.orderId,
      customer: order.customerName,
      phone: order.customerPhone,
      total: order.totalAmount,
      items: order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
    };

    console.log(`📝 FALLBACK NOTIFICATION LOG (${type.toUpperCase()}):`, JSON.stringify(logEntry, null, 2));
    
    // You could also write to a file or send to an email service here
    // Example: fs.appendFileSync('fallback-notifications.log', JSON.stringify(logEntry) + '\n');
  }
}

module.exports = WhatsAppService;
