const { Customer } = require('../models/database');

/**
 * Customer Service - Handles customer data and onboarding
 */
class CustomerService {
  /**
   * Check if customer exists and has provided their name
   * @param {string} phone - Customer phone number
   * @returns {Promise<Object>} Customer data or null
   */
  async getCustomer(phone) {
    try {
      return await Customer.findOne({ where: { phone } });
    } catch (error) {
      console.error('Error getting customer:', error);
      return null;
    }
  }

  /**
   * Check if customer is new (no name provided)
   * @param {string} phone - Customer phone number
   * @returns {Promise<boolean>} True if customer is new or has no name
   */
  async isNewCustomer(phone) {
    try {
      const customer = await this.getCustomer(phone);
      return !customer || !customer.name || customer.name === 'Customer';
    } catch (error) {
      console.error('Error checking if customer is new:', error);
      return true;
    }
  }

  /**
   * Check if customer needs current location for this session
   * @param {string} phone - Customer phone number
   * @returns {Promise<boolean>} True if customer needs to provide current location
   */
  async needsCurrentLocation(phone) {
    try {
      const customer = await this.getCustomer(phone);
      if (!customer || !customer.name || customer.name === 'Customer') {
        return false; // New customer should go through name flow first
      }
      
      // Check if customer needs to provide current location for this session
      const now = new Date();
      const lastUpdate = customer.lastLocationUpdate;
      
      // Ask for current location if:
      // 1. No current location set, OR
      // 2. Last location update was more than 30 minutes ago, OR  
      // 3. Session is not active
      if (!customer.currentLocation || 
          !lastUpdate || 
          (now - lastUpdate) > (30 * 60 * 1000) || // 30 minutes
          !customer.sessionActive) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if customer needs current location:', error);
      return true; // Default to asking for location
    }
  }

  /**
   * Check if customer needs location (has name but no location) - for initial onboarding
   * @param {string} phone - Customer phone number
   * @returns {Promise<boolean>} True if customer needs to provide location
   */
  async needsLocation(phone) {
    try {
      const customer = await this.getCustomer(phone);
      return customer && customer.name && customer.name !== 'Customer' && !customer.location;
    } catch (error) {
      console.error('Error checking if customer needs location:', error);
      return false;
    }
  }

  /**
   * Check if customer onboarding is complete (has both name and location)
   * @param {string} phone - Customer phone number
   * @returns {Promise<boolean>} True if customer onboarding is complete
   */
  async isOnboardingComplete(phone) {
    try {
      const customer = await this.getCustomer(phone);
      return customer && customer.name && customer.name !== 'Customer' && customer.location;
    } catch (error) {
      console.error('Error checking if customer onboarding is complete:', error);
      return false;
    }
  }

  /**
   * Update customer name
   * @param {string} phone - Customer phone number
   * @param {string} name - Customer name
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomerName(phone, name) {
    try {
      let customer = await Customer.findOne({ where: { phone } });
      
      if (!customer) {
        customer = await Customer.create({
          phone,
          name: name.trim(),
          location: null,
          totalOrders: 0,
          lastOrderDate: new Date(),
          preferredItems: []
        });
      } else {
        await customer.update({
          name: name.trim()
        });
      }
      
      return customer;
    } catch (error) {
      console.error('Error updating customer name:', error);
      throw error;
    }
  }

  /**
   * Update customer location
   * @param {string} phone - Customer phone number
   * @param {string} location - Customer location
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomerLocation(phone, location) {
    try {
      let customer = await Customer.findOne({ where: { phone } });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      await customer.update({
        location: location.trim()
      });
      
      return customer;
    } catch (error) {
      console.error('Error updating customer location:', error);
      throw error;
    }
  }

  /**
   * Update customer current location for this session
   * @param {string} phone - Customer phone number
   * @param {string} currentLocation - Current location
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCurrentLocation(phone, currentLocation) {
    try {
      let customer = await Customer.findOne({ where: { phone } });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      await customer.update({
        currentLocation: currentLocation.trim(),
        lastLocationUpdate: new Date(),
        sessionActive: true
      });
      
      return customer;
    } catch (error) {
      console.error('Error updating current location:', error);
      throw error;
    }
  }

  /**
   * Mark session as inactive (when customer leaves or after timeout)
   * @param {string} phone - Customer phone number
   * @returns {Promise<Object>} Updated customer data
   */
  async endSession(phone) {
    try {
      let customer = await Customer.findOne({ where: { phone } });
      
      if (customer) {
        await customer.update({
          sessionActive: false
        });
      }
      
      return customer;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Check if message is a name response
   * @param {string} message - User message
   * @returns {Object|null} Parsed name or null
   */
  parseNameResponse(message) {
    const normalizedMessage = message.trim();
    
    // Skip common non-name messages
    const skipMessages = [
      'menu', 'help', 'hi', 'hello', 'order', 'status', 'search',
      'yes', 'no', 'ok', 'thanks', 'thank you', 'payment', 'pay', 'paid',
      'payment help', 'payment options', 'payment status', 'pay cod', 'pay upi'
    ];
    
    if (skipMessages.includes(normalizedMessage.toLowerCase())) {
      return null;
    }
    
    // Skip if it looks like an order command
    if (normalizedMessage.toLowerCase().match(/(order|want|get me|i want)\s+/)) {
      return null;
    }
    
    // Skip if it looks like a payment command
    if (normalizedMessage.toLowerCase().match(/^(pay|payment|paid)\s/)) {
      return null;
    }
    
    // Extract name (simple validation)
    if (normalizedMessage.length >= 2 && normalizedMessage.length <= 50) {
      // Remove common prefixes
      let cleanName = normalizedMessage
        .replace(/^(my name is|i am|i'm|name is|call me)/i, '')
        .trim();
      
      // Basic name validation (letters, spaces, common characters)
      if (cleanName.match(/^[a-zA-Z\s\-'.]{2,50}$/)) {
        return {
          name: cleanName.replace(/\b\w/g, l => l.toUpperCase()) // Title case
        };
      }
    }
    
    return null;
  }

  /**
   * Check if message is a location response
   * @param {string} message - User message
   * @returns {Object|null} Parsed location or null
   */
  parseLocationResponse(message) {
    const normalizedMessage = message.trim();
    
    // Skip common non-location messages
    const skipMessages = [
      'menu', 'help', 'hi', 'hello', 'order', 'status', 'search',
      'yes', 'no', 'ok', 'thanks', 'thank you'
    ];
    
    if (skipMessages.includes(normalizedMessage.toLowerCase())) {
      return null;
    }
    
    // Skip if it looks like an order command
    if (normalizedMessage.toLowerCase().match(/(order|want|get me|i want)\s+/)) {
      return null;
    }
    
    // Extract location (more flexible validation)
    if (normalizedMessage.length >= 3 && normalizedMessage.length <= 200) {
      // Remove common prefixes
      let cleanLocation = normalizedMessage
        .replace(/^(my location is|i am at|i'm at|location is|i live at|address is)/i, '')
        .trim();
      
      // Basic location validation (allow letters, numbers, spaces, common punctuation)
      if (cleanLocation.match(/^[a-zA-Z0-9\s\-',.()\/#&]+$/)) {
        return {
          location: cleanLocation
        };
      }
    }
    
    return null;
  }

  /**
   * Generate welcome message for new customer
   * @param {string} restaurantName - Restaurant name
   * @returns {string} Welcome message
   */
  generateWelcomeMessage(restaurantName = 'our restaurant') {
    return `👋 *Welcome to ${restaurantName}!*\n\n` +
      `🙏 To get started, could you please tell me your name?\n\n` +
      `💡 Just type your name and I'll remember it for future orders!`;
  }

  /**
   * Generate name confirmation and location request message
   * @param {string} name - Customer name
   * @param {string} restaurantName - Restaurant name
   * @returns {string} Confirmation message requesting location
   */
  generateNameConfirmationMessage(name, restaurantName = 'our restaurant') {
    return `✅ Nice to meet you, ${name}!\n\n` +
      `📍 *Now, could you please share your location?*\n\n` +
      `💡 This helps us:\n` +
      `• Calculate delivery time\n` +
      `• Confirm delivery area\n` +
      `• Provide better service\n\n` +
      `📝 Just type your address or area name (e.g., "MG Road, Bangalore" or "Sector 15, Gurgaon")`;
  }

  /**
   * Generate location confirmation and instructions message
   * @param {string} name - Customer name
   * @param {string} location - Customer location
   * @param {string} restaurantName - Restaurant name
   * @returns {string} Location confirmation with instructions
   */
  generateLocationConfirmationMessage(name, location, restaurantName = 'our restaurant') {
    return `📍 Perfect! We've saved your location: *${location}*\n\n` +
      `🎉 *Welcome to ${restaurantName}, ${name}!*\n\n` +
      `🍽️ *Here's how to order:*\n` +
      `• Type 'menu' - See our full menu\n` +
      `• Type 'order [quantity] [item name]' - Place an order\n` +
      `• Example: "order 2 chicken biryani"\n` +
      `• Type 'help' - Get detailed help\n` +
      `• Type 'status' - Check your order status\n\n` +
      `🔍 *You can also search:*\n` +
      `• Type 'search chicken' - Find chicken items\n\n` +
      `🚀 Ready to order? Type 'menu' to see what's available!`;
  }

  /**
   * Generate returning customer greeting
   * @param {string} name - Customer name
   * @param {string} location - Customer location
   * @param {number} totalOrders - Total previous orders
   * @returns {string} Returning customer message
   */
  generateReturningCustomerMessage(name, location = null, totalOrders = 0) {
    const greetings = [
      `👋 Welcome back, ${name}!`,
      `🎉 Great to see you again, ${name}!`,
      `😊 Hello ${name}! Nice to have you back!`
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    let message = randomGreeting;
    
    if (location) {
      message += ` 📍 ${location}`;
    }
    
    if (totalOrders > 0) {
      message += `\n(${totalOrders} previous orders)\n\n`;
    } else {
      message += `\n\n`;
    }
    
    message += `🍽️ *Quick Commands:*\n` +
      `• 'menu' - See today's menu\n` +
      `• 'order [item name]' - Place an order\n` +
      `• 'status' - Check order status\n` +
      `• 'help' - Get help\n\n` +
      `What would you like to do today?`;
    
    return message;
  }

  /**
   * Generate current location request message
   * @param {string} name - Customer name
   * @param {string} restaurantName - Restaurant name
   * @returns {string} Current location request message
   */
  generateCurrentLocationRequest(name, restaurantName = 'our restaurant') {
    return `👋 Hi ${name}! Welcome back to ${restaurantName}!\n\n` +
      `📍 *Where are you right now?*\n\n` +
      `🚚 This helps us:\n` +
      `• Calculate accurate delivery time\n` +
      `• Check delivery availability\n` +
      `• Understand urgency\n\n` +
      `📝 Please share your current location:\n` +
      `💡 Example: "Office at Cyber City" or "Home in Koramangala" or "Near Metro Station"`;
  }

  /**
   * Generate current location confirmation message
   * @param {string} name - Customer name
   * @param {string} currentLocation - Current location
   * @param {string} savedLocation - Saved home location
   * @returns {string} Current location confirmation
   */
  generateCurrentLocationConfirmation(name, currentLocation, savedLocation = null) {
    let message = `📍 Got it, ${name}! You're currently at: *${currentLocation}*\n\n`;
    
    message += `🍽️ *Ready to order!*\n` +
      `• Type 'menu' - See our menu\n` +
      `• Type 'order [item name]' - Place an order\n` +
      `• Type 'help' - Get help\n\n` +
      `⚡ We'll calculate delivery time based on your current location!`;
    
    return message;
  }
}

module.exports = CustomerService;
