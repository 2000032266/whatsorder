const { sequelize, Order } = require('./models/database');

async function checkOrders() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const totalOrders = await Order.count();
    console.log(`📊 Total orders in database: ${totalOrders}`);
    
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    console.log('\n📈 Orders by status:');
    ordersByStatus.forEach(row => {
      console.log(`  ${row.status}: ${row.dataValues.count}`);
    });
    
    const ordersByPayment = await Order.findAll({
      attributes: [
        'paymentStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['paymentStatus']
    });
    
    console.log('\n💰 Orders by payment status:');
    ordersByPayment.forEach(row => {
      console.log(`  ${row.paymentStatus}: ${row.dataValues.count}`);
    });
    
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'orderId', 'status', 'paymentStatus', 'totalAmount', 'createdAt']
    });
    
    console.log('\n🕐 Recent orders (last 5):');
    recentOrders.forEach(order => {
      console.log(`  ${order.orderId} | ${order.status} | ${order.paymentStatus} | ₹${order.totalAmount} | ${order.createdAt.toISOString().split('T')[0]}`);
    });
    
    await sequelize.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
