import { apiClient } from '@/api/client'
import { LoginRequest, LoginResponse } from '@/types/auth'
import { storage } from '@/utils/storage'
import { useUserStore } from '@/stores/userStore'
import { AxiosError } from 'axios'

export const authService = {
  /**
   * Authenticate user with username or email and password.
   * On success, saves token and user profile in storage.
   */
  async login(credentials: LoginRequest, remember: boolean = true): Promise<LoginResponse> {
    try {
      // Security: Only send usernameOrEmail and password; no userId
      const payload: LoginRequest = {
        usernameOrEmail: credentials.usernameOrEmail.trim(),
        password: credentials.password,
      }

      const response = await apiClient.post<LoginResponse>('/Auth/login', payload)
      const data = response.data

      // Save token and profile to storage
      storage.setToken(data.accessToken, remember)
      storage.setUser(data, remember)

      // Sync with global user store
      try {
        useUserStore.getState().setCurrentUser({
          userId: data.userId,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role as any,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
      } catch {
        // userStore optional sync
      }

      return data
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string; message?: string }>
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Unable to log in. Please check your credentials or network connection.'

      throw new Error(errorMessage)
    }
  },

  /**
   * Change the password of the currently authenticated user.
   * The backend derives the userId from the JWT — no identity sent from the client.
   */
  async changeMyPassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post('/Auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  },

  /**
   * Log out the current user and purge stored tokens and session data.
   */
  logout(): void {
    storage.clearAuth()
    try {
      useUserStore.getState().setCurrentUser(null)
    } catch {
      // ignore
    }
  },

  /**
   * Get the current JWT access token.
   */
  getToken(): string | null {
    return storage.getToken()
  },

  /**
   * Retrieve the stored user profile of the currently logged-in user.
   */
  getCurrentUser(): LoginResponse | null {
    return storage.getUser()
  },

  /**
   * Determine whether a valid (non-expired) authentication session exists.
   */
  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false
    return !storage.isTokenExpired()
  },
}
