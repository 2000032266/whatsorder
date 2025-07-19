const { Order } = require('./models/database');
const { sequelize } = require('./models/database');

async function checkCODOrders() {
  try {
    await sequelize.authenticate();
    
    // Check for COD orders
    console.log('Checking COD orders:');
    const codOrders = await Order.findAll({
      where: { paymentStatus: 'cod' },
      attributes: ['id', 'paymentStatus', 'status'],
      limit: 10
    });
    
    console.log(`Found ${codOrders.length} COD orders:`);
    codOrders.forEach(order => {
      console.log(`ID: ${order.id}, Status: ${order.status}, PaymentStatus: '${order.paymentStatus}'`);
    });
    
    // Check completed orders with different payment statuses
    console.log('\nCompleted orders by payment status:');
    const completedOrders = await Order.findAll({
      where: { status: 'completed' },
      attributes: ['paymentStatus', [sequelize.fn('COUNT', '*'), 'count']],
      group: ['paymentStatus'],
      raw: true
    });
    
    completedOrders.forEach(row => {
      console.log(`PaymentStatus: '${row.paymentStatus}' - Count: ${row.count}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCODOrders();
