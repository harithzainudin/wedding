import { ref, computed } from 'vue'
import {
  adminTranslations,
  adminLanguageNames,
  type AdminLanguage,
  type AdminTranslations,
} from '@/i18n/translations'

const ADMIN_STORAGE_KEY = 'wedding-admin-language'

// Get initial language from localStorage or default to English
const getInitialAdminLanguage = (): AdminLanguage => {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY)
  if (stored && (stored === 'en' || stored === 'ms')) {
    return stored
  }
  return 'en'
}

// Global reactive state
const currentAdminLanguage = ref<AdminLanguage>(getInitialAdminLanguage())

export function useAdminLanguage() {
  const adminT = computed<AdminTranslations>(() => adminTranslations[currentAdminLanguage.value])

  const setAdminLanguage = (lang: AdminLanguage): void => {
    currentAdminLanguage.value = lang
    localStorage.setItem(ADMIN_STORAGE_KEY, lang)
  }

  const toggleAdminLanguage = (): void => {
    const newLang: AdminLanguage = currentAdminLanguage.value === 'en' ? 'ms' : 'en'
    setAdminLanguage(newLang)
  }

  const currentAdminLanguageName = computed(() => adminLanguageNames[currentAdminLanguage.value])

  return {
    currentAdminLanguage,
    currentAdminLanguageName,
    adminT,
    setAdminLanguage,
    toggleAdminLanguage,
    adminLanguages: Object.entries(adminLanguageNames) as [AdminLanguage, string][],
  }
}
