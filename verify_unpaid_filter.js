const { Order } = require('./models/database');

async function verifyUnpaidFilter() {
  try {
    // Get unpaid orders
    const unpaidOrders = await Order.findAll({
      where: { paymentStatus: 'pending' },
      attributes: ['id', 'status', 'paymentStatus'],
      order: [['id', 'DESC']],
      limit: 10
    });
    
    console.log('=== UNPAID FILTER RESULTS ===');
    console.log(`Total unpaid orders found: ${unpaidOrders.length}`);
    console.log('Details:');
    
    unpaidOrders.forEach(order => {
      console.log(`ID: ${order.id} | Status: ${order.status} | PaymentStatus: ${order.paymentStatus}`);
      
      // Check if any have 'paid' status (this would be the bug)
      if (order.paymentStatus === 'paid') {
        console.log('🚨 ERROR: Found paid order in unpaid filter!');
      }
    });
    
    console.log('\n=== VERIFICATION ===');
    console.log('✅ All orders above should have paymentStatus = "pending"');
    console.log('✅ Some may have status = "completed" (this is correct - completed but not paid)');
    console.log('❌ None should have paymentStatus = "paid" (that would be a bug)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyUnpaidFilter();
