import { useLanguageStore } from '@/stores/languageStore'
import { translations, type TranslationKey } from './translations'

export function useTranslation() {
  const language = useLanguageStore((s) => s.language)
  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.en[key] ?? key
  }
  return { t, language, isRtl: language === 'ar' }
}
