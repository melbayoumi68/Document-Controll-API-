import { create } from 'zustand'
import { User, Roles } from '@/types'

interface UserState {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  isSuperAdmin: () => boolean
  isEngineer: () => boolean
  isConsultant: () => boolean
  getRoleBadgeInfo: () => { label: string; color: string; bg: string }
}

const STORAGE_KEY = 'dc-selected-user'

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: getStoredUser(),
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    set({ currentUser: user })
  },
  isSuperAdmin: () => get().currentUser?.role === Roles.SuperAdmin,
  isEngineer: () => get().currentUser?.role === Roles.ToEngineer,
  isConsultant: () => get().currentUser?.role === Roles.Consultant,
  getRoleBadgeInfo: () => {
    const role = get().currentUser?.role
    switch (role) {
      case Roles.SuperAdmin:
        return {
          label: 'Super Admin',
          color: 'text-purple-700 dark:text-purple-300',
          bg: 'bg-purple-100 border-purple-300 dark:bg-purple-950/50 dark:border-purple-800',
        }
      case Roles.ToEngineer:
        return {
          label: 'TO Engineer',
          color: 'text-cyan-700 dark:text-cyan-300',
          bg: 'bg-cyan-100 border-cyan-300 dark:bg-cyan-950/50 dark:border-cyan-800',
        }
      case Roles.Consultant:
        return {
          label: 'Consultant',
          color: 'text-emerald-700 dark:text-emerald-300',
          bg: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800',
        }
      default:
        return {
          label: 'Guest',
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700',
        }
    }
  },
}))
