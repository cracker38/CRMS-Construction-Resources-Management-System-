import axios from 'axios'

// Use environment variable for production, or relative path for development
// For GitHub Pages deployment, you need to set VITE_API_URL to your Render backend URL
// Example: https://crms-backend.onrender.com/api
let API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Detect if we're on GitHub Pages without a backend URL configured
const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io')
const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

if (isGitHubPages && API_BASE_URL === '/api') {
  console.error('⚠️ CRITICAL: Backend API URL not configured!')
  console.error('The frontend is deployed but cannot connect to the backend.')
  console.error('Please:')
  console.error('1. Deploy your backend to Render (https://render.com)')
  console.error('2. Update frontend/vite.config.js with your Render backend URL')
  console.error('3. Rebuild and redeploy: cd frontend && npm run deploy')
  console.error('')
  console.error('Example backend URL: https://crms-backend.onrender.com/api')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken } = response.data.data

        localStorage.setItem('token', accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api




