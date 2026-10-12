import { create } from 'zustand'

export type Language = 'en' | 'ar'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem('dc-language')
  if (saved === 'ar' || saved === 'en') {
    document.documentElement.lang = saved
    document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
    return saved
  }
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
  return 'en'
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    localStorage.setItem('dc-language', language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    set({ language })
  },
  toggleLanguage: () =>
    set((state) => {
      const next: Language = state.language === 'en' ? 'ar' : 'en'
      localStorage.setItem('dc-language', next)
      document.documentElement.lang = next
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
      return { language: next }
    }),
}))
