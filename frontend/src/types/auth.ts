import { RoleType } from './constants'

export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiresAtUtc: string
  userId: number
  username: string
  email: string
  fullName: string
  role: RoleType | 'SUPER_ADMIN' | 'Technical ENGINEER' | 'CONSULTANT' | string
  mustSetPassword: boolean
}

export interface AuthState {
  user: LoginResponse | null
  token: string | null
  isAuthenticated: boolean
}
