import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { storage } from '@/utils/storage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Attach JWT Bearer token to all requests if present
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for consistent error extraction and notification
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status
    const isLoginEndpoint = error.config?.url?.includes('/Auth/login')

    if (status === 401 && !isLoginEndpoint) {
      // Session expired or invalid token: force logout and redirect to login
      storage.clearAuth()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        toast.error('Session expired. Please sign in again.')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    const errorMsg =
      status === 403
        ? 'Access Denied: You do not have permission to perform this action.'
        : error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred'

    // Don't show global toast for 404 or when on the login endpoint (since login form shows inline errors)
    if (status !== 404 && !isLoginEndpoint) {
      toast.error(errorMsg)
    }

    return Promise.reject(error)
  }
)
