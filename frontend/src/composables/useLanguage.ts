import { ref, computed } from "vue";
import { translations, languageNames, type Language, type Translations } from "@/i18n/translations";

const STORAGE_KEY = "wedding-language";

// Get initial language from localStorage or default to Malay
const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "ms";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === "ms" || stored === "en" || stored === "zh" || stored === "ta")) {
    return stored;
  }
  return "ms";
};

// Global reactive state
const currentLanguage = ref<Language>(getInitialLanguage());

export function useLanguage() {
  const t = computed<Translations>(() => translations[currentLanguage.value]);

  const setLanguage = (lang: Language): void => {
    currentLanguage.value = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const cycleLanguage = (): void => {
    const languages: Language[] = ["ms", "en", "zh", "ta"];
    const currentIndex = languages.indexOf(currentLanguage.value);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex];
    if (nextLang) {
      setLanguage(nextLang);
    }
  };

  const currentLanguageName = computed(() => languageNames[currentLanguage.value]);

  return {
    currentLanguage,
    currentLanguageName,
    t,
    setLanguage,
    cycleLanguage,
    languages: Object.entries(languageNames) as [Language, string][],
  };
}
