const MenuService = require('../services/menuService');
const OrderService = require('../services/orderService');
const CustomerService = require('../services/customerService');

/**
 * Message Parser - Handles parsing and understanding user messages
 */
class MessageParser {
  constructor() {
    this.menuService = new MenuService();
    this.orderService = new OrderService();
    this.customerService = new CustomerService();
  }

  /**
   * Parse incoming message and determine intent
   * @param {string} message - User message
   * @param {string} customerPhone - Customer phone number
   * @returns {Promise<Object>} Parsed result with intent and data
   */
  async parseMessage(message, customerPhone) {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Payment commands (check early to handle payment flows, even for new customers)
    if (this.isPaymentCommand(normalizedMessage)) {
      return this.parsePaymentCommand(normalizedMessage, customerPhone);
    }
    
    // Check if customer is new and needs onboarding (but not for owner)
    if (!this.isOwnerPhone(customerPhone)) {
      const isNewCustomer = await this.customerService.isNewCustomer(customerPhone);
      const needsLocation = await this.customerService.needsLocation(customerPhone);
      const needsCurrentLocation = await this.customerService.needsCurrentLocation(customerPhone);
      
      if (isNewCustomer) {
        // Check if this message contains a name
        const nameData = this.customerService.parseNameResponse(message);
        if (nameData) {
          return {
            intent: 'save_customer_name',
            data: { name: nameData.name, phone: customerPhone }
          };
        }
        
        // If it's a greeting or any other message and customer is new, ask for name
        return {
          intent: 'request_customer_name',
          data: { phone: customerPhone }
        };
      } else if (needsLocation) {
        // Customer has name but needs initial location (onboarding)
        const locationData = this.customerService.parseLocationResponse(message);
        if (locationData) {
          return {
            intent: 'save_customer_location',
            data: { location: locationData.location, phone: customerPhone }
          };
        }
        
        // If message doesn't look like location, ask for location again
        return {
          intent: 'request_customer_location',
          data: { phone: customerPhone }
        };
      } else if (needsCurrentLocation) {
        // Customer needs to provide current location for this session
        const locationData = this.customerService.parseLocationResponse(message);
        if (locationData) {
          return {
            intent: 'save_current_location',
            data: { currentLocation: locationData.location, phone: customerPhone }
          };
        }
        
        // If message doesn't look like location, ask for current location
        return {
          intent: 'request_current_location',
          data: { phone: customerPhone }
        };
      }
    }

    // Order request (check first to avoid conflicts with greetings)
    const orderData = await this.parseOrderMessage(normalizedMessage);
    if (orderData) {
      return {
        intent: 'place_order',
        data: orderData
      };
    }

    // Help request
    if (this.isHelpRequest(normalizedMessage)) {
      return {
        intent: 'help',
        data: {}
      };
    }

    // Order status request
    if (this.isStatusRequest(normalizedMessage)) {
      return {
        intent: 'order_status',
        data: { customerPhone }
      };
    }

    // Owner commands (only for restaurant owner)
    if (this.isOwnerPhone(customerPhone)) {
      const ownerCommand = this.parseOwnerCommand(normalizedMessage);
      if (ownerCommand) {
        return ownerCommand;
      }
    }

    // Greeting and menu request
    if (this.isGreeting(normalizedMessage) || this.isMenuRequest(normalizedMessage)) {
      return {
        intent: 'show_menu',
        data: {}
      };
    }

    // Search menu
    const searchData = this.parseSearchMessage(normalizedMessage);
    if (searchData) {
      return {
        intent: 'search_menu',
        data: searchData
      };
    }

    // Default - unknown message
    return {
      intent: 'unknown',
      data: { originalMessage: message }
    };
  }

  /**
   * Check if message is a greeting
   * @param {string} message - Normalized message
   * @returns {boolean} True if greeting
   */
  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }

  /**
   * Check if message is a menu request
   * @param {string} message - Normalized message
   * @returns {boolean} True if menu request
   */
  isMenuRequest(message) {
    const menuKeywords = ['menu', 'food', 'items', 'available', 'what do you have', 'options'];
    return menuKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is a help request
   * @param {string} message - Normalized message
   * @returns {boolean} True if help request
   */
  isHelpRequest(message) {
    const helpKeywords = ['help', 'how', 'commands', 'instructions', 'guide'];
    return helpKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is a status request
   * @param {string} message - Normalized message
   * @returns {boolean} True if status request
   */
  isStatusRequest(message) {
    const statusKeywords = ['status', 'order status', 'my orders', 'recent orders', 'check order'];
    return statusKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Parse order message (supports multiple items)
   * @param {string} message - Normalized message
   * @returns {Promise<Object|null>} Order data or null
   */
  async parseOrderMessage(message) {
    // First try to parse multiple items
    const multipleOrderData = await this.parseMultipleOrderMessage(message);
    if (multipleOrderData) {
      // Check if it's actually multiple items or a single item found via multiple parsing
      if (multipleOrderData.items && multipleOrderData.items.length > 0) {
        return multipleOrderData;
      } else if (multipleOrderData.menuItem) {
        // Single item found via multiple parsing
        return multipleOrderData;
      }
    }

    // Fallback to single item parsing
    return await this.parseSingleOrderMessage(message);
  }

  /**
   * Parse multiple order items from a single message
   * @param {string} message - Normalized message
   * @returns {Promise<Object|null>} Multiple order data or null
   */
  async parseMultipleOrderMessage(message) {
    // Patterns for multiple items:
    // "order 2 chicken biryani and 1 fish curry"
    // "order 1 item 1, 2 item 3, and 1 naan bread"
    // "i want 2 chicken biryani, 1 fish curry and 3 naan bread"

    const multiOrderPattern = /(?:order|want|get me|i want)\s+(.+?)(?:\s+for\s+\w+.*)?$/i;
    const match = message.match(multiOrderPattern);
    
    if (!match) return null;

    const itemsText = match[1].trim();
    
    // Split by common separators (and, comma, plus)
    // Handle patterns like: "2 chicken biryani and 1 fish curry"
    const itemSegments = itemsText.split(/\s*(?:,\s*and\s*|,\s*|\s+and\s+|\s*\+\s*)\s*/);
    
    const orderItems = [];
    let totalAmount = 0;

    for (const segment of itemSegments) {
      const itemData = await this.parseSingleItemSegment(segment.trim());
      if (itemData) {
        orderItems.push(itemData);
        totalAmount += itemData.total;
      }
    }

    if (orderItems.length > 1) {
      return {
        items: orderItems,
        totalAmount,
        isMultipleItems: true
      };
    } else if (orderItems.length === 1) {
      // Single item found in multiple order format - convert to single item format
      return {
        quantity: orderItems[0].quantity,
        menuItem: orderItems[0].menuItem,
        total: orderItems[0].total
      };
    }

    return null;
  }

  /**
   * Parse a single item segment from multiple order text
   * @param {string} segment - Item segment text
   * @returns {Promise<Object|null>} Single item data or null
   */
  async parseSingleItemSegment(segment) {
    // Patterns for individual items:
    // "2 chicken biryani"
    // "1 item 3" 
    // "3 #1"

    const itemPatterns = [
      {
        pattern: /(\d+)\s+item\s+(\d+)/i,
        type: 'byId'
      },
      {
        pattern: /(\d+)\s+#(\d+)/i,
        type: 'byId'
      },
      {
        pattern: /(\d+)\s+(.+)/i,
        type: 'byName'
      }
    ];

    for (const { pattern, type } of itemPatterns) {
      const match = segment.match(pattern);
      if (match) {
        const quantity = parseInt(match[1]);
        let menuItem = null;

        if (type === 'byId') {
          const itemId = parseInt(match[2]);
          menuItem = await this.menuService.findItemById(itemId);
        } else {
          let itemName = match[2].trim();
          itemName = this.cleanItemName(itemName);
          const searchResults = await this.menuService.searchItems(itemName);
          if (searchResults.length > 0) {
            menuItem = searchResults[0];
          }
        }

        if (menuItem && quantity > 0) {
          return {
            quantity,
            menuItem,
            total: quantity * menuItem.price
          };
        }
      }
    }

    return null;
  }

  /**
   * Parse single order message (original logic)
   * @param {string} message - Normalized message
   * @returns {Promise<Object|null>} Order data or null
   */
  async parseSingleOrderMessage(message) {
    // Order patterns:
    // "order 2 chicken biryani"
    // "order 1 item 3"
    // "order 3 #1"
    // "i want 2 chicken biryani"
    // "get me 1 item 1"

    const orderPatterns = [
      {
        pattern: /(?:order|want|get me|i want)\s+(\d+)\s+item\s+(\d+)/i,
        type: 'byId'
      },
      {
        pattern: /(?:order|want|get me|i want)\s+(\d+)\s+#(\d+)/i,
        type: 'byId'
      },
      {
        pattern: /(?:order|want|get me|i want)\s+(\d+)\s+(.+?)(?:\s+for\s+\w+)?$/i,
        type: 'byName'
      }
    ];

    for (const { pattern, type } of orderPatterns) {
      const match = message.match(pattern);
      if (match) {
        const quantity = parseInt(match[1]);
        let menuItem = null;

        if (type === 'byId') {
          // Order by item number
          const itemId = parseInt(match[2]);
          menuItem = await this.menuService.findItemById(itemId);
        } else {
          // Order by item name
          let itemName = match[2].trim();
          
          // Clean item name by removing common trailing patterns
          itemName = this.cleanItemName(itemName);
          
          const searchResults = await this.menuService.searchItems(itemName);
          if (searchResults.length > 0) {
            menuItem = searchResults[0]; // Take first match
          }
        }

        if (menuItem && quantity > 0) {
          return {
            quantity,
            menuItem,
            total: quantity * menuItem.price
          };
        }
      }
    }

    return null;
  }

  /**
   * Parse search message
   * @param {string} message - Normalized message
   * @returns {Object|null} Search data or null
   */
  parseSearchMessage(message) {
    const searchPatterns = [
      /search\s+(.+)/i,
      /find\s+(.+)/i,
      /show me\s+(.+)/i,
      /do you have\s+(.+)/i
    ];

    for (const pattern of searchPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          searchTerm: match[1].trim()
        };
      }
    }

    return null;
  }

  /**
   * Clean item name by removing common trailing patterns
   * @param {string} itemName - Raw item name from message
   * @returns {string} Cleaned item name
   */
  cleanItemName(itemName) {
    // Remove customer name patterns like "for Ahmed", "for delivery to John", etc.
    let cleaned = itemName.replace(/\s+for\s+\w+.*$/i, '');
    
    // Remove delivery/pickup patterns
    cleaned = cleaned.replace(/\s+(for\s+)?(delivery|pickup|takeaway|dine-in).*$/i, '');
    
    // Remove extra instructions
    cleaned = cleaned.replace(/\s+(please|urgent|asap|now).*$/i, '');
    
    return cleaned.trim();
  }

  /**
   * Extract customer name from message
   * @param {string} message - User message
   * @returns {string|null} Customer name or null
   */
  extractCustomerName(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }
    
    const namePatterns = [
      /my name is\s+(.+)/i,
      /i am\s+(.+)/i,
      /this is\s+(.+)/i,
      /call me\s+(.+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].trim().split(' ')[0]; // Take first name only
      }
    }

    return null;
  }

  /**
   * Generate smart suggestions based on message
   * @param {string} message - User message
   * @returns {Promise<Array>} Array of suggestions
   */
  async generateSuggestions(message) {
    const suggestions = [];
    const normalizedMessage = message.toLowerCase();

    // If user mentions food items but doesn't order
    if (normalizedMessage.includes('chicken') || normalizedMessage.includes('biryani')) {
      suggestions.push("Try: 'Order 1 Chicken Biryani'");
    }

    if (normalizedMessage.includes('vegetarian') || normalizedMessage.includes('veg')) {
      suggestions.push("Check our Vegetable Pulao!");
    }

    if (normalizedMessage.includes('drink') || normalizedMessage.includes('beverage')) {
      suggestions.push("Try our Mango Lassi!");
    }

    if (normalizedMessage.includes('sweet') || normalizedMessage.includes('dessert')) {
      suggestions.push("Don't miss our Gulab Jamun!");
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push("Type 'menu' to see all available items");
      suggestions.push("Type 'help' for ordering instructions");
    }

    return suggestions;
  }

  /**
   * Check if phone number belongs to restaurant owner
   * @param {string} phone - Phone number to check
   * @returns {boolean} True if owner phone
   */
  isOwnerPhone(phone) {
    return phone === process.env.RESTAURANT_OWNER_PHONE;
  }

  /**
   * Parse owner-specific commands
   * @param {string} message - Normalized message
   * @returns {Object|null} Owner command or null
   */
  parseOwnerCommand(message) {
    // Owner commands:
    // "orders" or "all orders" - Show all pending orders
    // "orders today" - Show today's orders
    // "orders pending" - Show pending orders
    // "orders completed" - Show completed orders
    // "complete order [orderId]" - Mark order as completed
    // "cancel order [orderId]" - Cancel an order
    // "stats" or "summary" - Show daily statistics
    
    // Menu Management Commands:
    // "menu manage" or "manage menu" - Show menu management options
    // "add item [name] [price]" - Add new menu item
    // "add item [name] [price] [description]" - Add new menu item with description
    // "edit item [name/id] price [new_price]" - Edit item price
    // "edit item [name/id] name [new_name]" - Edit item name
    // "delete item [name/id]" - Delete menu item
    // "toggle item [name/id]" - Toggle item availability

    // Order commands
    if (message.match(/^(orders|all orders)$/)) {
      return {
        intent: 'owner_orders',
        data: { filter: 'pending' }
      };
    }

    if (message.match(/^orders today$/)) {
      return {
        intent: 'owner_orders',
        data: { filter: 'today' }
      };
    }

    if (message.match(/^orders pending$/)) {
      return {
        intent: 'owner_orders',
        data: { filter: 'pending' }
      };
    }

    if (message.match(/^orders completed$/)) {
      return {
        intent: 'owner_orders',
        data: { filter: 'completed' }
      };
    }

    // Complete order commands with multiple easy options:
    // "complete order ORD-1234567890-ABCD" - Full order ID
    // "complete order ABCD" - Just the short code (last 4 chars)
    // "complete order 1" - Order number from list
    // "complete 1" - Short form with order number
    // "done 1" - Even shorter
    const completeMatch = message.match(/^complete order (.+)$/);
    if (completeMatch) {
      return {
        intent: 'owner_complete_order',
        data: { orderId: completeMatch[1].trim() }
      };
    }

    // Short complete commands
    const shortCompleteMatch = message.match(/^(complete|done) (\w+)$/);
    if (shortCompleteMatch) {
      return {
        intent: 'owner_complete_order',
        data: { orderId: shortCompleteMatch[2].trim() }
      };
    }

    const cancelMatch = message.match(/^cancel order (.+)$/);
    if (cancelMatch) {
      return {
        intent: 'owner_cancel_order',
        data: { orderId: cancelMatch[1].trim() }
      };
    }

    if (message.match(/^(stats|summary|dashboard)$/)) {
      return {
        intent: 'owner_stats',
        data: {}
      };
    }

    // Menu Management Commands
    if (message.match(/^(menu manage|manage menu|menu admin)$/)) {
      return {
        intent: 'owner_menu_manage',
        data: {}
      };
    }

    // Add item: "add item Samosa 25" or "add item Samosa 25 Crispy fried pastry"
    const addItemMatch = message.match(/^add item (.+?) (\d+(?:\.\d+)?)(?:\s+(.+))?$/);
    if (addItemMatch) {
      return {
        intent: 'owner_add_item',
        data: {
          name: addItemMatch[1].trim(),
          price: parseFloat(addItemMatch[2]),
          description: addItemMatch[3] ? addItemMatch[3].trim() : ''
        }
      };
    }

    // Edit item price: "edit item 1 price 30" or "edit item Samosa price 30"
    const editPriceMatch = message.match(/^edit item (.+?) price (\d+(?:\.\d+)?)$/);
    if (editPriceMatch) {
      return {
        intent: 'owner_edit_item',
        data: {
          identifier: editPriceMatch[1].trim(),
          updates: { price: parseFloat(editPriceMatch[2]) }
        }
      };
    }

    // Edit item name: "edit item 1 name New Samosa" or "edit item Samosa name Crispy Samosa"
    const editNameMatch = message.match(/^edit item (.+?) name (.+)$/);
    if (editNameMatch) {
      return {
        intent: 'owner_edit_item',
        data: {
          identifier: editNameMatch[1].trim(),
          updates: { name: editNameMatch[2].trim() }
        }
      };
    }

    // Delete item: "delete item 1" or "delete item Samosa"
    const deleteItemMatch = message.match(/^delete item (.+)$/);
    if (deleteItemMatch) {
      return {
        intent: 'owner_delete_item',
        data: { identifier: deleteItemMatch[1].trim() }
      };
    }

    // Toggle availability: "toggle item 1" or "toggle item Samosa"
    const toggleItemMatch = message.match(/^toggle item (.+)$/);
    if (toggleItemMatch) {
      return {
        intent: 'owner_toggle_item',
        data: { identifier: toggleItemMatch[1].trim() }
      };
    }

    return null;
  }

  /**
   * Check if message is a payment command
   * @param {string} message - Normalized message
   * @returns {boolean} True if payment command
   */
  isPaymentCommand(message) {
    const paymentPatterns = [
      /^pay (cod|upi)$/,
      /^payment (options|status|help)$/,
      /^paid\s+.+$/,
      /^confirm payment\s+.+$/
    ];

    return paymentPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Parse payment command
   * @param {string} message - Normalized message
   * @param {string} customerPhone - Customer phone
   * @returns {Promise<Object>} Parsed payment command
   */
  async parsePaymentCommand(message, customerPhone) {
    // Payment method selection: "pay cod", "pay upi"
    const payMethodMatch = message.match(/^pay (cod|upi)$/);
    if (payMethodMatch) {
      const method = payMethodMatch[1];
      return {
        intent: 'select_payment_method',
        data: { 
          method, 
          customerPhone,
          methodMap: {
            'cod': 'cod',
            'upi': 'upi'
          }
        }
      };
    }

    // Payment confirmation: "paid 123456789" or "paid TXN123ABC"
    const paidMatch = message.match(/^(?:paid|confirm payment)\s+(.+)$/);
    if (paidMatch) {
      const transactionId = paidMatch[1].trim();
      return {
        intent: 'confirm_payment',
        data: { 
          transactionId, 
          customerPhone 
        }
      };
    }

    // Payment status inquiry
    if (message === 'payment status') {
      return {
        intent: 'payment_status',
        data: { customerPhone }
      };
    }

    // Payment options inquiry
    if (message === 'payment options') {
      return {
        intent: 'payment_options',
        data: { customerPhone }
      };
    }

    // Payment help
    if (message === 'payment help') {
      return {
        intent: 'payment_help',
        data: { customerPhone }
      };
    }

    return null;
  }
}

module.exports = MessageParser;
