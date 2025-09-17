#!/bin/bash

# Script to populate the database with Stripe and Cursor companies

API_BASE="http://localhost:8000"

echo "🚀 Populating database with Stripe and Cursor..."

# Check if backend is running
if ! curl -s "$API_BASE/healthz" > /dev/null; then
    echo "❌ Backend is not running. Please start the backend server first."
    exit 1
fi

echo "✅ Backend is running"

# Add Stripe
echo "📝 Adding Stripe..."
STRIPE_RESPONSE=$(curl -s -X POST "$API_BASE/vendors/watch" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe",
    "domains": ["https://stripe.com/"],
    "linkedin_url": "https://www.linkedin.com/company/stripe/",
    "github_org": "stripe",
    "include_paths": ["/pricing", "/release-notes", "/changelog", "/security"],
    "tags": ["payments", "fintech"]
  }')

if echo "$STRIPE_RESPONSE" | grep -q '"id"'; then
    STRIPE_ID=$(echo "$STRIPE_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "✅ Added Stripe (ID: $STRIPE_ID)"
else
    echo "❌ Failed to add Stripe: $STRIPE_RESPONSE"
    exit 1
fi

# Add Cursor
echo "📝 Adding Cursor..."
CURSOR_RESPONSE=$(curl -s -X POST "$API_BASE/vendors/watch" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cursor",
    "domains": ["https://cursor.com/"],
    "linkedin_url": "https://www.linkedin.com/company/cursor/",
    "github_org": "getcursor",
    "include_paths": ["/pricing", "/release-notes", "/changelog", "/security"],
    "tags": ["ai", "development", "ide"]
  }')

if echo "$CURSOR_RESPONSE" | grep -q '"id"'; then
    CURSOR_ID=$(echo "$CURSOR_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "✅ Added Cursor (ID: $CURSOR_ID)"
else
    echo "❌ Failed to add Cursor: $CURSOR_RESPONSE"
    exit 1
fi

# List all companies
echo ""
echo "📋 Current companies in database:"
curl -s "$API_BASE/vendors" | grep -o '"name":"[^"]*","id":[0-9]*' | sed 's/"name":"\([^"]*\)","id":\([0-9]*\)/  - \1 (ID: \2)/'

# Test signals detection
echo ""
echo "🔍 Testing signals detection..."

echo "🎯 Testing Stripe signals..."
STRIPE_SIGNALS=$(curl -s -X POST "$API_BASE/signals/detect" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": $STRIPE_ID,
    \"signal_types\": [\"pricing_change\", \"product_update\", \"security_update\"],
    \"include_paths\": [\"/pricing\", \"/release-notes\", \"/changelog\", \"/security\"],
    \"start_date\": \"2025-01-10T00:00:00\",
    \"end_date\": \"2025-01-17T23:59:59\",
    \"use_livecrawl\": false
  }")

SIGNAL_COUNT=$(echo "$STRIPE_SIGNALS" | grep -o '"id":[0-9]*' | wc -l)
echo "    Found $SIGNAL_COUNT signals for Stripe"

echo "🎯 Testing Cursor signals..."
CURSOR_SIGNALS=$(curl -s -X POST "$API_BASE/signals/detect" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": $CURSOR_ID,
    \"signal_types\": [\"pricing_change\", \"product_update\", \"security_update\"],
    \"include_paths\": [\"/pricing\", \"/release-notes\", \"/changelog\", \"/security\"],
    \"start_date\": \"2025-01-10T00:00:00\",
    \"end_date\": \"2025-01-17T23:59:59\",
    \"use_livecrawl\": false
  }")

SIGNAL_COUNT=$(echo "$CURSOR_SIGNALS" | grep -o '"id":[0-9]*' | wc -l)
echo "    Found $SIGNAL_COUNT signals for Cursor"

echo ""
echo "✅ Database populated successfully!"
echo "📊 Added 2 companies (Stripe and Cursor)"
echo ""
echo "💡 You can now test the Signals & Alerts tab in the frontend"
echo "🔗 Frontend should be available at: http://localhost:5173"
