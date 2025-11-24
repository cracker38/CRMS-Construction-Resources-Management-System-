import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ IMPORTANT: Replace this with your Render backend URL after deployment
// Example: 'https://crms-backend.onrender.com/api'
// Leave as '/api' for local development
const BACKEND_URL = process.env.VITE_API_URL || '/api'

export default defineConfig({
  plugins: [react()],
  base: '/CRMS-Construction-Resources-Management-System-/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    // Inject backend URL at build time
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




