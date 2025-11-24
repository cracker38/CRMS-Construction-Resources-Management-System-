import axios from 'axios'

// Use environment variable for production, or relative path for development
// For GitHub Pages deployment, you need to set VITE_API_URL to your Render backend URL
// Example: https://crms-backend.onrender.com/api
let API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// If we're on GitHub Pages and no API URL is set, show helpful error
if (typeof window !== 'undefined' && window.location.hostname.includes('github.io') && API_BASE_URL === '/api') {
  console.error('⚠️ Backend API URL not configured!')
  console.error('Please set VITE_API_URL environment variable to your Render backend URL')
  console.error('Example: VITE_API_URL=https://crms-backend.onrender.com/api')
  // Don't throw error, but log it - the user will see API errors
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




