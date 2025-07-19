const { Order } = require('./models/database');
const { sequelize } = require('./models/database');

async function testUnpaidFilter() {
  try {
    await sequelize.authenticate();
    
    // Test the exact same query used in the service
    console.log('Testing unpaid filter query (paymentStatus = "pending"):');
    const unpaidOrders = await Order.findAll({
      where: { paymentStatus: 'pending' },
      order: [['createdAt', 'DESC']],
      limit: 5,
      offset: 0
    });
    
    console.log(`Found ${unpaidOrders.length} unpaid orders:`);
    unpaidOrders.forEach(order => {
      console.log(`ID: ${order.id}, Status: ${order.status}, PaymentStatus: '${order.paymentStatus}', Customer: ${order.customer}, Items: ${JSON.stringify(order.items).substring(0, 50)}...`);
    });
    
    // Also test what the "paid" filter returns
    console.log('\nTesting paid filter query (paymentStatus = "paid"):');
    const paidOrders = await Order.findAll({
      where: { paymentStatus: 'paid' },
      order: [['createdAt', 'DESC']],
      limit: 5,
      offset: 0
    });
    
    console.log(`Found ${paidOrders.length} paid orders:`);
    paidOrders.forEach(order => {
      console.log(`ID: ${order.id}, Status: ${order.status}, PaymentStatus: '${order.paymentStatus}', Customer: ${order.customer}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUnpaidFilter();
