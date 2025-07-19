const OrderService = require('./services/orderService');

async function testServiceDirectly() {
  try {
    const orderService = new OrderService();
    
    console.log('=== Testing OrderService.getOrdersForOwner directly ===');
    
    // Test unpaid filter
    console.log('\n1. Testing unpaid filter:');
    const unpaidOrders = await orderService.getOrdersForOwner('unpaid', 5, 0);
    console.log(`Found ${unpaidOrders.length} unpaid orders:`);
    unpaidOrders.forEach(order => {
      console.log(`ID: ${order.orderId} | Status: ${order.status} | PaymentStatus: ${order.paymentStatus}`);
    });
    
    // Test paid filter
    console.log('\n2. Testing paid filter:');
    const paidOrders = await orderService.getOrdersForOwner('paid', 5, 0);
    console.log(`Found ${paidOrders.length} paid orders:`);
    paidOrders.forEach(order => {
      console.log(`ID: ${order.orderId} | Status: ${order.status} | PaymentStatus: ${order.paymentStatus}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testServiceDirectly();
