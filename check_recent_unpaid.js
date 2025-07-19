const { Order } = require('./models/database');

async function checkRecentUnpaidOrders() {
  try {
    // Check for unpaid orders that are NOT cancelled
    console.log('=== ACTIVE UNPAID ORDERS (Not Cancelled) ===');
    const activeUnpaidOrders = await Order.findAll({
      where: { 
        paymentStatus: 'pending',
        status: ['pending', 'completed'] // Only active orders
      },
      attributes: ['id', 'status', 'paymentStatus', 'customerName', 'totalAmount'],
      order: [['id', 'DESC']],
      limit: 10
    });
    
    console.log(`Found ${activeUnpaidOrders.length} active unpaid orders:`);
    activeUnpaidOrders.forEach(order => {
      console.log(`ID: ${order.id} | Status: ${order.status} | PaymentStatus: ${order.paymentStatus} | Customer: ${order.customerName} | Total: ₹${order.totalAmount}`);
    });
    
    // Check if there are any completed orders that are paid but might be showing in unpaid
    console.log('\n=== POTENTIAL ISSUE CHECK ===');
    console.log('Checking if any paid orders might be incorrectly showing in unpaid filter...');
    
    const potentialIssue = await Order.findAll({
      where: { 
        paymentStatus: 'paid',
        status: 'completed'
      },
      attributes: ['id', 'status', 'paymentStatus'],
      order: [['id', 'DESC']],
      limit: 5
    });
    
    console.log(`Found ${potentialIssue.length} completed+paid orders (should NOT appear in unpaid filter):`);
    potentialIssue.forEach(order => {
      console.log(`ID: ${order.id} | Status: ${order.status} | PaymentStatus: ${order.paymentStatus}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecentUnpaidOrders();
