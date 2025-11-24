# 🚨 Backend Setup Required

Your frontend is deployed to GitHub Pages, but you're seeing a **405 error** because the backend API is not deployed yet.

## Quick Fix: Deploy Backend to Render

### Step 1: Go to Render.com
1. Visit https://render.com
2. Sign up or log in (free account works)
3. Click **"New +"** → **"Web Service"**

### Step 2: Connect Your Repository
1. Connect your GitHub account
2. Select repository: `CRMS-Construction-Resources-Management-System-`
3. Click **"Connect"**

### Step 3: Configure the Service
- **Name**: `crms-backend` (or any name you prefer)
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or paid if you prefer)

### Step 4: Add Environment Variables
Click **"Environment"** tab and add these variables:

```env
PORT=5000
NODE_ENV=production
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=crms
JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_minimum_32_characters
CORS_ORIGIN=https://cracker38.github.io
```

**Important Notes:**
- Generate strong random strings for JWT secrets (use a password generator)
- For database, you can use:
  - **PlanetScale** (free MySQL): https://planetscale.com
  - **Railway** (free MySQL addon): https://railway.app
  - **Render PostgreSQL** (free tier available)

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Copy your backend URL (e.g., `https://crms-backend.onrender.com`)

---

## Step 6: Update Frontend to Use Backend

### Option A: Quick Fix (Hardcode in vite.config.js)

1. Open `frontend/vite.config.js`
2. Update line 7:

```javascript
// Replace this line:
const BACKEND_URL = process.env.VITE_API_URL || '/api'

// With your Render backend URL:
const BACKEND_URL = 'https://crms-backend.onrender.com/api'
```

3. Rebuild and redeploy:
```bash
cd frontend
npm run deploy
```

### Option B: Use Environment Variable (Better)

1. Create `.env.production` in `frontend/` folder:
```env
VITE_API_URL=https://crms-backend.onrender.com/api
```

2. Update `vite.config.js` to read from env:
```javascript
const BACKEND_URL = process.env.VITE_API_URL || '/api'
```

3. Rebuild and redeploy:
```bash
cd frontend
npm run deploy
```

---

## Step 7: Verify

1. Visit your frontend: https://cracker38.github.io/CRMS-Construction-Resources-Management-System-/
2. Try to register or login
3. Check browser console - should see API calls going to your Render backend
4. The yellow warning banner should disappear once backend is connected

---

## Database Setup

If you need to set up the database:

### Using PlanetScale (Free MySQL)
1. Go to https://planetscale.com
2. Create a database
3. Get connection string
4. Update environment variables in Render

### Using Render PostgreSQL
1. In Render dashboard, create a new **PostgreSQL** database
2. Copy connection details
3. Update your backend code if needed (Sequelize works with PostgreSQL too)

---

## Troubleshooting

**405 Error**: Backend not deployed or URL not configured correctly
**CORS Error**: Make sure `CORS_ORIGIN` in Render includes your GitHub Pages URL
**Database Error**: Check database credentials in Render environment variables

---

## Need Help?

Check the main `DEPLOYMENT.md` file for more detailed instructions.

