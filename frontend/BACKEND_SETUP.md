# 🔧 Backend API Configuration for GitHub Pages

## Problem

Your frontend is deployed on GitHub Pages, but it's trying to call `/api` which resolves to the GitHub Pages URL (which doesn't have a backend). This causes 405 errors.

## Solution

You need to configure the frontend to point to your Render backend URL.

## Option 1: Update vite.config.js (Quick Fix)

1. **Get your Render backend URL** (e.g., `https://crms-backend.onrender.com`)

2. **Update `frontend/vite.config.js`**:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace with your actual Render backend URL
const BACKEND_URL = 'https://your-backend-url.onrender.com/api'

export default defineConfig({
  plugins: [react()],
  base: '/CRMS-Construction-Resources-Management-System-/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(BACKEND_URL)
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

3. **Rebuild and redeploy**:
```bash
cd frontend
npm run deploy
```

## Option 2: Use Environment Variable (Recommended)

1. **Create `frontend/.env.production`**:
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

2. **Update `vite.config.js`** to use the env variable:
```javascript
export default defineConfig({
  // ... existing config
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api')
  }
})
```

3. **Rebuild and redeploy**

## Option 3: Use GitHub Actions (Best for CI/CD)

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

Then add `VITE_API_URL` as a GitHub Secret:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `VITE_API_URL`
4. Value: `https://your-backend-url.onrender.com/api`

## Current Status

⚠️ **Your backend is not deployed yet!**

You need to:
1. Deploy backend to Render (see `DEPLOYMENT.md`)
2. Get your Render backend URL
3. Configure frontend to use that URL (using one of the options above)
4. Redeploy frontend

## Testing

After configuration, test by:
1. Opening browser console (F12)
2. Checking Network tab for API calls
3. API calls should go to your Render URL, not GitHub Pages URL

