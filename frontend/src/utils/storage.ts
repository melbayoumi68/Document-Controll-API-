import { LoginResponse } from '@/types/auth'

const TOKEN_KEY = 'dc_access_token'
const USER_KEY = 'dc_user_data'
const COMPAT_USER_KEY = 'dc-selected-user'

export const storage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
    } catch {
      return null
    }
  },

  setToken(token: string, remember: boolean = true): void {
    try {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token)
        sessionStorage.removeItem(TOKEN_KEY)
      } else {
        sessionStorage.setItem(TOKEN_KEY, token)
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch (e) {
      console.error('Failed to save access token to storage', e)
    }
  },

  removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
    } catch (e) {
      console.error('Failed to remove access token from storage', e)
    }
  },

  getUser(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
      if (!raw) return null
      return JSON.parse(raw) as LoginResponse
    } catch {
      return null
    }
  },

  setUser(user: LoginResponse, remember: boolean = true): void {
    try {
      const json = JSON.stringify(user)
      if (remember) {
        localStorage.setItem(USER_KEY, json)
        sessionStorage.removeItem(USER_KEY)
      } else {
        sessionStorage.setItem(USER_KEY, json)
        localStorage.removeItem(USER_KEY)
      }

      // Keep compatibility with existing useUserStore if needed
      localStorage.setItem(COMPAT_USER_KEY, JSON.stringify({
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      }))
    } catch (e) {
      console.error('Failed to save user data to storage', e)
    }
  },

  removeUser(): void {
    try {
      localStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(USER_KEY)
      localStorage.removeItem(COMPAT_USER_KEY)
    } catch (e) {
      console.error('Failed to remove user data from storage', e)
    }
  },

  clearAuth(): void {
    this.removeToken()
    this.removeUser()
  },

  isTokenExpired(): boolean {
    const user = this.getUser()
    if (!user || !user.expiresAtUtc) return false
    try {
      const expiry = new Date(user.expiresAtUtc).getTime()
      return Date.now() >= expiry
    } catch {
      return false
    }
  }
}
