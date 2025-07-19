const { sequelize, Order, Customer } = require('./models/database');

async function showDatabaseInfo() {
  try {
    await sequelize.authenticate();
    console.log('📊 WhatsApp Food Ordering System - Database Information\n');
    
    // Show database connection info
    console.log('🔗 Database Connection:');
    console.log('- Database Type: MySQL');
    console.log(`- Host: ${process.env.MYSQL_HOST}`);
    console.log(`- Port: ${process.env.MYSQL_PORT}`);
    console.log(`- Database: ${process.env.MYSQL_DATABASE}`);
    console.log(`- User: ${process.env.MYSQL_USER}\n`);
    
    // Show table structure
    console.log('📋 Database Tables:\n');
    
    // Orders table
    console.log('1. ORDERS TABLE:');
    console.log('   - Primary Key: id (auto-increment)');
    console.log('   - Order ID: orderId (unique)');
    console.log('   - Customer: customerPhone, customerName');
    console.log('   - Items: items (JSON format)');
    console.log('   - Amount: totalAmount (decimal)');
    console.log('   - Status: status (pending, completed, cancelled, etc.)');
    console.log('   - Payment: paymentStatus, paymentMethod, paymentId');
    console.log('   - Location: deliveryAddress');
    console.log('   - Timestamps: createdAt, updatedAt');
    
    // Get order count
    const orderCount = await Order.count();
    console.log(`   - Total Orders: ${orderCount}\n`);
    
    // Customers table
    console.log('2. CUSTOMERS TABLE:');
    console.log('   - Primary Key: id (auto-increment)');
    console.log('   - Phone: phone (unique)');
    console.log('   - Profile: name, location, currentLocation');
    console.log('   - Session: sessionActive, lastLocationUpdate');
    console.log('   - Stats: totalOrders, lastOrderDate');
    console.log('   - Preferences: preferredItems (JSON)');
    console.log('   - Timestamps: createdAt, updatedAt');
    
    // Get customer count
    const customerCount = await Customer.count();
    console.log(`   - Total Customers: ${customerCount}\n`);
    
    // Show recent orders
    console.log('📝 Recent Orders Sample:');
    const recentOrders = await Order.findAll({
      limit: 3,
      order: [['createdAt', 'DESC']],
      attributes: ['orderId', 'customerName', 'totalAmount', 'status', 'paymentStatus', 'createdAt']
    });
    
    recentOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. Order #${order.orderId}`);
      console.log(`      Customer: ${order.customerName}`);
      console.log(`      Amount: ₹${order.totalAmount}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      Payment: ${order.paymentStatus}`);
      console.log(`      Date: ${order.createdAt.toLocaleDateString()}\n`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showDatabaseInfo();
