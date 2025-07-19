const { Order, Customer } = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * Order Service - Handles order operations
 */
class OrderService {
  /**
   * Create a new order
   * @param {string} customerPhone - Customer phone number
   * @param {Array} items - Array of order items
   * @param {string} customerName - Customer name (optional)
   * @returns {Promise<Object>} Created order
   */
  async createOrder(customerPhone, items, customerName = null) {
    try {
      // Always get the actual customer name and location from database
      const customer = await Customer.findOne({ where: { phone: customerPhone } });
      const actualCustomerName = (customer && customer.name) ? customer.name : 'Customer';
      
      // Determine delivery address from current location or saved location
      let deliveryAddress = '';
      if (customer) {
        if (customer.currentLocation) {
          deliveryAddress = `Current: ${customer.currentLocation}`;
          if (customer.location && customer.location !== customer.currentLocation) {
            deliveryAddress += ` (Home: ${customer.location})`;
          }
        } else if (customer.location) {
          deliveryAddress = customer.location;
        }
      }
      
      // First, ensure customer exists (create/update customer data first)
      await this.updateCustomerData(customerPhone, actualCustomerName, items);
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      // Generate unique order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Create order
      const order = await Order.create({
        orderId,
        customerPhone,
        customerName: actualCustomerName,
        items,
        totalAmount,
        status: 'pending',
        deliveryAddress: deliveryAddress
      });
      
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Update customer data
   * @param {string} phone - Customer phone
   * @param {string} name - Customer name
   * @param {Array} items - Order items
   */
  async updateCustomerData(phone, name, items) {
    try {
      let customer = await Customer.findOne({ where: { phone } });
      
      if (!customer) {
        customer = await Customer.create({
          phone,
          name,
          totalOrders: 1,
          lastOrderDate: new Date(),
          preferredItems: []
        });
      } else {
        const preferredItems = customer.preferredItems || [];
        
        // Update preferred items
        items.forEach(item => {
          const existingPref = preferredItems.find(pref => pref.menuId === item.menuId);
          if (existingPref) {
            existingPref.orderCount += item.quantity;
          } else {
            preferredItems.push({
              menuId: item.menuId,
              name: item.name,
              orderCount: item.quantity
            });
          }
        });

        await customer.update({
          totalOrders: customer.totalOrders + 1,
          lastOrderDate: new Date(),
          preferredItems: preferredItems,
          ...(name !== 'Customer' && { name })
        });
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object|null>} Order or null
   */
  async getOrderById(orderId) {
    try {
      return await Order.findOne({ where: { orderId } });
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  }

  /**
   * Get order by short code (last 4 digits of order ID)
   * @param {string} shortCode - Short code (last 4 characters)
   * @returns {Promise<Object|null>} Order or null
   */
  async getOrderByShortCode(shortCode) {
    try {
      // If it's already a full order ID, use it directly
      if (shortCode.startsWith('ORD-')) {
        return await this.getOrderById(shortCode);
      }
      
      // Find order where orderId ends with the short code
      const orders = await Order.findAll({
        where: {
          orderId: {
            [Op.like]: `%-${shortCode}`
          }
        },
        order: [['createdAt', 'DESC']]
      });
      
      // Return the most recent match
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      console.error('Error getting order by short code:', error);
      return null;
    }
  }

  /**
   * Get customer orders
   * @param {string} customerPhone - Customer phone
   * @param {number} limit - Number of orders to return
   * @returns {Promise<Array>} Customer orders
   */
  async getCustomerOrders(customerPhone, limit = 5) {
    try {
      return await Order.findAll({
        where: { customerPhone },
        order: [['createdAt', 'DESC']],
        limit: limit
      });
    } catch (error) {
      console.error('Error getting customer orders:', error);
      return [];
    }
  }

  /**
   * Get orders with filtering options for restaurant owner
   * @param {string} filter - Filter type: 'pending', 'today', 'completed', 'all'
   * @param {number} limit - Maximum number of orders to return
   * @param {number} offset - Number of orders to skip for pagination
   * @returns {Promise<Array>} Filtered orders
   */
  async getOrdersForOwner(filter = 'pending', limit = 500, offset = 0) {
    try {
      let whereClause = {};
      
      switch (filter) {
        case 'pending':
          whereClause.status = 'pending';
          break;
        case 'completed':
          whereClause.status = 'completed';
          break;
        case 'cancelled':
          whereClause.status = 'cancelled';
          break;
        case 'paid':
          whereClause.paymentStatus = 'paid';
          break;
        case 'unpaid':
          whereClause.paymentStatus = 'pending';
          whereClause.status = { [Op.ne]: 'cancelled' }; // Exclude cancelled orders
          break;
        case 'today':
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
          whereClause.createdAt = {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          };
          break;
        case 'all':
        default:
          // No additional filtering
          break;
      }

      return await Order.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('Error getting orders for owner:', error);
      return [];
    }
  }

  /**
   * Get total count of orders for pagination
   * @param {string} filter - Filter type
   * @returns {Promise<number>} Total count of orders
   */
  async getOrdersCountForOwner(filter = 'pending') {
    try {
      let whereClause = {};
      
      switch (filter) {
        case 'pending':
          whereClause.status = 'pending';
          break;
        case 'completed':
          whereClause.status = 'completed';
          break;
        case 'cancelled':
          whereClause.status = 'cancelled';
          break;
        case 'paid':
          whereClause.paymentStatus = 'paid';
          break;
        case 'unpaid':
          whereClause.paymentStatus = 'pending';
          whereClause.status = { [Op.ne]: 'cancelled' }; // Exclude cancelled orders
          break;
        case 'today':
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
          whereClause.createdAt = {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          };
          break;
        case 'all':
        default:
          // No additional filtering
          break;
      }

      return await Order.count({
        where: whereClause
      });
    } catch (error) {
      console.error('Error getting orders count for owner:', error);
      return 0;
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status ('pending', 'completed', 'cancelled')
   * @returns {Promise<Object|null>} Updated order or null
   */
  async updateOrderStatus(orderId, status) {
    try {
      const order = await Order.findOne({ where: { orderId } });
      if (!order) {
        return null;
      }

      await order.update({ status });
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  }

  /**
   * Format order for display
   * @param {Object} order - Order object
   * @returns {string} Formatted order string
   */
  formatOrderDisplay(order) {
    let orderText = `🧾 *Order Confirmation*\n\n`;
    orderText += `📋 Order ID: *${order.orderId}*\n`;
    orderText += `👤 Customer: ${order.customerName}\n`;
    orderText += `📞 Phone: ${order.customerPhone}\n`;
    orderText += `📅 Date: ${order.orderDate.toLocaleDateString()}\n`;
    orderText += `🕐 Time: ${order.orderDate.toLocaleTimeString()}\n\n`;
    
    orderText += `📝 *Items Ordered:*\n`;
    order.items.forEach(item => {
      orderText += `• ${item.quantity}x ${item.name} - ₹${item.total.toFixed(2)}\n`;
    });
    
    orderText += `\n💰 *Total Amount: ₹${order.totalAmount.toFixed(2)}*\n`;
    orderText += `📊 Status: ${order.status.toUpperCase()}\n\n`;
    orderText += `✅ Your order has been received and will be prepared shortly.\n`;
    orderText += `📱 We'll notify you when it's ready!`;
    
    return orderText;
  }

  /**
   * Get daily orders summary
   * @returns {Promise<Object>} Daily orders summary
   */
  async getDailyOrdersSummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const orders = await Order.findAll({
        where: {
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });

      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
        statusBreakdown: {},
        popularItems: {}
      };

      orders.forEach(order => {
        // Status breakdown
        summary.statusBreakdown[order.status] = (summary.statusBreakdown[order.status] || 0) + 1;
        
        // Popular items
        order.items.forEach(item => {
          if (!summary.popularItems[item.name]) {
            summary.popularItems[item.name] = 0;
          }
          summary.popularItems[item.name] += item.quantity;
        });
      });

      return summary;
    } catch (error) {
      console.error('Error getting daily orders summary:', error);
      return null;
    }
  }

  /**
   * Get daily statistics for restaurant owner
   * @param {Date} date - Date to get stats for (defaults to today)
   * @returns {Promise<Object>} Daily statistics
   */
  async getDailyStats(date = new Date()) {
    try {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const orders = await Order.findAll({
        where: {
          createdAt: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          }
        }
      });

      const stats = {
        date: date.toDateString(),
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
        topItems: this.getTopItemsFromOrders(orders)
      };

      return stats;
    } catch (error) {
      console.error('Error getting daily stats:', error);
      return null;
    }
  }

  /**
   * Get top ordered items from a list of orders
   * @param {Array} orders - List of orders
   * @returns {Array} Top items with counts
   */
  getTopItemsFromOrders(orders) {
    const itemCounts = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemName = item.name;
        if (itemCounts[itemName]) {
          itemCounts[itemName] += item.quantity;
        } else {
          itemCounts[itemName] = item.quantity;
        }
      });
    });

    return Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }
}

module.exports = OrderService;
