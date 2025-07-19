# WhatsApp Food Ordering Bot 🍽️📱

A comprehensive WhatsApp ChatBot built with Node.js and Express that handles food orders through Twilio's WhatsApp API. Perfect for restaurants wanting to automate their ordering process!

## Features ✨

- 🔗 **WhatsApp Integration**: Connect via Twilio WhatsApp API
- 📋 **Dynamic Menu**: Daily menu from JSON file with emojis
- 🛒 **Order Processing**: Accept and process food orders
- 💾 **Data Storage**: MySQL database with Sequelize ORM
- 📧 **Notifications**: Confirm orders to customers and notify owners
- 🤖 **Smart Parsing**: Understand natural language orders
- 🔍 **Search**: Find menu items by name or category
- 📊 **Status Tracking**: Real-time order status updates
- 💡 **Help System**: Built-in help and command assistance

## Quick Start 🚀

### Prerequisites

- Node.js (v14 or higher)
- Twilio Account with WhatsApp API access
- MySQL database
- ngrok (for local development)

### Installation

1. **Clone and install dependencies:**
```bash
cd WhatsOrder
npm install
```

2. **Configure environment variables:**
Update `.env` file with your credentials:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
RESTAURANT_OWNER_PHONE=whatsapp:+1234567890
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=whatsorder
WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook
UPI_ID=your_restaurant_upi_id
RESTAURANT_NAME=Your Restaurant Name
```

3. **Start the server:**
```bash
npm run dev
```

4. **Set up ngrok for local development:**
```bash
ngrok http 3000
```

5. **Configure Twilio webhook:**
- Go to Twilio Console > WhatsApp > Sandbox
- Set webhook URL to: `https://your-ngrok-url.ngrok.io/webhook`

## Usage 📱

### Customer Commands

- **View Menu**: Send `menu`, `hi`, or `hello`
- **Place Order**: 
  - `Order 2 Chicken Biryani` (single item)
  - `Order 1 item 3` (using menu item number)
  - `Order 3 #1` (using menu ID)
  - `Order 2 Chicken Biryani, 1 Veg Pulao, 3 Naan` (multiple items)
- **Payment Options**:
  - `pay cod` - Select Cash on Delivery
  - `pay upi` - Get UPI payment details
  - `paid TXN123456` - Confirm UPI payment with transaction ID
- **Order Management**:
  - `status` - Check order status
  - `my orders` - View recent orders
- **Get Help**: Send `help` or `payment help`
- **Search**: `Find chicken` or `Do you have biryani?`

### Order Process Flow
1. **Browse Menu** → Customer views available items
2. **Place Order** → Customer selects items and quantities  
3. **Provide Details** → Name and delivery location
4. **Choose Urgency** → Normal, Priority, or Express delivery
5. **Select Payment** → COD or UPI payment method
6. **Confirm Payment** → For UPI: send transaction ID
7. **Track Order** → Real-time status updates

### Example Conversations

#### 📋 **Complete Order Flow**
```
Customer: hi
Bot: 🍽️ Welcome to Delicious Bites! 
     📅 Today's Menu (2025-07-17)
     
     🍴 Main Course
     🍛 1. Chicken Biryani - ₹299
        Aromatic basmati rice with tender chicken pieces
     🍲 2. Veg Pulao - ₹199
        Fragrant rice with mixed vegetables
     🍗 3. Chicken Curry - ₹249
        Spicy chicken in rich gravy
     
     🍞 Breads
     🥖 4. Naan - ₹49
        Fresh baked Indian bread
     🌯 5. Roti - ₹29
        Whole wheat flatbread
     
     Type 'order' followed by items to place your order!

Customer: Order 2 Chicken Biryani, 1 Naan
Bot: 🛒 Great choice! Your order:
     • 2x Chicken Biryani - ₹598
     • 1x Naan - ₹49
     💰 Total: ₹647
     
     📝 Please share your name for the order:

Customer: Rahul Kumar
Bot: Hi Rahul! 📍 Please share your delivery location:

Customer: JP Nagar, Bangalore
Bot: ⏰ How urgent is your order?
     1️⃣ Normal (45-60 mins) 
     2️⃣ Priority (30-45 mins) - ₹50 extra
     3️⃣ Express (20-30 mins) - ₹100 extra

Customer: 1
Bot: ✅ Order confirmed!
     📋 Order ID: ORD-1642345678-A1B2
     👤 Customer: Rahul Kumar
     📍 Location: JP Nagar, Bangalore
     💰 Total: ₹647
     🕐 Estimated delivery: 45-60 minutes
     
     💳 Choose payment method:
     1️⃣ Cash on Delivery (COD)
     2️⃣ UPI Payment
     
     Reply with 'pay cod' or 'pay upi'
```

#### 💳 **Payment Flow - COD**
```
Customer: pay cod
Bot: 💰 Payment Method Selected: Cash on Delivery
     ✅ Order confirmed! 
     
     📋 Order Summary:
     Order ID: ORD-1642345678-A1B2
     Amount: ₹647 (Pay on delivery)
     
     � Your order is being prepared!
     We'll notify you when it's ready for delivery.
```

#### 💳 **Payment Flow - UPI**
```
Customer: pay upi
Bot: 💳 UPI Payment Details:
     💰 Amount: ₹647
     🆔 UPI ID: restaurant@paytm
     📱 UPI Link: upi://pay?pa=restaurant@paytm&am=647&tn=Order-A1B2
     
     📲 Scan QR or click link to pay:
     [QR Code would be generated here]
     
     After payment, send: paid [transaction_id]
     Example: paid TXN123456789

Customer: paid TXN987654321
Bot: ✅ Payment Confirmed!
     💳 Transaction ID: TXN987654321
     💰 Amount: ₹647 - PAID
     
     📋 Order Status: Confirmed & Paid
     🚚 Your order is now being prepared!
     Estimated delivery: 45-60 minutes
```

#### 📞 **Order Status Check**
```
Customer: status
Bot: 📋 Your Recent Orders:
     
     Order #A1B2 - ₹647 💚 PAID
     👤 Rahul Kumar
     📍 JP Nagar, Bangalore
     🍛 2x Chicken Biryani, 1x Naan
     📊 Status: Preparing 👨‍🍳
     🕐 ETA: 30 minutes
```

## API Endpoints 🛠️

### Webhook
- `POST /webhook` - Handle incoming WhatsApp messages

### Management
- `GET /health` - Health check
- `GET /menu` - Get current menu
- `GET /orders/daily-summary` - Daily orders summary
- `POST /orders/:orderId/status` - Update order status
- `POST /send-welcome` - Send welcome message

### Owner Dashboard
- `GET /dashboard` - Basic owner dashboard
- `GET /enhanced-dashboard` - Enhanced dashboard with payment filters
- `GET /owner/orders` - Get filtered orders (supports `?filter=paid` for paid orders)
- `POST /owner/orders/:orderId/status` - Update order status
- `POST /owner/orders/:orderId/payment` - Mark order as paid (dashboard)

## Project Structure 📁

```
WhatsOrder/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env                      # Environment variables
├── menu.json                 # Daily menu data
├── models/
│   └── database.js           # MySQL models with Sequelize
├── services/
│   ├── menuService.js        # Menu operations
│   ├── orderService.js       # Order management
│   └── whatsappService.js    # WhatsApp messaging
└── utils/
    ├── messageParser.js      # Message parsing logic
    └── responseTemplates.js  # Response templates
```

## Menu Configuration 🍽️

Update `menu.json` daily with your restaurant's offerings:

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
      "name": "Veg Pulao", 
      "description": "Fragrant rice with mixed vegetables",
      "price": 199,
      "category": "Main Course",
      "available": true,
      "emoji": "🍲"
    },
    {
      "id": 3,
      "name": "Naan",
      "description": "Fresh baked Indian bread", 
      "price": 49,
      "category": "Breads",
      "available": true,
      "emoji": "🥖"
    }
  ]
}
```

## Order Management 📊

### For Restaurant Owners

1. **Receive Notifications**: Get WhatsApp alerts for new orders
2. **Update Status**: Use API endpoints to update order status
3. **Daily Reports**: Check `/orders/daily-summary` for insights

### Order Status Flow
- `pending` → `confirmed` → `preparing` → `ready` → `delivered`

## Customization 🎨

### Adding New Features

1. **Custom Commands**: Add new intents in `messageParser.js`
2. **Response Templates**: Modify `responseTemplates.js`
3. **Menu Categories**: Update menu structure in `menu.json`
4. **Order Workflow**: Customize order processing in `orderService.js`

### Message Templates

All responses use emojis and structured formatting for better readability:
- ✅ Success messages
- ❌ # WhatsApp Restaurant Ordering System

A complete WhatsApp-based restaurant ordering system built with Node.js, Express, and Twilio. Customers can place orders, make payments (COD/UPI), and track their orders through WhatsApp messages.

## 🚀 Features

### For Customers
- **WhatsApp Ordering**: Place orders directly through WhatsApp messages
- **Smart Menu**: View menu with categories and prices in Indian Rupees (₹)
- **Order Tracking**: Real-time order status updates
- **Customer Details**: Name and location collection for personalized service
- **Delivery Options**: Choose urgency level (Normal/Priority/Express)
- **Payment Options**: Cash on Delivery (COD) and UPI payments
- **Payment Confirmation**: Secure transaction ID verification for UPI payments
- **Location-based Delivery**: Address management for accurate delivery

### For Restaurant Owners
- **Order Management**: Receive and manage orders through WhatsApp
- **Dashboard**: Web-based dashboard for order tracking with paid orders filter
- **Payment Tracking**: Monitor payment status and methods with manual confirmation
- **Customer Management**: Track customer information and order history
- **Short Code Commands**: Use last 4 digits of order ID for quick actions

### Payment System
- **Cash on Delivery (COD)**: Pay when food is delivered
- **UPI Payments**: Instant payments with UPI links and QR codes
- **Payment Confirmation**: Automated payment status tracking
- **Owner Payment Management**: Mark orders as paid via WhatsApp or dashboard
- **Short Code Support**: Use last 4 digits of order ID for convenience

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **WhatsApp API**: Twilio WhatsApp Business API
- **Payment**: UPI integration for Indian payments
- **Frontend**: HTML/CSS/JavaScript dashboard

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Twilio account with WhatsApp Business API
- Ngrok for webhook tunneling (development)

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-restaurant-ordering.git
   cd whatsapp-restaurant-ordering
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=whatsapp:+your_twilio_whatsapp_number
   RESTAURANT_OWNER_PHONE=whatsapp:+your_owner_phone
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=whatsorder
   WEBHOOK_URL=your_ngrok_url
   UPI_ID=your_restaurant_upi_id
   RESTAURANT_NAME=Your Restaurant Name
   ```

4. **Set up the database**
   ```bash
   # Create MySQL database
   mysql -u root -p -e "CREATE DATABASE whatsorder;"
   
   # Import database structure (optional - tables are auto-created)
   mysql -u root -p whatsorder < database-setup.sql
   
   # Or run the application (tables will be created automatically)
   npm start
   ```
   
   *Note: Check `database-setup.sql` file for complete database schema and table structures.*

5. **Configure Twilio Webhook**
   - Go to Twilio Console → Phone Numbers → Your WhatsApp Number
   - Set webhook URL: `https://your-ngrok-url.ngrok.io/webhook`

## 🚀 Usage

### Starting the Server
```bash
npm start
```

The server will start on port 3000 (or your configured PORT).

### Customer Commands (WhatsApp)
- `menu` - View restaurant menu
- `Order 2 Chicken Biryani` - Place single item order
- `Order 2 Chicken Biryani, 1 Veg Pulao, 3 Naan` - Place multiple items order
- `pay cod` - Select Cash on Delivery
- `pay upi` - Get UPI payment details and QR code
- `paid TXN123456` - Confirm UPI payment with transaction ID
- `payment help` - View payment options and help
- `status` - Check current order status
- `my orders` - View order history

**Complete Order Flow:**
1. Send `hi` or `menu` to view menu
2. Place order: `Order [quantity] [item name]`
3. Provide your name when asked
4. Share delivery location
5. Choose delivery urgency (Normal/Priority/Express)
6. Select payment method (`pay cod` or `pay upi`)
7. For UPI: Complete payment and send `paid [transaction_id]`
8. Track order with `status` command

### Owner Commands (WhatsApp)
- `orders` - View pending orders
- `complete [order_id]` - Mark order as complete (use full ID or last 4 digits)
- `paid [order_id]` - Mark specific order as paid (use full ID or last 4 digits)  
- `stats` - View daily statistics

**Examples:**
- `paid ABCD` - Mark order ending in ABCD as paid
- `complete 1234` - Complete order ending in 1234
- `cancel WXYZ` - Cancel order ending in WXYZ
- `paid ORD-1234567890-ABCD` - Full order ID also works

**Payment Workflow:**
- For **COD orders**: Use `paid [last4digits]` when cash is received
- For **UPI orders**: Use `paid [last4digits]` to manually confirm if needed
- Order completion (`complete`) is separate from payment confirmation
- Both COD and UPI orders can be completed before payment confirmation

### Dashboard
Access the owner dashboard at: `http://localhost:3000/dashboard`

**Dashboard Features:**
- **📋 Pending Orders** - View all pending orders
- **✅ Completed Orders** - View completed orders  
- **💰 Paid Orders** - Filter orders by payment status
- **❌ Cancelled Orders** - View cancelled orders
- **📅 Today's Orders** - Daily order overview
- **Complete Order Button** - Mark orders as ready (separate from payment)
- **Mark as Paid Button** - Manually confirm payment received
- **Payment Status Display** - Clear indication of UPI vs COD payments

## 📱 Payment Methods

### Cash on Delivery (COD)
- Customers select COD option with `pay cod` command
- Payment collected on delivery by delivery person
- Order confirmed immediately after selection
- Owner can mark as paid using `paid [order_id]` command when cash received
- No advance payment required

### UPI Payments
- Generate instant UPI payment links with `pay upi` command  
- QR code provided for easy scanning with any UPI app
- Support for all major UPI apps (PhonePe, Google Pay, Paytm, BHIM)
- Customer confirms payment with `paid [transaction_id]` command
- Automatic payment status update to "paid" upon confirmation
- Real-time transaction verification
- Owner can manually confirm if needed using `paid [order_id]` command

### Payment Confirmation Process
1. **For COD**: 
   - Customer selects `pay cod`
   - Order confirmed, payment pending until delivery
   - Driver collects cash on delivery
   - Owner marks as paid using short command

2. **For UPI**:
   - Customer selects `pay upi` 
   - Bot provides UPI ID, link, and QR code
   - Customer completes payment in UPI app
   - Customer sends `paid [transaction_id]` to confirm
   - System automatically verifies and updates status

### Payment Management
- **Separate workflow**: Order completion ≠ Payment confirmation
- **COD orders**: Can be marked "complete" without payment confirmation
- **UPI orders**: Automatically marked as paid when customer confirms
- **Manual override**: Owner can mark any order as paid using short commands
- **Dashboard control**: "Mark as Paid" button for manual confirmation
- **Transaction tracking**: All payment confirmations logged with timestamps

## 🏗️ Project Structure

```
whatsapp-restaurant-ordering/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── menu.json                 # Restaurant menu configuration
├── database-setup.sql        # MySQL database schema
├── models/
│   └── database.js           # Database models and connection
├── services/
│   ├── whatsappService.js    # WhatsApp messaging service
│   ├── menuService.js        # Menu management service
│   ├── orderService.js       # Order processing service
│   ├── customerService.js    # Customer management service
│   └── paymentService.js     # Payment processing service
├── utils/
│   ├── messageParser.js      # WhatsApp message parsing
│   └── responseTemplates.js  # Message templates
└── public/
    └── enhanced-owner-dashboard.html  # Owner dashboard
```

## 🌐 Deployment

### Deploy to Railway
1. Fork this repository
2. Connect to Railway
3. Add environment variables
4. Deploy automatically

### Deploy to Heroku
1. Create new Heroku app
2. Set environment variables
3. Connect to GitHub
4. Deploy from main branch

### Deploy to Vercel
1. Import project to Vercel
2. Configure environment variables
3. Deploy with automatic builds

## 🔧 Configuration

### Menu Configuration
Edit `menu.json` to customize your restaurant menu:
```json
{
  "restaurant_name": "Your Restaurant",
  "categories": [
    {
      "name": "Main Course",
      "items": [
        {
          "id": 1,
          "name": "Chicken Biryani",
          "price": 299,
          "description": "Aromatic basmati rice with tender chicken"
        },
        {
          "id": 2,
          "name": "Veg Pulao",
          "price": 199, 
          "description": "Fragrant rice with mixed vegetables"
        }
      ]
    },
    {
      "name": "Breads",
      "items": [
        {
          "id": 3,
          "name": "Naan",
          "price": 49,
          "description": "Fresh baked Indian bread"
        }
      ]
    }
  ]
}
```

### Payment Configuration
- Set your UPI ID in environment variables
- Configure payment methods in `paymentService.js`
- Customize payment messages for your region

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the maintainers

## 🚀 Features Coming Soon

- Multi-language support
- Order scheduling
- Delivery tracking
- Customer feedback system
- Analytics dashboard
- Multi-restaurant support
- Automated payment gateway integration
- SMS notifications backup
- Voice order support

## 🔧 Recent Updates

### Payment Management Enhancements
- ✅ **Fixed payment confirmation bug** - Owner `paid [orderId]` command now targets correct order
- ✅ **Added short code support** - Use last 4 digits of order ID for convenience
- ✅ **Separated completion from payment** - Complete orders without automatic payment marking
- ✅ **Enhanced dashboard** - Added "Paid Orders" filter and "Mark as Paid" button
- ✅ **Improved payment display** - Clear indication of UPI vs COD payment status
- ✅ **Owner command priority** - Owner commands processed before customer payment commands

### Dashboard Improvements
- ✅ **💰 Paid Orders tab** - Filter to view all paid orders
- ✅ **Payment status indicators** - Visual payment confirmation status
- ✅ **Manual payment confirmation** - Button to mark orders as paid
- ✅ **Enhanced order cards** - Better payment information display

---

Made with ❤️ for restaurant businesses to embrace digital ordering through WhatsApp. messages  
- 🍽️ Menu displays
- 📋 Order confirmations
- 💡 Helpful suggestions

## Database Schema 💾

The complete database schema is available in the `database-setup.sql` file. Key tables include:

### Orders Table
- Order management with customer details
- Item details and quantities
- Payment and delivery status
- Timestamps and tracking information

### Customers Table  
- Customer profile management
- Order history and preferences
- Contact information

### Menu Items Table
- Product catalog management
- Pricing and availability
- Categories and descriptions

*For detailed table structures and relationships, refer to the `database-setup.sql` file.*

## Troubleshooting 🔧

### Common Issues

1. **Webhook not receiving messages**
   - Check ngrok tunnel is active
   - Verify webhook URL in Twilio console
   - Ensure server is running on correct port

2. **Menu not loading**
   - Verify `menu.json` file exists and is valid JSON
   - Check file permissions

3. **Orders not saving**
   - Check MySQL database connection
   - Verify environment variables
   - Review server logs for errors

4. **Payment confirmation not working**
   - Ensure owner phone number matches `RESTAURANT_OWNER_PHONE` in `.env`
   - Use exact format: `paid ABCD` (last 4 digits of order ID)
   - Check if order exists using `orders` command first
   - Verify order ID format in server logs

5. **Dashboard not showing paid orders**
   - Click "💰 Paid Orders" filter button
   - Check if orders have `paymentStatus = 'paid'` in database
   - Refresh dashboard after marking orders as paid

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## Deployment 🌐

### Production Deployment

1. **Environment Setup**:
   - Use production MySQL instance
   - Set up proper webhook URL
   - Configure environment variables

2. **Hosting Options**:
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Railway

3. **Security**:
   - Use HTTPS for webhook
   - Validate Twilio signatures
   - Implement rate limiting

## Contributing 🤝

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License 📄

MIT License - see LICENSE file for details

## Support 💬

For issues and questions:
- Create GitHub issue
- Check documentation
- Review troubleshooting guide

---

**Happy ordering! 🍕📱**
