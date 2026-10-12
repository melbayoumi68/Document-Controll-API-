import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  setDark: (dark: boolean) => void
}

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('dc-theme')
  if (saved !== null) {
    const isDark = saved === 'dark'
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return isDark
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) document.documentElement.classList.add('dark')
  return prefersDark
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark
      localStorage.setItem('dc-theme', next ? 'dark' : 'light')
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { isDark: next }
    }),
  setDark: (isDark) => {
    localStorage.setItem('dc-theme', isDark ? 'dark' : 'light')
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ isDark })
  },
}))
