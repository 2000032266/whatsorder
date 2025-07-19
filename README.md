# 🍽️ WhatsApp Restaurant Ordering System

A comprehensive WhatsApp-based restaurant ordering system built with Node.js, Express, and Twilio. This system provides a complete ordering experience through WhatsApp messages, including customer onboarding, menu browsing, order placement, payment processing, and order management.

## 🌟 Key Features

### 👥 **Customer Experience**
- **Smart Onboarding**: Automatic name and location collection for new customers
- **Dynamic Menu Display**: Menu with categories, prices in Indian Rupees (₹), and emojis
- **Flexible Ordering**: Multiple order formats supported (by name, ID, or number)
- **Payment Options**: Cash on Delivery (COD) and UPI payments with QR codes
- **Real-time Tracking**: Order status updates and delivery notifications
- **Location Management**: Session-based current location and saved default location

### 🏪 **Restaurant Owner Management**
- **Order Dashboard**: Web-based dashboard with payment filtering
- **WhatsApp Commands**: Complete order management through WhatsApp
- **Menu Management**: Add, edit, delete, and toggle menu items via WhatsApp
- **Payment Tracking**: Manual payment confirmation with short codes
- **Analytics**: Daily statistics and order summaries
- **Smart Order IDs**: Use last 4 digits for quick order operations

### 💳 **Payment System**
- **UPI Integration**: Instant payments with QR codes and deep links
- **COD Support**: Cash on delivery with payment tracking
- **Payment Confirmation**: Customer and owner payment verification
- **Short Code Commands**: Quick payment confirmation using order ID endings
- **Payment Status Tracking**: Real-time payment status updates

## 🛠️ Technical Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **WhatsApp API**: Twilio WhatsApp Business API
- **Payment Processing**: UPI integration for Indian market
- **Frontend**: Responsive HTML/CSS/JavaScript dashboard

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Twilio WhatsApp Business API account
- ngrok (for local development)
- UPI ID for payment processing

## ⚡ Quick Setup

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/whatsapp-restaurant-ordering.git
cd whatsapp-restaurant-ordering
npm install
```

### 2. Environment Configuration
Create `.env` file:
```env
PORT=3000
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
RESTAURANT_OWNER_PHONE=whatsapp:+1234567890
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=whatsorder
WEBHOOK_URL=https://your-ngrok-url.ngrok.io
UPI_ID=restaurant@paytm
RESTAURANT_NAME=Delicious Bites
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE whatsorder;"

# Tables will be auto-created on first run
npm start
```

### 4. Webhook Configuration
```bash
# Start ngrok tunnel
ngrok http 3000

# Configure Twilio webhook URL:
# https://your-ngrok-url.ngrok.io/webhook
```

## 🚀 Complete User Journey

### 📱 **Customer Experience Flow**

#### **1. First-Time Customer Onboarding**
```
Customer: Hi
Bot: 🍽️ Welcome to Delicious Bites!
     
     👋 We'd love to serve you! To get started:
     📝 Could you please tell us your name?

Customer: Rahul Kumar
Bot: ✅ Hi Rahul! Nice to meet you!
     
     📍 To provide the best service, could you share your location?
     💡 This helps us calculate delivery time and confirm our service area.
     
     📝 Just type your address (e.g., "MG Road, Bangalore")

Customer: JP Nagar, Bangalore  
Bot: 📍 Perfect! Location saved: JP Nagar, Bangalore
     
     🎉 You're all set! Here's our delicious menu:
     
     🍴 **Main Course**
     🍛 1. Chicken Biryani - ₹299
        Aromatic basmati rice with tender chicken pieces
     🍛 2. Mughalai Biryani - ₹180
        Delicious mughalai biryani
     🍚 3. Vegetable Pulao - ₹199
        Fragrant rice with mixed vegetables
     
     🍞 **Breads**
     🫓 4. Naan Bread - ₹49
        Fresh baked traditional bread
     🫓 5. Pulka - ₹15
        Delicious pulka
     
     📝 To order, type: "Order [quantity] [item name]"
     💡 Example: "Order 2 Chicken Biryani"
```

#### **2. Returning Customer Experience**
```
Customer: hi
Bot: 👋 Hi Rahul! 📍 JP Nagar, Bangalore
     
     ⏰ Are you at your usual location or somewhere else today?
     
     📝 Reply with:
     • "same" - for JP Nagar, Bangalore
     • Or type your current location

Customer: same
Bot: 📍 Great! Delivering to JP Nagar, Bangalore
     
     🍽️ Here's today's menu:
     [Menu display...]
```

#### **3. Complete Order Process**
```
Customer: Order 2 Chicken Biryani, 1 Naan
Bot: 🛒 Excellent choice! Your order:
     
     📋 **Order Summary:**
     • 2x Chicken Biryani - ₹598
     • 1x Naan Bread - ₹49
     💰 **Total: ₹647**
     
     ✅ Order ID: ORD-1721234567-A7H4
     👤 Customer: Rahul Kumar
     📍 Delivery: JP Nagar, Bangalore
     
     💳 **Choose Payment Method:**
     1️⃣ Cash on Delivery (COD) - Reply "pay cod"
     2️⃣ UPI Payment (Instant) - Reply "pay upi"

Customer: pay upi
Bot: 📱 **UPI Payment for Order #ORD-1721234567-A7H4**
     
     💰 Amount: ₹647
     
     **Payment Options:**
     
     🔗 **Quick Pay Link:**
     upi://pay?pa=restaurant@paytm&am=647&tn=Order-A7H4
     
     📸 **QR Code:**
     https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...
     
     💳 **Manual Transfer:**
     UPI ID: restaurant@paytm
     Amount: ₹647
     Reference: ORD-1721234567-A7H4
     
     ✅ After payment, send: "paid [transaction_id]"
     📞 Example: "paid TXN987654321"

Customer: paid TXN987654321
Bot: ✅ **Payment Confirmed!**
     
     📋 Order #ORD-1721234567-A7H4
     💰 Amount: ₹647 - PAID ✅
     🆔 Transaction ID: TXN987654321
     
     🎉 Payment received successfully!
     👨‍🍳 Your order is now being prepared.
     
     📱 We'll notify you when it's ready for delivery!
     🕐 Estimated time: 30-45 minutes
```

#### **4. Order Status Tracking**
```
Customer: status
Bot: 📋 **Your Recent Orders:**
     
     **Order #A7H4** - ₹647 ✅ PAID
     👤 Rahul Kumar
     📍 JP Nagar, Bangalore
     🍛 2x Chicken Biryani, 1x Naan Bread
     📊 Status: Preparing 👨‍🍳
     🕐 ETA: 25 minutes
     
     💡 Need help? Type "help"
```

### 👑 **Restaurant Owner Experience**

#### **1. Order Management**
```
Owner: orders
Bot: 📋 **PENDING ORDERS (3)**
     
     1️⃣ (A7H4) Rahul Kumar 📍 JP Nagar ✅
     ₹647 • 2x Chicken Biryani, 1x Naan Bread
     
     2️⃣ (B2K9) Priya Singh 📍 MG Road ⏳
     ₹425 • 1x Vegetable Pulao, 2x Naan Bread
     
     3️⃣ (C5M3) Ahmed Khan 📍 Whitefield 🚚
     ₹380 • 1x Mughalai Biryani, 1x Pulka
     
     🚀 **Complete:** "done 1" or "complete A7H4"
     📋 **More:** "orders today" • "stats"

Owner: done 1
Bot: ✅ **Order #ORD-1721234567-A7H4 marked as COMPLETED!**
     
     👤 Customer: Rahul Kumar
     💰 Amount: ₹647
     📱 Customer notified: +919876543210
     
     🎉 Great job completing this order!
     
     💡 **Quick tip:** Use "done 2" for next order or "complete B2K9"!
```

#### **2. Payment Management**
```
Owner: paid A7H4
Bot: ✅ **Payment confirmed for Order #ORD-1721234567-A7H4**
     
     👤 Customer: Rahul Kumar  
     💰 Amount: ₹647
     💳 Method: UPI
     📱 Customer notified: +919876543210
     
     Payment status updated to PAID.

Owner: orders today
Bot: 📊 **TODAY'S ORDERS (12)**
     
     📈 **Summary:**
     • Total: 12 orders
     • Pending: 2
     • Completed: 8  
     • Cancelled: 2
     • Revenue: ₹4,580
     
     💰 **Payments:**
     • Paid: 9 orders (₹3,890)
     • Pending: 3 orders (₹690)
     
     📋 **Commands:** "orders" • "stats" • "complete [id]"
```

#### **3. Menu Management**
```
Owner: menu manage
Bot: 🍽️ **MENU MANAGEMENT**
     🏪 Delicious Bites
     📅 Last Updated: 2025-07-17
     📊 12/15 items available
     
     📋 **Current Menu:**
     1. 🍛 Chicken Biryani - ₹299 ✅
     2. 🍖 Mutton Karahi - ₹399 ✅
     3. 🍗 Chicken Tikka - ₹249 ✅
     4. 🍚 Vegetable Pulao - ₹199 ✅
     5. 🫓 Naan Bread - ₹49 ✅
     
     🔧 **Commands:**
     • **add item [name] [price]** - Add new item
     • **edit item [id] price [amount]** - Change price
     • **toggle item [id]** - Enable/disable
     • **delete item [id]** - Remove item

Owner: add item Samosa 25 Crispy fried pastry with spiced filling
Bot: ✅ **Menu item added successfully!**
     
     📝 **Item Details:**
     • ID: 16
     • Name: Samosa
     • Price: ₹25
     • Category: Appetizer
     • Description: Crispy fried pastry with spiced filling
     • Status: Available

Owner: edit item 1 price 320
Bot: ✅ **Menu item updated successfully!**
     
     📝 **Updated Item:**
     • ID: 1
     • Name: Chicken Biryani  
     • Price: ₹320 (was ₹299)
     • Category: Main Course
     • Status: Available
```

## 📱 Supported Order Formats

### **Multiple Ways to Order**
```
# By item name
"Order 2 Chicken Biryani"
"Order 1 Naan"

# By item number  
"Order 2 item 1"
"Order 3 item 5"

# By item ID with #
"Order 2 #1"
"Order 1 #5"

# Multiple items in one message
"Order 2 Chicken Biryani, 1 Naan, 3 Samosa"
"Order 1 item 1, 2 item 3, 1 item 5"

# Natural language
"I want 2 Chicken Biryani and 1 Naan"
"Get me 1 Vegetable Pulao"
```

## 🔧 Owner Command Reference

### **Order Management**
- `orders` - View pending orders (numbered list)
- `orders today` - All today's orders
- `orders completed` - View completed orders
- `complete 1` or `done 1` - Complete first order
- `complete A7H4` - Complete order with short ID
- `cancel order A7H4` - Cancel an order
- `paid A7H4` - Mark order as paid
- `stats` - Daily statistics

### **Menu Management**
- `menu manage` - View menu management
- `add item Samosa 25` - Add new item
- `add item Tea 15 Hot masala tea` - Add with description
- `edit item 1 price 320` - Change price
- `edit item Samosa name Crispy Samosa` - Change name
- `delete item 5` - Remove item
- `toggle item 3` - Enable/disable item

### **Quick Commands**
- `done 1` - Complete first pending order
- `paid A7H4` - Confirm payment for order
- `complete B2K9` - Complete specific order
- All commands work with short IDs (last 4 characters)

## 🌐 Dashboard Features

Access the web dashboard at: `http://localhost:3000/dashboard`

### **Dashboard Capabilities**
- **📋 Order Filters**: Pending, Completed, Paid, Cancelled orders
- **💰 Payment Management**: Mark orders as paid with one click
- **📊 Real-time Updates**: Live order status and payment tracking
- **📱 Mobile Responsive**: Works on all devices
- **🔍 Search & Filter**: Filter by customer, date, payment status
- **📈 Analytics**: Revenue tracking and order statistics

### **Payment Status Indicators**
- ✅ **Paid** - Payment confirmed
- ⏳ **Pending** - Payment not yet received
- 🚚 **COD** - Cash on delivery
- ❌ **Failed** - Payment failed

## 🎯 API Endpoints

### **Core Endpoints**
- `POST /webhook` - WhatsApp message webhook
- `GET /health` - Health check
- `GET /menu` - Get current menu
- `GET /dashboard` - Owner dashboard

### **Order Management**
- `GET /orders/daily-summary` - Daily order summary
- `POST /orders/:orderId/status` - Update order status
- `GET /owner/orders` - Get filtered orders
- `POST /owner/orders/:orderId/payment` - Mark as paid

### **Owner Dashboard API**
- `GET /owner/dashboard` - Dashboard data
- `GET /owner/orders?filter=paid` - Filter orders
- `POST /owner/orders/:orderId/status` - Update status

## 📁 Project Structure

```
whatsapp-restaurant-ordering/
├── server.js                          # Main application server
├── package.json                       # Dependencies and scripts
├── .env                               # Environment configuration
├── menu.json                          # Restaurant menu data
├── models/
│   └── database.js                    # Database models (Customer, Order)
├── services/
│   ├── whatsappService.js            # Twilio WhatsApp integration
│   ├── menuService.js                # Menu operations and display
│   ├── orderService.js               # Order processing and management
│   ├── customerService.js            # Customer onboarding and data
│   ├── paymentService.js             # Payment processing (UPI/COD)
│   └── menuManagementService.js      # Menu item CRUD operations
├── utils/
│   ├── messageParser.js              # WhatsApp message parsing and intents
│   └── responseTemplates.js          # Message response templates
└── public/
    └── enhanced-owner-dashboard.html  # Web dashboard interface
```

## 🛠️ Menu Configuration

Update `menu.json` to customize your restaurant's offerings:

```json
{
  "date": "2025-07-17",
  "restaurant_name": "Delicious Bites",
  "menu": [
    {
      "id": 1,
      "name": "Chicken Biryani",
      "description": "Aromatic basmati rice with tender chicken pieces",
      "price": 299,
      "category": "Main Course",
      "available": true,
      "emoji": "🍛"
    },
    {
      "id": 2,
      "name": "Vegetable Pulao",
      "description": "Fragrant rice with mixed vegetables", 
      "price": 199,
      "category": "Main Course",
      "available": true,
      "emoji": "🍚"
    }
  ]
}
```

## 🔧 Advanced Configuration

### **Payment Methods**
```javascript
// In paymentService.js
this.upiId = process.env.UPI_ID; // Your UPI ID
this.restaurantName = process.env.RESTAURANT_NAME;

// Supported payment methods
const methods = {
  'upi': 'UPI Payment',
  'cod': 'Cash on Delivery'
};
```

### **Customer Data Management**
```javascript
// Database schema for customers
Customer: {
  phone: String,           // WhatsApp phone number
  name: String,           // Customer name
  location: String,       // Default delivery location
  currentLocation: String, // Current session location
  totalOrders: Number,    // Total order count
  sessionActive: Boolean, // Current session status
  lastLocationUpdate: Date
}
```

### **Order Tracking**
```javascript
// Order statuses
const statuses = [
  'pending',     // Order placed, awaiting confirmation
  'confirmed',   // Order confirmed by restaurant
  'preparing',   // Food being prepared
  'ready',       // Order ready for delivery
  'completed',   // Order completed/delivered
  'cancelled'    // Order cancelled
];

// Payment statuses  
const paymentStatuses = [
  'pending',     // Payment not received
  'paid',        // Payment confirmed
  'cod',         // Cash on delivery
  'failed'       // Payment failed
];
```

## 🚀 Deployment Options

### **Railway Deployment** 🚂

**Quick Deploy**: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

**Manual Setup**:
1. Connect GitHub repository to Railway
2. Add MySQL database service 
3. Configure environment variables:
   ```bash
   # Twilio WhatsApp (Required)
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=whatsapp:+14155238886
   
   # Restaurant Settings (Required)
   RESTAURANT_OWNER_PHONE=whatsapp:+919876543210
   WEBHOOK_URL=https://your-app.railway.app
   
   # Database (Auto-configured by Railway MySQL)
   DATABASE_URL=mysql://user:pass@host:port/db
   ```
4. Deploy automatically
5. Update Twilio webhook: `https://your-app.railway.app/webhook`

**📋 Detailed Guide**: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

**✅ Verification**: 
```bash
# Check health
curl https://your-app.railway.app/health

# Test deployment
bash verify-deployment.sh
```

### **Heroku Deployment**
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=your_sid
heroku config:set TWILIO_AUTH_TOKEN=your_token
heroku config:set MYSQL_HOST=your_db_host

# Deploy
git push heroku main
```

### **VPS/Server Deployment**
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start server.js --name "whatsapp-restaurant"

# Setup auto-restart
pm2 startup
pm2 save
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Webhook Not Receiving Messages**
```bash
# Check ngrok tunnel is active
ngrok http 3000

# Verify webhook URL in Twilio console
# URL format: https://your-ngrok-url.ngrok.io/webhook
```

#### **2. Database Connection Issues**
```bash
# Test MySQL connection
mysql -u your_user -p -h localhost

# Verify environment variables
echo $MYSQL_HOST
echo $MYSQL_USER
```

#### **3. Payment Commands Not Working**
- Ensure owner phone matches `RESTAURANT_OWNER_PHONE` in `.env`
- Use exact format: `paid A7H4` (last 4 digits of order ID)  
- Check order exists first: `orders`
- Verify order ID format in logs

#### **4. Menu Not Loading**
```bash
# Verify menu.json exists and is valid JSON
cat menu.json | jq .

# Check file permissions
ls -la menu.json
```

## 📊 Performance & Scaling

### **Database Optimization**
- Index on `orderId`, `customerPhone`, `createdAt`
- Regular cleanup of old orders
- Connection pooling enabled

### **Message Processing**
- Asynchronous message handling
- TwiML response under 10 seconds
- Error recovery and retry logic

### **Monitoring**
- Health check endpoint: `/health`
- Order processing logs
- Payment transaction logs
- WhatsApp delivery status tracking

## 🔐 Security Best Practices

### **Environment Security**
```bash
# Secure environment variables
chmod 600 .env

# Use strong database passwords
# Implement Twilio signature validation
# HTTPS for webhook endpoints
```

### **Data Protection**
- Customer phone number encryption
- Payment data handled securely
- Session timeout management
- Input validation and sanitization

## 📈 Analytics & Insights

### **Available Metrics**
- Daily order count and revenue
- Popular menu items
- Customer retention rates
- Payment method preferences
- Order completion times
- Peak ordering hours

### **Dashboard Metrics**
```javascript
// Daily statistics include:
{
  totalOrders: 45,
  pendingOrders: 3,
  completedOrders: 40,
  cancelledOrders: 2,
  totalRevenue: 8750,
  averageOrderValue: 194,
  topItems: [
    { name: "Chicken Biryani", count: 15 },
    { name: "Vegetable Pulao", count: 8 }
  ]
}
```

## 🎯 Future Enhancements

### **Planned Features**
- **📍 GPS Location**: Real-time delivery tracking
- **🗣️ Multi-language**: Hindi, Tamil, Telugu support  
- **📅 Order Scheduling**: Advance order booking
- **⭐ Ratings**: Customer feedback system
- **🎁 Loyalty Program**: Points and rewards
- **📊 Advanced Analytics**: Business intelligence dashboard
- **🔔 Push Notifications**: SMS backup notifications
- **💳 Payment Gateway**: Credit/debit card integration
- **🏪 Multi-restaurant**: Support multiple restaurant locations

### **Technical Roadmap**
- Redis caching for performance
- Horizontal scaling support
- Advanced order routing
- Machine learning recommendations
- Voice message support
- Integration APIs for POS systems

## 📞 Support & Community

### **Getting Help**
- 📚 Check documentation first
- 🐛 Create GitHub issue for bugs
- 💡 Feature requests welcome
- 📧 Contact: support@yourrestaurant.com

### **Contributing**
```bash
# Fork repository
git clone https://github.com/yourusername/whatsapp-restaurant-ordering.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm test

# Submit pull request
git push origin feature/amazing-feature
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for restaurant businesses embracing digital transformation through WhatsApp! 🍕📱**

*Transform your restaurant's ordering process and provide customers with a seamless WhatsApp-based ordering experience.*
