#!/bin/bash

# Railway Deployment Verification Script
# Run this after deployment to verify everything is working

echo "🔍 Railway Deployment Verification"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Get the deployment URL
RAILWAY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Could not get Railway deployment URL"
    echo "💡 Make sure you're in the project directory and run 'railway link' first"
    exit 1
fi

echo "🌐 Testing deployment at: $RAILWAY_URL"
echo ""

# Test health endpoint
echo "🔍 Testing health endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed"
    curl -s "$RAILWAY_URL/health" | jq '.' 2>/dev/null || curl -s "$RAILWAY_URL/health"
else
    echo "❌ Health check failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test menu endpoint
echo "🔍 Testing menu endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/menu")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Menu endpoint accessible"
    MENU_ITEMS=$(curl -s "$RAILWAY_URL/menu" | jq '.menu | length' 2>/dev/null)
    if [ "$MENU_ITEMS" ]; then
        echo "📋 Menu has $MENU_ITEMS items"
    fi
else
    echo "❌ Menu endpoint failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test owner dashboard
echo "🔍 Testing owner dashboard..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/owner")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Owner dashboard accessible"
else
    echo "❌ Owner dashboard failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Check environment variables
echo "🔍 Checking environment configuration..."
railway variables | grep -E "(TWILIO|DATABASE|MYSQL)" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Environment variables configured"
    echo "📋 Key variables found:"
    railway variables | grep -E "(TWILIO|DATABASE|MYSQL|RESTAURANT)" | head -5
else
    echo "⚠️  Some environment variables may be missing"
fi
echo ""

# Check recent logs for errors
echo "🔍 Checking recent logs for errors..."
LOG_ERRORS=$(railway logs --limit 20 | grep -i "error\|fail\|exception" | wc -l)
if [ "$LOG_ERRORS" -eq 0 ]; then
    echo "✅ No recent errors in logs"
else
    echo "⚠️  Found $LOG_ERRORS potential errors in recent logs"
    echo "🔍 Recent errors:"
    railway logs --limit 20 | grep -i "error\|fail\|exception" | tail -3
fi
echo ""

# Summary
echo "📊 Deployment Verification Summary"
echo "================================="
echo "🌐 URL: $RAILWAY_URL"
echo "🔗 Health: $RAILWAY_URL/health"
echo "🍽️  Menu: $RAILWAY_URL/menu"
echo "👑 Owner: $RAILWAY_URL/owner"
echo ""

# Next steps
echo "🎯 Next Steps:"
echo "1. Test WhatsApp integration by sending 'hi' to your Twilio number"
echo "2. Configure Twilio webhook URL: $RAILWAY_URL/webhook"
echo "3. Test placing an order via WhatsApp"
echo "4. Check owner dashboard functionality"
echo "5. Set up custom domain if needed"
echo ""

echo "🎉 Verification complete!"

# Optional: Open dashboard in browser
read -p "🌐 Open owner dashboard in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "$RAILWAY_URL/owner"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$RAILWAY_URL/owner"
    else
        echo "🌐 Open this URL in your browser: $RAILWAY_URL/owner"
    fi
fi
