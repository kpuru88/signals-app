# Render Deployment Guide

## Prerequisites
- GitHub repository: `https://github.com/kpuru88/signals-app`
- Exa API key: `c8b9a631-7ee0-45bf-9a36-e3b6b129ca98`

## Step 1: Deploy Backend

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `kpuru88/signals-app`
4. Configure:
   - **Name**: `signals-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add Environment Variables:
   - `EXA_API_KEY` = `c8b9a631-7ee0-45bf-9a36-e3b6b129ca98`

6. Click "Create Web Service"

## Step 2: Deploy Frontend

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository: `kpuru88/signals-app`
3. Configure:
   - **Name**: `signals-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free

4. Add Environment Variables:
   - `VITE_API_BASE` = `https://signals-backend.onrender.com` (use your actual backend URL)

5. Click "Create Static Site"

## Step 3: Update Backend URL

After frontend deployment:
1. Copy the frontend URL from Render
2. Update the backend CORS settings to allow the frontend domain
3. Update `VITE_API_BASE` in frontend environment variables

## URLs
- **Backend**: `https://signals-backend.onrender.com`
- **Frontend**: `https://signals-frontend.onrender.com`

## Features Deployed
- ✅ Signals detection with Exa API
- ✅ Company watchlist management
- ✅ Tear-sheet generation
- ✅ Settings with API key management
- ✅ Sources configuration
- ✅ Configurable caching

## Notes
- Free tier has cold starts (30s delay on first request)
- Database is in-memory (resets on restart)
- For production, consider upgrading to paid plan for better performance
