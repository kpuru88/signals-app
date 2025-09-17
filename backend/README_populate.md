# Database Population Script

## Overview
This script populates the database with Stripe and Cursor companies for testing the Signals & Alerts functionality.

## Usage

### Prerequisites
1. Make sure the backend server is running:
   ```bash
   cd /Users/karthikapurushothaman/projects/signals-app/backend
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Run the Script
```bash
cd /Users/karthikapurushothaman/projects/signals-app/backend
./populate_database.sh
```

## What the Script Does

1. **Checks Backend Health**: Verifies the backend server is running
2. **Adds Stripe**: Creates Stripe company entry with:
   - Domain: https://stripe.com/
   - LinkedIn: https://www.linkedin.com/company/stripe/
   - GitHub: stripe
   - Tags: payments, fintech
3. **Adds Cursor**: Creates Cursor company entry with:
   - Domain: https://cursor.com/
   - LinkedIn: https://www.linkedin.com/company/cursor/
   - GitHub: getcursor
   - Tags: ai, development, ide
4. **Tests Signals Detection**: Verifies that signals can be detected for both companies
5. **Reports Results**: Shows the number of signals found for each company

## Expected Output
```
🚀 Populating database with Stripe and Cursor...
✅ Backend is running
📝 Adding Stripe...
✅ Added Stripe (ID: 1)
📝 Adding Cursor...
✅ Added Cursor (ID: 2)
🎯 Testing Stripe signals...
    Found 3 signals for Stripe
🎯 Testing Cursor signals...
    Found 3 signals for Cursor
✅ Database populated successfully!
```

## After Running the Script

1. **Frontend Testing**: You can now test the Signals & Alerts tab at http://localhost:5173
2. **API Testing**: Both companies will be available for signals detection via the `/signals/detect` endpoint
3. **Persistent Data**: The companies will remain in the database until the backend server restarts

## Troubleshooting

- **"Backend is not running"**: Start the backend server first
- **"Failed to add company"**: Check if the company already exists or if there's a network issue
- **"No signals found"**: This is normal if Exa API key is not configured or if there are no recent updates

## Files Created
- `populate_database.sh` - Main script
- `populate_database.py` - Python version (requires requests module)
