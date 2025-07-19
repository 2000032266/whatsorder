const express = require('express');
const bodyParser = require('body-parser');
const { connectDatabase, closeDatabase } = require('./models/database');
require('dotenv').config();
const path = require('path');

// Import services
const WhatsAppService = require('./services/whatsappService');
const MenuService = require('./services/menuService');
const OrderService = require('./services/orderService');
const MenuManagementService = require('./services/menuManagementService');
const CustomerService = require('./services/customerService');
const PaymentService = require('./services/paymentService');
const MessageParser = require('./utils/messageParser');
const ResponseTemplates = require('./utils/responseTemplates');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add Railway-specific middleware for better logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static('public'));

// Initialize services
const whatsappService = new WhatsAppService(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_PHONE_NUMBER
);

const menuService = new MenuService();
const orderService = new OrderService();
const menuManagementService = new MenuManagementService();
const customerService = new CustomerService();
const messageParser = new MessageParser();

// Connect to MySQL
connectDatabase().then((connected) => {
  if (!connected) {
    console.log('⚠️ Continuing without database - orders will be logged to console only');
  }
}).catch((error) => {
  console.error('❌ Database connection error:', error);
  console.log('⚠️ Continuing without database - orders will be logged to console only');
});

/**
 * Handle incoming WhatsApp messages
 */
app.post('/webhook', async (req, res) => {
  try {
    const { Body, From, To } = req.body;
    const customerPhone = From;
    const message = Body;

    console.log(`📱 Received message from ${customerPhone}: ${message}`);

    // Parse the message to determine intent
    const parseResult = await messageParser.parseMessage(message, customerPhone);
    
    let responseMessage = '';

    switch (parseResult.intent) {
      case 'request_customer_name':
        responseMessage = await handleRequestCustomerName();
        break;

      case 'save_customer_name':
        responseMessage = await handleSaveCustomerName(parseResult.data);
        break;

      case 'request_customer_location':
        responseMessage = await handleRequestCustomerLocation(parseResult.data);
        break;

      case 'save_customer_location':
        responseMessage = await handleSaveCustomerLocation(parseResult.data);
        break;

      case 'request_current_location':
        responseMessage = await handleRequestCurrentLocation(parseResult.data);
        break;

      case 'save_current_location':
        responseMessage = await handleSaveCurrentLocation(parseResult.data);
        break;

      case 'show_menu':
        responseMessage = await handleMenuRequest(customerPhone);
        break;

      case 'place_order':
        responseMessage = await handleOrderRequest(parseResult.data, customerPhone, message);
        break;

      case 'help':
        responseMessage = await handleHelpRequest(customerPhone);
        break;

      case 'order_status':
        responseMessage = await handleStatusRequest(customerPhone);
        break;

      case 'search_menu':
        responseMessage = await handleSearchRequest(parseResult.data);
        break;

      case 'owner_orders':
        responseMessage = await handleOwnerOrdersRequest(parseResult.data);
        break;

      case 'owner_complete_order':
        responseMessage = await handleOwnerCompleteOrder(parseResult.data);
        break;

      case 'owner_cancel_order':
        responseMessage = await handleOwnerCancelOrder(parseResult.data);
        break;

      case 'owner_mark_paid':
        responseMessage = await handleOwnerMarkPaid(parseResult.data);
        break;

      case 'owner_stats':
        responseMessage = await handleOwnerStatsRequest();
        break;

      case 'owner_menu_manage':
        responseMessage = await handleOwnerMenuManage();
        break;

      case 'owner_add_item':
        responseMessage = await handleOwnerAddItem(parseResult.data);
        break;

      case 'owner_edit_item':
        responseMessage = await handleOwnerEditItem(parseResult.data);
        break;

      case 'owner_delete_item':
        responseMessage = await handleOwnerDeleteItem(parseResult.data);
        break;

      case 'owner_toggle_item':
        responseMessage = await handleOwnerToggleItem(parseResult.data);
        break;

      case 'select_payment_method':
        responseMessage = await handlePaymentMethodSelection(parseResult.data);
        break;

      case 'confirm_payment':
        responseMessage = await handlePaymentConfirmation(parseResult.data);
        break;

      case 'payment_status':
        responseMessage = await handlePaymentStatusRequest(parseResult.data);
        break;

      case 'payment_options':
        responseMessage = await handlePaymentOptionsRequest(parseResult.data);
        break;

      case 'payment_help':
        responseMessage = await handlePaymentHelpRequest();
        break;

      case 'unknown':
      default:
        responseMessage = await handleUnknownMessage(message, customerPhone);
        break;
    }

    // Send response to customer via TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`;

    res.set('Content-Type', 'text/xml');
    res.status(200).send(twiml);
  } catch (error) {
    console.error('❌ Error handling webhook:', error.message || error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Handle customer name request
 */
async function handleRequestCustomerName() {
  try {
    const menuData = await menuService.loadMenu();
    return customerService.generateWelcomeMessage(menuData.restaurant_name);
  } catch (error) {
    console.error('Error handling name request:', error);
    return customerService.generateWelcomeMessage();
  }
}

/**
 * Handle saving customer name
 */
async function handleSaveCustomerName(data) {
  try {
    const customer = await customerService.updateCustomerName(data.phone, data.name);
    const menuData = await menuService.loadMenu();
    return customerService.generateNameConfirmationMessage(
      customer.name, 
      menuData.restaurant_name
    );
  } catch (error) {
    console.error('Error saving customer name:', error);
    return "✅ Thank you! I'll remember your name for future orders.\n\n" +
      "📍 Now, could you please share your location?\n\n" +
      "📝 Just type your address or area name";
  }
}

/**
 * Handle requesting customer location
 */
async function handleRequestCustomerLocation(data) {
  try {
    const customer = await customerService.getCustomer(data.phone);
    if (customer && customer.name) {
      return `📍 Hi ${customer.name}! Could you please share your location?\n\n` +
        `💡 This helps us:\n` +
        `• Calculate delivery time\n` +
        `• Confirm delivery area\n` +
        `• Provide better service\n\n` +
        `📝 Just type your address or area name (e.g., "MG Road, Bangalore" or "Sector 15, Gurgaon")`;
    } else {
      return `📍 Could you please share your location?\n\n` +
        `📝 Just type your address or area name`;
    }
  } catch (error) {
    console.error('Error requesting customer location:', error);
    return `📍 Could you please share your location?\n\n` +
      `📝 Just type your address or area name`;
  }
}

/**
 * Handle saving customer location
 */
async function handleSaveCustomerLocation(data) {
  try {
    const customer = await customerService.updateCustomerLocation(data.phone, data.location);
    const menuData = await menuService.loadMenu();
    return customerService.generateLocationConfirmationMessage(
      customer.name,
      customer.location,
      menuData.restaurant_name
    );
  } catch (error) {
    console.error('Error saving customer location:', error);
    return "📍 Perfect! I've saved your location.\n\n" +
      "🎉 You're all set! Type 'menu' to see our delicious offerings!";
  }
}

/**
 * Handle requesting current location for this session
 */
async function handleRequestCurrentLocation(data) {
  try {
    const customer = await customerService.getCustomer(data.phone);
    if (customer && customer.name) {
      const menuData = await menuService.loadMenu();
      return customerService.generateCurrentLocationRequest(
        customer.name,
        menuData.restaurant_name
      );
    } else {
      return `📍 Where are you right now?\n\n` +
        `🚚 This helps us calculate delivery time and check availability.\n\n` +
        `📝 Please share your current location`;
    }
  } catch (error) {
    console.error('Error requesting current location:', error);
    return `📍 Where are you right now?\n\n` +
      `📝 Please share your current location to continue`;
  }
}

/**
 * Handle saving current location for this session
 */
async function handleSaveCurrentLocation(data) {
  try {
    const customer = await customerService.updateCurrentLocation(data.phone, data.currentLocation);
    return customerService.generateCurrentLocationConfirmation(
      customer.name,
      customer.currentLocation,
      customer.location
    );
  } catch (error) {
    console.error('Error saving current location:', error);
    return `📍 Perfect! I've noted your current location.\n\n` +
      `🍽️ You're all set! Type 'menu' to see our delicious offerings!`;
  }
}

/**
 * Handle menu request
 */
async function handleMenuRequest(customerPhone = null) {
  try {
    // Check if it's a returning customer and greet them
    if (customerPhone && !messageParser.isOwnerPhone(customerPhone)) {
      const customer = await customerService.getCustomer(customerPhone);
      if (customer && customer.name && customer.name !== 'Customer') {
        // Show current location if available, otherwise saved location
        let locationText = '';
        if (customer.currentLocation) {
          locationText = ` 📍 Currently at: ${customer.currentLocation}`;
        } else if (customer.location) {
          locationText = ` 📍 ${customer.location}`;
        }
        
        const greeting = `👋 Hi ${customer.name}!${locationText}\n🍽️ Here's our menu:\n\n`;
        const menu = await menuService.formatMenuDisplay();
        return greeting + menu;
      }
    }
    
    return await menuService.formatMenuDisplay();
  } catch (error) {
    console.error('Error handling menu request:', error);
    return ResponseTemplates.getMenuLoadingErrorMessage();
  }
}

/**
 * Handle order request
 */
async function handleOrderRequest(orderData, customerPhone, message) {
  try {
    let orderItems = [];
    let totalAmount = 0;

    // Handle multiple items order
    if (orderData.isMultipleItems && orderData.items) {
      for (const item of orderData.items) {
        if (!item.menuItem || item.quantity <= 0) {
          return ResponseTemplates.getInvalidOrderMessage('invalid item in order');
        }
        
        orderItems.push({
          menuId: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          total: item.total
        });
      }
      totalAmount = orderData.totalAmount;
    } 
    // Handle single item order (backward compatibility)
    else {
      if (!orderData.menuItem) {
        return ResponseTemplates.getInvalidOrderMessage('item not found');
      }

      if (orderData.quantity <= 0) {
        return ResponseTemplates.getInvalidOrderMessage('invalid quantity');
      }

      orderItems = [{
        menuId: orderData.menuItem.id,
        name: orderData.menuItem.name,
        quantity: orderData.quantity,
        price: orderData.menuItem.price,
        total: orderData.total
      }];
      totalAmount = orderData.total;
    }

    // Get customer name from database (createOrder will handle this)
    // No need to extract from message since we have it in database
    const order = await orderService.createOrder(customerPhone, orderItems);

    // Send confirmation to customer
    let customerNotified = false;
    try {
      const result = await whatsappService.sendOrderConfirmation(customerPhone, order);
      customerNotified = result.sid ? true : false; // Successful if we get a SID
    } catch (confirmError) {
      console.error('❌ Error sending order confirmation:', confirmError.message || confirmError);
    }

    // Send notification to restaurant owner
    let ownerNotified = false;
    if (process.env.RESTAURANT_OWNER_PHONE) {
      try {
        const result = await whatsappService.sendOwnerNotification(process.env.RESTAURANT_OWNER_PHONE, order);
        ownerNotified = result.sid ? true : false; // Successful if we get a SID
      } catch (ownerError) {
        console.error('❌ Error sending owner notification:', ownerError.message || ownerError);
      }
    }

    return ResponseTemplates.getOrderSuccessMessage(order, customerNotified, ownerNotified);
  } catch (error) {
    console.error('Error handling order request:', error);
    return ResponseTemplates.getOrderCreationErrorMessage();
  }
}

/**
 * Handle help request
 */
async function handleHelpRequest(customerPhone) {
  try {
    // Check if this is the restaurant owner
    const isOwner = customerPhone === process.env.RESTAURANT_OWNER_PHONE;
    
    if (isOwner) {
      // Owner help message
      const helpMessage = `👑 *RESTAURANT OWNER COMMANDS*\n\n` +
        `📋 *Order Management:*\n` +
        `• 'orders' - View pending orders (numbered list)\n` +
        `• 'orders today' - All today's orders\n` +
        `• 'orders completed' - Completed orders\n\n` +
        
        `🚀 *Complete Orders (Multiple Easy Ways):*\n` +
        `• 'complete 1' or 'done 1' - Complete order #1\n` +
        `• 'complete A7H4' - Use short ID (last 4 chars)\n` +
        `• 'complete order ORD-123...' - Use full ID\n` +
        `• 'cancel order [ID]' - Cancel an order\n` +
        `• 'stats' - Daily statistics\n\n` +
        
        `🍽️ *Menu Management:*\n` +
        `• 'menu manage' - View menu management options\n` +
        `• 'add item [name] [price]' - Add new item\n` +
        `• 'add item [name] [price] [description]' - Add with description\n` +
        `• 'edit item [name/id] price [new_price]' - Change price\n` +
        `• 'edit item [name/id] name [new_name]' - Change name\n` +
        `• 'delete item [name/id]' - Remove item\n` +
        `• 'toggle item [name/id]' - Enable/disable item\n\n` +
        
        `📱 *Examples:*\n` +
        `• "orders" → "done 2" (complete 2nd order)\n` +
        `• "add item Samosa 25"\n` +
        `• "edit item 1 price 35"\n` +
        `• "toggle item Lassi"\n\n` +
        
        `🌐 Dashboard: http://localhost:3000/owner`;
      
      return helpMessage;
    } else {
      // Customer help message - check if returning customer
      const customer = await customerService.getCustomer(customerPhone);
      
      if (customer && customer.name && customer.name !== 'Customer') {
        // Returning customer - use personalized message
        return customerService.generateReturningCustomerMessage(
          customer.name, 
          customer.location, 
          customer.totalOrders
        );
      } else {
        // New customer or generic help
        const helpMessage = `❓ *How to use our WhatsApp ordering system:*\n\n` +
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
        
        return helpMessage;
      }
    }
  } catch (error) {
    console.error('Error handling help request:', error);
    return "❓ Help is available! Type 'menu' to see our offerings or contact support.";
  }
}

/**
 * Handle status request
 */
async function handleStatusRequest(customerPhone) {
  try {
    const recentOrders = await orderService.getCustomerOrders(customerPhone, 5);
    
    if (recentOrders.length === 0) {
      return ResponseTemplates.getNoRecentOrdersMessage();
    }

    return ResponseTemplates.getRecentOrdersMessage(recentOrders);
  } catch (error) {
    console.error('Error handling status request:', error);
    return "❌ Error retrieving your order history. Please try again later.";
  }
}

/**
 * Handle search request
 */
async function handleSearchRequest(searchData) {
  try {
    const results = await menuService.searchItems(searchData.searchTerm);
    return ResponseTemplates.getSearchResultsMessage(results, searchData.searchTerm);
  } catch (error) {
    console.error('Error handling search request:', error);
    return ResponseTemplates.getMenuLoadingErrorMessage();
  }
}

/**
 * Handle unknown message
 */
async function handleUnknownMessage(message, customerPhone) {
  try {
    const suggestions = await messageParser.generateSuggestions(message);
    return ResponseTemplates.getUnknownMessageResponse(suggestions);
  } catch (error) {
    console.error('Error handling unknown message:', error);
    return ResponseTemplates.getUnknownMessageResponse();
  }
}

/**
 * Handle owner orders request (compact format to stay under 1600 char limit)
 */
async function handleOwnerOrdersRequest(data) {
  try {
    const orders = await orderService.getOrdersForOwner(data.filter);
    
    if (orders.length === 0) {
      return `📋 *No ${data.filter} orders found.*\n\n• "orders today" - Today's orders\n• "stats" - Daily summary`;
    }

    // Increase limit to show more orders (up to 8 orders instead of 3)
    let displayOrders = orders.slice(0, 8);
    let message = `📋 *${data.filter.toUpperCase()} ORDERS (${orders.length})*\n\n`;
    
    // Build message for orders
    displayOrders.forEach((order, index) => {
      const orderNumber = index + 1;
      const shortId = order.orderId.split('-').pop();
      const customerName = (order.customerName || 'Customer').substring(0, 20); // Limit name length
      
      // Add location info if available (compact format)
      let locationInfo = '';
      if (order.deliveryAddress && order.deliveryAddress.trim()) {
        // Extract current location for compact display
        const currentMatch = order.deliveryAddress.match(/Current: ([^(]+)/);
        if (currentMatch) {
          const location = currentMatch[1].trim().substring(0, 30); // Limit location length
          locationInfo = ` 📍 ${location}`;
        }
      }
      
      // Add payment status indicator
      let paymentInfo = '';
      if (order.paymentStatus) {
        const paymentEmojis = {
          'pending': '⏳',
          'paid': '✅', 
          'cod': '🚚',
          'failed': '❌'
        };
        paymentInfo = ` ${paymentEmojis[order.paymentStatus] || '⏳'}`;
      }
      
      // Truncate long item lists
      let itemsText = order.items.map(item => `${item.quantity}x ${item.name.substring(0, 25)}`).join(', ');
      if (itemsText.length > 100) {
        itemsText = itemsText.substring(0, 97) + '...';
      }
      
      message += `${orderNumber}️⃣ (${shortId}) ${customerName}${locationInfo}${paymentInfo}\n`;
      message += `₹${parseFloat(order.totalAmount).toFixed(0)} • ${itemsText}\n\n`;
    });

    // Add footer info
    if (orders.length > displayOrders.length) {
      message += `... and ${orders.length - displayOrders.length} more orders\n\n`;
    }

    if (data.filter === 'pending') {
      message += `🚀 *Complete:* "done 1" or "complete ${displayOrders[0]?.orderId.split('-').pop()}"\n`;
      message += `📋 *More:* "orders today" • "stats"`;
    } else {
      message += `📋 *Commands:* "orders" • "stats"`;
    }

    // Final safety check - if message is still too long, truncate aggressively
    if (message.length > 1500) {
      console.warn(`⚠️ Message too long (${message.length} chars), truncating...`);
      
      // Emergency compact format
      message = `📋 *${data.filter.toUpperCase()} (${orders.length})*\n\n`;
      
      orders.slice(0, 4).forEach((order, index) => {
        const shortId = order.orderId.split('-').pop();
        const name = (order.customerName || 'Customer').substring(0, 15);
        message += `${index + 1}. (${shortId}) ${name} - ₹${parseFloat(order.totalAmount).toFixed(0)}\n`;
      });
      
      if (orders.length > 4) {
        message += `... +${orders.length - 4} more\n`;
      }
      
      message += `\n"done 1" to complete first order`;
    }

    return message;
  } catch (error) {
    console.error('Error handling owner orders request:', error);
    return "❌ Error retrieving orders. Please try again.";
  }
}

/**
 * Handle owner complete order request with flexible ID matching
 */
async function handleOwnerCompleteOrder(data) {
  try {
    let order = null;
    const inputId = data.orderId;
    
    // Try different ID matching strategies
    
    // Strategy 1: Exact match (full order ID)
    order = await orderService.getOrderById(inputId);
    
    // Strategy 2: Try short code match (any length ending pattern)
    if (!order) {
      order = await orderService.getOrderByShortCode(inputId);
    }
    
    // Strategy 3: If input is a number, treat as position in pending orders list
    if (!order && inputId.match(/^\d+$/)) {
      const orderNumber = parseInt(inputId);
      const pendingOrders = await orderService.getOrdersForOwner('pending', 50);
      if (orderNumber >= 1 && orderNumber <= pendingOrders.length) {
        order = pendingOrders[orderNumber - 1];
      }
    }
    
    // Strategy 4: Try to find by partial match of order ID
    if (!order) {
      const allOrders = await orderService.getOrdersForOwner('pending', 50);
      order = allOrders.find(o => o.orderId.toLowerCase().includes(inputId.toLowerCase()));
    }
    
    if (!order) {
      return `❌ Order "${inputId}" not found.\n\n` +
        `💡 *Easy ways to complete orders:*\n` +
        `• Type "orders" to see numbered list\n` +
        `• Use "complete 1" for first order\n` +
        `• Use "done 2" for second order\n` +
        `• Use last 4 chars: "complete A7H4"\n` +
        `• Or use full ID: "complete order ORD-123..."`; 
    }

    // Update order status
    const updatedOrder = await orderService.updateOrderStatus(order.orderId, 'completed');

    // Notify customer
    try {
      const customerMessage = `✅ *Order Completed!*\n\n` +
        `🎉 Your order #${order.orderId} has been completed and is ready!\n` +
        `💰 Total: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n` +
        `Thank you for choosing us! 😊`;
      
      await whatsappService.sendMessage(order.customerPhone, customerMessage);
    } catch (customerError) {
      console.error('Error notifying customer:', customerError.message);
    }

    return `✅ *Order #${updatedOrder.orderId} marked as COMPLETED!*\n\n` +
      `👤 Customer: ${updatedOrder.customerName}\n` +
      `💰 Amount: ₹${parseFloat(updatedOrder.totalAmount).toFixed(2)}\n` +
      `📱 Customer notified: ${updatedOrder.customerPhone}\n\n` +
      `🎉 Great job completing this order!\n\n` +
      `💡 *Quick tip:* Next time use "done 1" or "complete A7H4" for faster completion!`;
  } catch (error) {
    console.error('Error completing order:', error);
    return "❌ Error completing order. Please try again.";
  }
}

/**
 * Handle owner cancel order request
 */
async function handleOwnerCancelOrder(data) {
  try {
    // Find the order using full ID or short code
    let order = await orderService.getOrderById(data.orderId);
    
    // If not found, try short code
    if (!order) {
      order = await orderService.getOrderByShortCode(data.orderId);
    }
    
    if (!order) {
      return `❌ Order #${data.orderId} not found.\n\nTip: Use "orders" to see all pending orders or use the last 4 digits of order ID.`;
    }
    
    // Update order status to cancelled
    const updatedOrder = await orderService.updateOrderStatus(order.orderId, 'cancelled');
    
    if (!updatedOrder) {
      return `❌ Failed to cancel order #${order.orderId}.`;
    }

    // Notify customer
    try {
      const customerMessage = `❌ *Order Cancelled*\n\n` +
        `We're sorry, but your order #${order.orderId} has been cancelled.\n` +
        `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n\n` +
        `Please contact us if you have any questions. Thank you for understanding! 🙏`;
      
      await whatsappService.sendMessage(order.customerPhone, customerMessage);
    } catch (customerError) {
      console.error('Error notifying customer:', customerError.message);
    }

    return `❌ *Order #${order.orderId} marked as CANCELLED*\n\n` +
      `👤 Customer: ${order.customerName}\n` +
      `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
      `📱 Customer notified: ${order.customerPhone}\n\n` +
      `Please follow up with the customer if needed.`;
  } catch (error) {
    console.error('Error cancelling order:', error);
    return "❌ Error cancelling order. Please try again.";
  }
}

/**
 * Handle owner mark order as paid request
 */
async function handleOwnerMarkPaid(data) {
  try {
    const paymentService = new PaymentService();
    const { orderId } = data;
    
    // Find the specific order by orderId or short code
    let order = await orderService.getOrderById(orderId);
    
    // If not found, try to find by short code (last 4 digits)
    if (!order) {
      order = await orderService.getOrderByShortCode(orderId);
    }
    
    if (!order) {
      return `❌ Order #${orderId} not found.\n\nTip: Use "orders" to see all pending orders or use the last 4 digits of order ID.`;
    }

    // Update payment status to 'paid'
    const updatedOrder = await paymentService.updatePaymentStatus(order.orderId, 'paid', order.paymentMethod || 'cod', 'OWNER_CONFIRMED');
    
    if (!updatedOrder) {
      return `❌ Failed to update payment status for order #${order.orderId}.`;
    }

    // Notify customer
    try {
      const customerMessage = `✅ *Payment Confirmed!*\n\n` +
        `📋 Order #${order.orderId}\n` +
        `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
        `💳 Payment Method: ${order.paymentMethod?.toUpperCase() || 'COD'}\n\n` +
        `Your payment has been confirmed by our restaurant. Thank you! 🙏`;
      
      await whatsappService.sendMessage(order.customerPhone, customerMessage);
    } catch (customerError) {
      console.error('Error notifying customer about payment confirmation:', customerError.message);
    }

    return `✅ *Payment confirmed for Order #${order.orderId}*\n\n` +
      `👤 Customer: ${order.customerName}\n` +
      `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
      `💳 Method: ${order.paymentMethod?.toUpperCase() || 'COD'}\n` +
      `📱 Customer notified: ${order.customerPhone}\n\n` +
      `Payment status updated to PAID.`;
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return "❌ Error updating payment status. Please try again.";
  }
}

/**
 * Handle owner stats request
 */
async function handleOwnerStatsRequest() {
  try {
    const stats = await orderService.getDailyStats();
    
    if (!stats) {
      return "❌ Error retrieving statistics. Please try again.";
    }

    let message = `📊 *DAILY DASHBOARD*\n`;
    message += `📅 ${stats.date}\n\n`;
    
    message += `📈 *Summary:*\n`;
    message += `• Total Orders: ${stats.totalOrders}\n`;
    message += `• Pending: ${stats.pendingOrders}\n`;
    message += `• Completed: ${stats.completedOrders}\n`;
    message += `• Cancelled: ${stats.cancelledOrders}\n`;
    message += `• Revenue: ₹${parseFloat(stats.totalRevenue).toFixed(2)}\n\n`;
    
    if (stats.topItems.length > 0) {
      message += `🏆 *Top Items Today:*\n`;
      stats.topItems.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.count}x)\n`;
      });
      message += `\n`;
    }
    
    message += `🔧 *Commands:*\n`;
    message += `• "orders" - View pending orders\n`;
    message += `• "orders today" - All today's orders\n`;
    message += `• "orders completed" - Completed orders`;

    return message;
  } catch (error) {
    console.error('Error handling stats request:', error);
    return "❌ Error retrieving statistics. Please try again.";
  }
}

/**
 * Handle owner menu management request
 */
async function handleOwnerMenuManage() {
  try {
    const menuData = await menuManagementService.getMenuForManagement();
    
    if (!menuData.success) {
      return "❌ Error loading menu. Please try again.";
    }

    let message = `🍽️ *MENU MANAGEMENT*\n`;
    message += `🏪 ${menuData.restaurantName}\n`;
    message += `📅 Last Updated: ${menuData.lastUpdated}\n`;
    message += `📊 ${menuData.availableItems}/${menuData.totalItems} items available\n\n`;
    
    message += `📋 *Current Menu:*\n`;
    menuData.items.forEach(item => {
      const status = item.available ? '✅' : '❌';
      message += `${item.id}. ${item.emoji} ${item.name} - ₹${item.price} ${status}\n`;
    });
    
    message += `\n🔧 *Management Commands:*\n`;
    message += `• *add item [name] [price]* - Add new item\n`;
    message += `• *add item [name] [price] [description]* - Add with description\n`;
    message += `• *edit item [name/id] price [new_price]* - Change price\n`;
    message += `• *edit item [name/id] name [new_name]* - Change name\n`;
    message += `• *delete item [name/id]* - Remove item\n`;
    message += `• *toggle item [name/id]* - Enable/disable item\n\n`;
    
    message += `💡 *Examples:*\n`;
    message += `• add item Samosa 25\n`;
    message += `• add item Masala Chai 15 Hot spiced tea\n`;
    message += `• edit item 1 price 35\n`;
    message += `• edit item Samosa name Crispy Samosa\n`;
    message += `• delete item 8\n`;
    message += `• toggle item Lassi`;

    return message;
  } catch (error) {
    console.error('Error handling menu management request:', error);
    return "❌ Error loading menu management. Please try again.";
  }
}

/**
 * Handle owner add menu item request
 */
async function handleOwnerAddItem(data) {
  try {
    const { name, price, description } = data;
    
    if (!name || !price || price <= 0) {
      return "❌ Invalid format. Use: *add item [name] [price]*\nExample: add item Samosa 25";
    }

    const result = await menuManagementService.addMenuItem(name, price, description);
    
    if (result.success) {
      let message = result.message + `\n\n`;
      message += `📝 *Item Details:*\n`;
      message += `• ID: ${result.item.id}\n`;
      message += `• Name: ${result.item.name}\n`;
      message += `• Price: ₹${result.item.price}\n`;
      message += `• Category: ${result.item.category}\n`;
      message += `• Description: ${result.item.description}\n`;
      message += `• Status: ${result.item.available ? 'Available' : 'Unavailable'}`;
      
      return message;
    } else {
      return `❌ ${result.message}`;
    }
  } catch (error) {
    console.error('Error handling add item request:', error);
    return "❌ Error adding menu item. Please try again.";
  }
}

/**
 * Handle owner edit menu item request
 */
async function handleOwnerEditItem(data) {
  try {
    const { identifier, updates } = data;
    
    if (!identifier || !updates || Object.keys(updates).length === 0) {
      return "❌ Invalid format. Use:\n• *edit item [name/id] price [new_price]*\n• *edit item [name/id] name [new_name]*";
    }

    const result = await menuManagementService.editMenuItem(identifier, updates);
    
    if (result.success) {
      let message = result.message + `\n\n`;
      message += `📝 *Updated Item:*\n`;
      message += `• ID: ${result.newItem.id}\n`;
      message += `• Name: ${result.newItem.name}\n`;
      message += `• Price: ₹${result.newItem.price}\n`;
      message += `• Category: ${result.newItem.category}\n`;
      message += `• Status: ${result.newItem.available ? 'Available' : 'Unavailable'}`;
      
      return message;
    } else {
      return `❌ ${result.message}`;
    }
  } catch (error) {
    console.error('Error handling edit item request:', error);
    return "❌ Error editing menu item. Please try again.";
  }
}

/**
 * Handle owner delete menu item request
 */
async function handleOwnerDeleteItem(data) {
  try {
    const { identifier } = data;
    
    if (!identifier) {
      return "❌ Invalid format. Use: *delete item [name/id]*\nExample: delete item 5 or delete item Samosa";
    }

    const result = await menuManagementService.deleteMenuItem(identifier);
    
    if (result.success) {
      let message = result.message + `\n\n`;
      message += `🗑️ *Deleted Item:*\n`;
      message += `• ID: ${result.deletedItem.id}\n`;
      message += `• Name: ${result.deletedItem.name}\n`;
      message += `• Price: ₹${result.deletedItem.price}\n`;
      message += `• Category: ${result.deletedItem.category}`;
      
      return message;
    } else {
      return `❌ ${result.message}`;
    }
  } catch (error) {
    console.error('Error handling delete item request:', error);
    return "❌ Error deleting menu item. Please try again.";
  }
}

/**
 * Handle owner toggle item availability request
 */
async function handleOwnerToggleItem(data) {
  try {
    const { identifier } = data;
    
    if (!identifier) {
      return "❌ Invalid format. Use: *toggle item [name/id]*\nExample: toggle item 5 or toggle item Samosa";
    }

    const result = await menuManagementService.toggleItemAvailability(identifier);
    
    if (result.success) {
      let message = result.message + `\n\n`;
      message += `🔄 *Item Status:*\n`;
      message += `• ID: ${result.item.id}\n`;
      message += `• Name: ${result.item.name}\n`;
      message += `• Price: ₹${result.item.price}\n`;
      message += `• Status: ${result.item.available ? '✅ Available' : '❌ Unavailable'}`;
      
      return message;
    } else {
      return `❌ ${result.message}`;
    }
  } catch (error) {
    console.error('Error handling toggle item request:', error);
    return "❌ Error toggling item availability. Please try again.";
  }
}

/**
 * Handle payment method selection
 */
async function handlePaymentMethodSelection(data) {
  try {
    const paymentService = new PaymentService();
    const { method, customerPhone, methodMap } = data;
    
    // Get the customer's most recent pending order
    const recentOrders = await orderService.getCustomerOrders(customerPhone, 1);
    const pendingOrder = recentOrders.find(o => o.status === 'pending');
    
    if (!pendingOrder) {
      return "❌ No pending order found. Please place an order first before selecting payment method.";
    }

    // Update payment method
    const actualMethod = methodMap[method] || method;
    await paymentService.updatePaymentStatus(pendingOrder.orderId, 'pending', actualMethod);

    // Return appropriate payment details based on method
    switch (method) {
      case 'cod':
        await paymentService.updatePaymentStatus(pendingOrder.orderId, 'cod', 'cod');
        return paymentService.getCODConfirmationMessage(pendingOrder);
      
      case 'upi':
        return paymentService.getUPIPaymentMessage(pendingOrder);
      
      default:
        return paymentService.getPaymentOptionsMessage(pendingOrder);
    }
  } catch (error) {
    console.error('Error handling payment method selection:', error);
    return "❌ Error processing payment method selection. Please try again.";
  }
}

/**
 * Handle payment confirmation
 */
async function handlePaymentConfirmation(data) {
  try {
    const paymentService = new PaymentService();
    const { transactionId, customerPhone } = data;
    
    // Get the customer's most recent pending payment order
    const recentOrders = await orderService.getCustomerOrders(customerPhone, 5);
    const pendingPaymentOrder = recentOrders.find(o => 
      o.status === 'pending' && 
      (o.paymentStatus === 'pending' || !o.paymentStatus)
    );
    
    if (!pendingPaymentOrder) {
      return "❌ No pending payment found. All your recent orders are either paid or completed.";
    }

    // Confirm payment
    const result = await paymentService.confirmPayment(
      pendingPaymentOrder.orderId, 
      transactionId, 
      pendingPaymentOrder.paymentMethod || 'upi'
    );

    // Notify restaurant owner about payment confirmation
    if (result.success && process.env.RESTAURANT_OWNER_PHONE) {
      try {
        const ownerMessage = `💰 *Payment Received!*\n\n` +
          `📋 Order #${pendingPaymentOrder.orderId}\n` +
          `👤 Customer: ${pendingPaymentOrder.customerName}\n` +
          `💰 Amount: ₹${parseFloat(pendingPaymentOrder.totalAmount).toFixed(2)}\n` +
          `💳 Method: ${pendingPaymentOrder.paymentMethod || 'UPI'}\n` +
          `🆔 Transaction ID: ${transactionId}\n\n` +
          `✅ Payment confirmed - Order ready to prepare!`;
        
        await whatsappService.sendMessage(process.env.RESTAURANT_OWNER_PHONE, ownerMessage);
      } catch (ownerError) {
        console.error('Error notifying owner about payment:', ownerError.message);
      }
    }

    return result.message;
  } catch (error) {
    console.error('Error handling payment confirmation:', error);
    return "❌ Error confirming payment. Please try again or contact support.";
  }
}

/**
 * Handle payment status request
 */
async function handlePaymentStatusRequest(data) {
  try {
    const paymentService = new PaymentService();
    const { customerPhone } = data;
    
    // Get customer's most recent order
    const recentOrders = await orderService.getCustomerOrders(customerPhone, 1);
    
    if (recentOrders.length === 0) {
      return "📋 No recent orders found. Please place an order first!";
    }

    const order = recentOrders[0];
    return paymentService.getPaymentStatusMessage(order);
  } catch (error) {
    console.error('Error handling payment status request:', error);
    return "❌ Error getting payment status. Please try again.";
  }
}

/**
 * Handle payment options request
 */
async function handlePaymentOptionsRequest(data) {
  try {
    const paymentService = new PaymentService();
    const { customerPhone } = data;
    
    // Get customer's most recent pending order
    const recentOrders = await orderService.getCustomerOrders(customerPhone, 5);
    const pendingOrder = recentOrders.find(o => o.status === 'pending');
    
    if (!pendingOrder) {
      return "❌ No pending order found. Please place an order first to see payment options.";
    }

    return paymentService.getPaymentOptionsMessage(pendingOrder);
  } catch (error) {
    console.error('Error handling payment options request:', error);
    return "❌ Error getting payment options. Please try again.";
  }
}

/**
 * Handle payment help request
 */
async function handlePaymentHelpRequest() {
  const paymentService = new PaymentService();
  return paymentService.getPaymentHelpMessage();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Food Ordering Bot'
  });
});

/**
 * Get menu endpoint
 */
app.get('/menu', async (req, res) => {
  try {
    const menu = await menuService.loadMenu();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

/**
 * Get daily orders summary (for restaurant owner)
 */
app.get('/orders/daily-summary', async (req, res) => {
  try {
    const summary = await orderService.getDailyOrdersSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get daily summary' });
  }
});

/**
 * Update order status endpoint (for restaurant owner)
 */
app.post('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(orderId, status);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send status update to customer
    await whatsappService.sendStatusUpdate(order.customerPhone, order, status);

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * Send welcome message endpoint
 */
app.post('/send-welcome', async (req, res) => {
  try {
    const { phone, name } = req.body;
    await whatsappService.sendWelcomeMessage(phone, name);
    res.json({ message: 'Welcome message sent successfully' });
  } catch (error) {
    console.error('Error sending welcome message:', error);
    res.status(500).json({ error: 'Failed to send welcome message' });
  }
});

// Restaurant Owner Dashboard Endpoints
app.get('/owner/dashboard', async (req, res) => {
  try {
    const stats = await orderService.getDailyStats();
    const pendingOrders = await orderService.getOrdersForOwner('pending');
    const todayOrders = await orderService.getOrdersForOwner('today');
    
    const dashboard = {
      stats,
      pendingOrders: pendingOrders.map(order => ({
        id: order.orderId,
        customer: order.customerName,
        phone: order.customerPhone.replace('whatsapp:', ''),
        location: order.deliveryAddress || 'Not specified',
        items: order.items,
        total: order.totalAmount,
        time: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'cod',
        paymentId: order.paymentId || null
      })),
      todayOrders: todayOrders.length
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/owner/orders', async (req, res) => {
  try {
    const { filter = 'pending', limit = 100, page = 1, fromDate, toDate, customer } = req.query;
    const pageSize = parseInt(limit);
    const currentPage = parseInt(page);
    const offset = (currentPage - 1) * pageSize;
    
    let orders;
    if (filter === 'cancelled') {
      orders = await orderService.getOrdersForOwner('cancelled', pageSize, offset);
    } else {
      orders = await orderService.getOrdersForOwner(filter, pageSize, offset);
    }
    
    // Get total count for pagination (before filtering)
    let totalCount;
    if (filter === 'cancelled') {
      totalCount = await orderService.getOrdersCountForOwner('cancelled');
    } else {
      totalCount = await orderService.getOrdersCountForOwner(filter);
    }
    
    // Apply date filtering if provided
    if (fromDate || toDate) {
      orders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (fromDate && orderDate < new Date(fromDate)) return false;
        if (toDate && orderDate > new Date(toDate + 'T23:59:59')) return false;
        return true;
      });
    }
    
    // Apply customer filtering if provided
    if (customer) {
      orders = orders.filter(order => 
        order.customerName.toLowerCase().includes(customer.toLowerCase())
      );
    }
    
    const formattedOrders = orders.map(order => ({
      id: order.orderId,
      customer: order.customerName,
      phone: order.customerPhone.replace('whatsapp:', ''),
      location: order.deliveryAddress || 'Not specified',
      items: order.items,
      total: order.totalAmount,
      status: order.status,
      time: order.createdAt,
      date: order.createdAt.toDateString(),
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod || 'cod',
      paymentId: order.paymentId || null
    }));
    
    res.json({ 
      orders: formattedOrders, 
      count: formattedOrders.length,
      totalCount: totalCount,
      currentPage: currentPage,
      totalPages: Math.ceil(totalCount / pageSize)
    });
  } catch (error) {
    console.error('Error getting filtered orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/owner/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await orderService.updateOrderStatus(orderId, status);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Send WhatsApp notification to customer for status changes
    try {
      await whatsappService.sendStatusUpdate(order.customerPhone, order, status);
      console.log(`📱 Customer notified of order ${orderId} status change to ${status}`);
    } catch (notificationError) {
      console.error('Error sending customer notification:', notificationError.message);
      // Don't fail the request if notification fails
    }
    
    res.json({ success: true, order: { id: order.orderId, status: order.status } });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order payment status
app.post('/owner/orders/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body;
    
    if (action !== 'mark_paid') {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const paymentService = new PaymentService();
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update payment status to 'paid'
    const updatedOrder = await paymentService.updatePaymentStatus(orderId, 'paid', order.paymentMethod || 'cod', 'ADMIN_CONFIRMED');
    
    if (!updatedOrder) {
      return res.status(500).json({ error: 'Failed to update payment status' });
    }
    
    // Send WhatsApp notification to customer
    try {
      const customerMessage = `✅ *Payment Confirmed!*\n\n` +
        `📋 Order #${order.orderId}\n` +
        `💰 Amount: ₹${parseFloat(order.totalAmount).toFixed(2)}\n` +
        `💳 Payment Method: ${order.paymentMethod?.toUpperCase() || 'COD'}\n\n` +
        `Your payment has been confirmed by our restaurant. Thank you! 🙏`;
      
      await whatsappService.sendMessage(order.customerPhone, customerMessage);
      console.log(`📱 Customer notified of payment confirmation for order ${orderId}`);
    } catch (notificationError) {
      console.error('Error sending payment confirmation notification:', notificationError.message);
      // Don't fail the request if notification fails
    }
    
    res.json({ success: true, order: { id: order.orderId, paymentStatus: updatedOrder.paymentStatus } });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Owner dashboard route
app.get('/owner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'owner-dashboard.html'));
});

// Serve enhanced dashboard
app.get('/enhanced-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'enhanced-owner-dashboard.html'));
});

// Dashboard route (alias for enhanced dashboard)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'enhanced-owner-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Food Ordering Bot server is running on port ${PORT}`);
  console.log(`📱 Webhook URL: ${process.env.WEBHOOK_URL || `http://localhost:${PORT}`}/webhook`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

module.exports = app;
