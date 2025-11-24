# 🚀 Deployment Guide

This guide will help you deploy the CRMS application to GitHub Pages (Frontend) and Render (Backend).

## 📋 Prerequisites

- GitHub account
- Render account (free tier available)
- MySQL database (can use Render's PostgreSQL or external MySQL)

---

## 🔷 Part A: Deploy React Frontend to GitHub Pages

### Step 1: Configuration (Already Done ✅)

The following has been configured:
- ✅ `gh-pages` package installed
- ✅ Homepage URL added to `frontend/package.json`
- ✅ Deploy scripts added
- ✅ Vite base path configured

### Step 2: Deploy to GitHub Pages

```bash
cd frontend
npm run deploy
```

This will:
1. Build your React app (`npm run build`)
2. Deploy to the `gh-pages` branch
3. Make your app live at: **https://cracker38.github.io/CRMS-Construction-Resources-Management-System-**

### Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select branch: **gh-pages**
5. Select folder: **/ (root)**
6. Click **Save**

Your frontend will be live in a few minutes!

---

## 🔷 Part B: Deploy Node.js Backend to Render

### Step 1: Prepare Backend

1. **Update CORS in `backend/server.js`** (Already done ✅)
   - The CORS is configured to allow GitHub Pages origin

2. **Create `backend/.env` file** (for local reference):
   ```env
   PORT=5000
   DB_HOST=your_db_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=crms
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   CORS_ORIGIN=https://cracker38.github.io
   NODE_ENV=production
   ```

### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com)** and sign up/login

2. **Create New Web Service**
   - Click **New** → **Web Service**
   - Connect your GitHub account
   - Select repository: `CRMS-Construction-Resources-Management-System-`

3. **Configure Service**
   - **Name**: `crms-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you prefer)

4. **Add Environment Variables**
   Click **Environment** tab and add:
   ```
   PORT=5000
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=crms
   JWT_SECRET=your_very_long_random_secret_key_here
   JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_here
   CORS_ORIGIN=https://cracker38.github.io
   NODE_ENV=production
   ```

5. **Deploy**
   - Click **Create Web Service**
   - Render will build and deploy your backend
   - Wait for deployment to complete (5-10 minutes)
   - You'll get a URL like: `https://crms-backend.onrender.com`

### Step 3: Database Setup

**Option 1: Use Render PostgreSQL (Free)**
1. Create a new **PostgreSQL** database on Render
2. Get connection string
3. Update your backend code to use PostgreSQL (requires Sequelize changes)

**Option 2: Use External MySQL**
1. Use services like:
   - [PlanetScale](https://planetscale.com) (MySQL, free tier)
   - [Railway](https://railway.app) (MySQL addon)
   - Your own MySQL server
2. Update environment variables with your database credentials

**Option 3: Use Render MySQL (Paid)**
- Render offers MySQL on paid plans

---

## 🔷 Part C: Connect Frontend to Backend

### Step 1: Update Frontend Environment Variable

1. Go to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Add a new secret:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`

### Step 2: Update GitHub Pages Deployment

Since GitHub Pages doesn't support environment variables directly, you have two options:

**Option 1: Hardcode in vite.config.js (Quick but not ideal)**
```javascript
// frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  base: '/CRMS-Construction-Resources-Management-System-/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://your-backend-url.onrender.com/api')
  },
  // ... rest of config
})
```

**Option 2: Use GitHub Actions (Recommended)**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Step 3: Redeploy Frontend

After updating the API URL, redeploy:
```bash
cd frontend
npm run deploy
```

---

## ✅ Verification

1. **Frontend**: Visit https://cracker38.github.io/CRMS-Construction-Resources-Management-System-/
2. **Backend**: Visit https://your-backend-url.onrender.com/api/health
3. **Test Login**: Try logging in from the deployed frontend

---

## 🔧 Troubleshooting

### Frontend Issues

**Problem**: White screen or 404
- **Solution**: Check that `base` path in `vite.config.js` matches your repo name
- **Solution**: Ensure GitHub Pages is enabled and pointing to `gh-pages` branch

**Problem**: API calls failing
- **Solution**: Check CORS settings in backend
- **Solution**: Verify `VITE_API_URL` is set correctly

### Backend Issues

**Problem**: Database connection failed
- **Solution**: Verify database credentials in Render environment variables
- **Solution**: Check database is accessible from Render's IP

**Problem**: CORS errors
- **Solution**: Update `CORS_ORIGIN` in Render environment variables
- **Solution**: Include your GitHub Pages URL in allowed origins

---

## 📝 Notes

- GitHub Pages is **free** but only hosts static sites
- Render free tier has **limitations** (spins down after inactivity)
- For production, consider paid plans for better performance
- Always use environment variables for sensitive data
- Never commit `.env` files to GitHub

---

## 🎉 Success!

Once deployed, your CRMS will be accessible at:
- **Frontend**: https://cracker38.github.io/CRMS-Construction-Resources-Management-System-/
- **Backend**: https://your-backend-url.onrender.com

Happy deploying! 🚀

