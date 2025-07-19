# 🚂 Railway Deployment Guide

## WhatsApp Restaurant Ordering System - Railway Cloud Deployment

This guide will help you deploy your WhatsApp restaurant ordering system to Railway cloud platform.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [Railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Twilio Account**: For WhatsApp Business API
4. **UPI Payment Gateway**: If using UPI payments

## 🚀 Step-by-Step Deployment

### 1. **Prepare Your Repository**

Ensure these files are in your project root:
- ✅ `railway.json` (deployment configuration)
- ✅ `package.json` (with engines specified)
- ✅ `start.sh` (startup script)
- ✅ `.env.railway` (environment template)

### 2. **Connect to Railway**

1. Go to [Railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 3. **Add MySQL Database**

1. In your Railway project dashboard
2. Click **"+ New Service"**
3. Select **"Database"** → **"MySQL"**
4. Railway will automatically create and configure the database
5. Note down the connection details

### 4. **Configure Environment Variables**

In Railway dashboard, go to your service → **Variables** tab and add:

#### 🔧 **Database Configuration** (Auto-configured by Railway MySQL)
```
DATABASE_URL=mysql://username:password@host:port/database
MYSQL_HOST=containers-us-west-xxx.railway.app
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=railway
```

#### 📱 **Twilio WhatsApp Configuration**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

#### 🏪 **Restaurant Configuration**
```
RESTAURANT_OWNER_PHONE=whatsapp:+919876543210
RESTAURANT_NAME=Your Restaurant Name
WEBHOOK_URL=https://your-app-name.railway.app
```

#### 💳 **Payment Configuration** (Optional)
```
UPI_ID=restaurant@paytm
UPI_MERCHANT_NAME=Your Restaurant
PAYMENT_QR_ENABLED=true
```

#### 🔐 **Security**
```
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
```

### 5. **Set Up Custom Domain** (Optional)

1. In Railway dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update `WEBHOOK_URL` environment variable
4. Configure DNS records as shown by Railway

### 6. **Configure Twilio Webhook**

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** → **Settings** → **WhatsApp sandbox settings**
3. Set webhook URL to: `https://your-app-name.railway.app/webhook`
4. Set HTTP method to **POST**
5. Save configuration

### 7. **Deploy and Test**

1. **Automatic Deployment**: Railway deploys automatically on git push
2. **Manual Deployment**: Click **"Deploy"** in Railway dashboard
3. **Check Logs**: Monitor deployment in Railway **Deployments** tab

## 📊 **Monitoring and Management**

### **Health Check**
- Health endpoint: `https://your-app-name.railway.app/health`
- Returns server status and timestamp

### **Owner Dashboard**
- Dashboard URL: `https://your-app-name.railway.app/owner`
- Enhanced dashboard: `https://your-app-name.railway.app/enhanced-dashboard`

### **Logs and Debugging**
- View logs in Railway dashboard → **Deployments** → **View Logs**

## 🔧 **Post-Deployment Configuration**

### **1. Update Menu**
Edit `menu.json` file and redeploy, or use owner commands:
```
add item Pizza 299
edit item 1 price 349
toggle item Burger
```

### **2. Test WhatsApp Integration**
Send a test message to your Twilio WhatsApp number:
```
hi
menu
order 2 chicken biryani
```

### **3. Configure Owner Commands**
Send messages from restaurant owner phone:
```
orders
stats
menu manage
```

## 🛠️ **Environment Variables Reference**

### **Required Variables**
| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_auth_token` |
| `TWILIO_PHONE_NUMBER` | WhatsApp Business Number | `whatsapp:+14155238886` |
| `RESTAURANT_OWNER_PHONE` | Owner's WhatsApp Number | `whatsapp:+919876543210` |
| `WEBHOOK_URL` | Your Railway App URL | `https://app-name.railway.app` |

### **Database Variables** (Auto-configured by Railway)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Complete MySQL connection string |
| `MYSQL_HOST` | MySQL host |
| `MYSQL_PORT` | MySQL port |
| `MYSQL_USER` | MySQL username |
| `MYSQL_PASSWORD` | MySQL password |
| `MYSQL_DATABASE` | Database name |

### **Optional Variables**
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `UPI_ID` | UPI ID for payments | Not set |
| `PAYMENT_QR_ENABLED` | Enable QR codes | `false` |

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Failed**
- Check if MySQL service is running in Railway
- Verify database environment variables
- Check Railway MySQL service logs

#### **2. Twilio Webhook Not Working**
- Verify webhook URL in Twilio console
- Check if URL is accessible: `curl https://your-app.railway.app/health`
- Verify Twilio credentials in Railway variables

#### **3. Environment Variables Not Loading**
- Check variable names (case-sensitive)
- Verify variables are set in Railway dashboard
- Restart the service after adding variables

#### **4. Application Not Starting**
- Check Railway deployment logs
- Verify `package.json` start script
- Check for syntax errors in code

### **Debug Commands**

#### **Check Application Health**
```bash
curl https://your-app-name.railway.app/health
```

#### **Test Menu Endpoint**
```bash
curl https://your-app-name.railway.app/menu
```

#### **View Railway Logs**
```bash
railway logs
```

## 📈 **Scaling and Performance**

### **Railway Pro Plan Benefits**
- Higher resource limits
- Custom domains
- Priority support
- Advanced metrics

### **Database Optimization**
- Use Railway MySQL Pro for better performance
- Implement connection pooling
- Add database indexing for large datasets

### **Monitoring**
- Set up Railway metrics monitoring
- Configure alerts for downtime
- Monitor database performance

## 🔒 **Security Best Practices**

### **Environment Variables**
- Never commit `.env` files to git
- Use Railway's secure variable storage
- Rotate Twilio credentials regularly

### **Database Security**
- Railway MySQL is automatically secured
- Use strong passwords
- Enable SSL connections

### **Application Security**
- Keep dependencies updated
- Validate all user inputs
- Implement rate limiting

## 📞 **Support and Resources**

### **Railway Support**
- Railway Discord Community
- Railway Documentation
- Railway Status Page

### **Project Support**
- GitHub Issues
- WhatsApp Business API Documentation
- Twilio Support

## 🎉 **Deployment Checklist**

- [ ] Repository connected to Railway
- [ ] MySQL database service added
- [ ] Environment variables configured
- [ ] Twilio webhook URL updated
- [ ] Health check endpoint working
- [ ] WhatsApp test message successful
- [ ] Owner dashboard accessible
- [ ] Payment system tested (if enabled)
- [ ] Menu items configured
- [ ] Owner commands working

## 📝 **Example Deployment Commands**

### **Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project
railway link

# Deploy manually
railway up

# View logs
railway logs

# Open in browser
railway open
```

### **Environment Setup**
```bash
# Copy environment template
cp .env.railway .env.local

# Edit variables
nano .env.local

# Set variables in Railway
railway variables set TWILIO_ACCOUNT_SID=ACxxxxx
```

## 🌟 **Success Indicators**

After successful deployment, you should see:

1. ✅ **Health Check**: `https://your-app.railway.app/health` returns OK
2. ✅ **Menu Loading**: `https://your-app.railway.app/menu` shows restaurant menu
3. ✅ **WhatsApp Response**: Bot responds to "hi" or "menu" messages
4. ✅ **Order Processing**: Can place orders via WhatsApp
5. ✅ **Owner Dashboard**: `https://your-app.railway.app/owner` loads correctly
6. ✅ **Database**: Orders are saved and retrievable

---

🎉 **Congratulations!** Your WhatsApp Restaurant Ordering System is now live on Railway!

For questions or support, check the troubleshooting section or create an issue in the repository.
