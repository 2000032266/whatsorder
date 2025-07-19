#!/bin/bash
# Railway Deployment Script

echo "🚀 Starting Railway deployment preparation..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database migrations (if needed)
echo "🗃️ Setting up database..."
npm run db:setup 2>/dev/null || echo "⚠️ Database setup script not found, skipping..."

# Start the application
#!/bin/bash

# Railway deployment startup script for WhatsApp Restaurant Ordering System
echo "🚀 Starting WhatsApp Restaurant Ordering System on Railway..."

# Display environment info
echo "📋 Environment Information:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "Railway Environment: ${RAILWAY_ENVIRONMENT:-not set}"

# Check if database variables are set
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is configured"
elif [ -n "$MYSQL_URL" ]; then
    echo "✅ MYSQL_URL is configured"
elif [ -n "$MYSQL_HOST" ]; then
    echo "✅ MySQL connection variables are configured"
else
    echo "⚠️  Warning: No database configuration found"
fi

# Check Twilio configuration
if [ -n "$TWILIO_ACCOUNT_SID" ] && [ -n "$TWILIO_AUTH_TOKEN" ]; then
    echo "✅ Twilio configuration found"
else
    echo "⚠️  Warning: Twilio configuration missing"
fi

# Run any necessary database setup or migrations
echo "🔧 Running database setup..."
# Add database migration commands here if needed
# npm run migrate

# Start the application
echo "🎯 Starting the application..."
exec node server.js
npm start
