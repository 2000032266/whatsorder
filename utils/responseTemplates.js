/**
 * Response Templates - Predefined response messages
 */
class ResponseTemplates {
  /**
   * Get error message for invalid order
   * @param {string} reason - Reason for invalid order
   * @returns {string} Error message
   */
  static getInvalidOrderMessage(reason = 'item not found') {
    const messages = {
      'item not found': "❌ Sorry, I couldn't find that item in our menu. Please check the menu and try again with the correct item name or number.",
      'invalid quantity': "❌ Please specify a valid quantity (1 or more). Example: 'Order 2 Chicken Biryani'",
      'item unavailable': "❌ Sorry, this item is currently unavailable. Please choose from our available menu items.",
      'invalid format': "❌ I didn't understand your order format. Please try:\n• 'Order 2 Chicken Biryani'\n• 'Order 1 item 3'\n• 'Order 3 #1'"
    };

    return messages[reason] || messages['invalid format'];
  }

  /**
   * Get unknown message response
   * @param {Array} suggestions - Array of suggestions
   * @returns {string} Unknown message response
   */
  static getUnknownMessageResponse(suggestions = []) {
    let response = "🤔 I'm not sure I understand. Here's what you can do:\n\n";
    response += "📱 *Available Commands:*\n";
    response += "• 'menu' - View today's menu\n";
    response += "• 'order [quantity] [item name]' - Place an order\n";
    response += "• 'help' - Get detailed instructions\n";
    response += "• 'status' - Check your recent orders\n\n";

    if (suggestions.length > 0) {
      response += "💡 *Suggestions:*\n";
      suggestions.forEach(suggestion => {
        response += `• ${suggestion}\n`;
      });
    }

    return response;
  }

  /**
   * Get order success message with payment options
   * @param {Object} order - Order object
   * @param {boolean} customerNotified - Whether customer was notified
   * @param {boolean} ownerNotified - Whether owner was notified
   * @returns {string} Success message
   */
  static getOrderSuccessMessage(order, customerNotified = true, ownerNotified = true) {
    let message = `✅ Order placed successfully!\n\n` +
      `📋 Order ID: *${order.orderId}*\n` +
      `💰 Total: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n`;

    if (customerNotified && ownerNotified) {
      message += `🕐 We'll notify you when your order is ready!\n\n`;
    } else if (!customerNotified || !ownerNotified) {
      message += `⚠️ Order saved but notifications limited due to daily message quota.\n`;
      message += `📞 Please check the restaurant dashboard or call directly for updates.\n\n`;
    }

    // Add payment options
    message += `💳 *Next Step: Choose Payment Method*\n\n` +
      `Reply with one of these:\n` +
      `🚚 "pay cod" - Cash on Delivery\n` +
      `📱 "pay upi" - UPI Payment (instant)\n\n` +
      `❓ Need help? Type "payment help"`;

    return message;
  }

  /**
   * Get no recent orders message
   * @returns {string} No orders message
   */
  static getNoRecentOrdersMessage() {
    return "📋 You don't have any recent orders.\n\n" +
      "🍽️ Type 'menu' to see our delicious offerings and place your first order!";
  }

  /**
   * Get recent orders message
   * @param {Array} orders - Array of recent orders
   * @returns {string} Recent orders message
   */
  static getRecentOrdersMessage(orders) {
    let message = "📋 *Your Recent Orders:*\n\n";
    
    orders.slice(0, 5).forEach((order, index) => {
      message += `${index + 1}. Order #${order.orderId}\n`;
      message += `   📅 ${order.orderDate.toLocaleDateString()}\n`;
      message += `   💰 ₹${parseFloat(order.totalAmount).toFixed(2)}\n`;
      message += `   📊 Status: ${order.status.toUpperCase()}\n\n`;
    });

    if (orders.length > 5) {
      message += `... and ${orders.length - 5} more orders\n\n`;
    }

    message += "💡 Need to place a new order? Type 'menu' to get started!";
    
    return message;
  }

  /**
   * Get search results message
   * @param {Array} results - Search results
   * @param {string} searchTerm - Search term
   * @returns {string} Search results message
   */
  static getSearchResultsMessage(results, searchTerm) {
    if (results.length === 0) {
      return `🔍 No items found for "${searchTerm}".\n\n` +
        "💡 Try searching with different keywords or type 'menu' to see all available items.";
    }

    let message = `🔍 *Search Results for "${searchTerm}":*\n\n`;
    
    results.forEach(item => {
      message += `${item.emoji} *${item.id}. ${item.name}* - ₹${item.price}\n`;
      message += `   _${item.description}_\n\n`;
    });

    message += "📱 To order any item, type: 'Order [quantity] [item name]'";
    
    return message;
  }

  /**
   * Get menu loading error message
   * @returns {string} Error message
   */
  static getMenuLoadingErrorMessage() {
    return "❌ Sorry, there was an error loading our menu. Please try again in a moment.\n\n" +
      "If the problem persists, please contact our support team.";
  }

  /**
   * Get order creation error message
   * @returns {string} Error message
   */
  static getOrderCreationErrorMessage() {
    return "❌ Sorry, there was an error processing your order. Please try again.\n\n" +
      "If the problem continues, please contact our support team.";
  }

  /**
   * Get system maintenance message
   * @returns {string} Maintenance message
   */
  static getMaintenanceMessage() {
    return "🔧 Our ordering system is currently under maintenance.\n\n" +
      "Please try again later or contact us directly for assistance.\n\n" +
      "Thank you for your patience! 🙏";
  }

  /**
   * Get business hours message
   * @returns {string} Business hours message
   */
  static getBusinessHoursMessage() {
    return "🕐 *Our Business Hours:*\n\n" +
      "Monday - Friday: 10:00 AM - 10:00 PM\n" +
      "Saturday - Sunday: 11:00 AM - 11:00 PM\n\n" +
      "📱 You can place orders during these hours.\n" +
      "Orders placed outside business hours will be processed the next day.";
  }

  /**
   * Get thank you message
   * @returns {string} Thank you message
   */
  static getThankYouMessage() {
    return "🙏 Thank you for choosing our restaurant!\n\n" +
      "We appreciate your business and hope you enjoy your meal.\n\n" +
      "📱 Feel free to reach out anytime for more orders!";
  }
}

module.exports = ResponseTemplates;
