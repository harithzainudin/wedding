import { ref, computed, watch } from "vue";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "wedding-theme";

// Determine if system prefers dark mode
const getSystemPreference = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// Get initial theme from localStorage or default to system
const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

// Apply theme class to document
const applyThemeClass = (isDark: boolean): void => {
  if (typeof document === "undefined") return;

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Global reactive state (singleton pattern like useLanguage)
const currentTheme = ref<ThemeMode>(getInitialTheme());
const systemPrefersDark = ref<boolean>(getSystemPreference());

// Computed: is dark mode actually active? (at module level for watch)
const isDarkComputed = computed<boolean>(() => {
  if (currentTheme.value === "system") {
    return systemPrefersDark.value;
  }
  return currentTheme.value === "dark";
});

// Setup system preference listener and theme watcher (only once)
let initialized = false;
const initialize = (): void => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Listen for system preference changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (e: MediaQueryListEvent) => {
    systemPrefersDark.value = e.matches;
  });

  // Watch for theme changes and apply class (module level, runs once)
  watch(
    isDarkComputed,
    (newIsDark) => {
      applyThemeClass(newIsDark);
    },
    { immediate: true }
  );
};

// Initialize immediately when module loads
initialize();

export function useDarkMode() {
  // Set theme and persist
  const setTheme = (mode: ThemeMode): void => {
    currentTheme.value = mode;
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // Toggle between light/dark (direct toggle, no system option)
  const toggleDarkMode = (): void => {
    setTheme(isDarkComputed.value ? "light" : "dark");
  };

  // Theme label for display
  const themeLabel = computed<string>(() => {
    switch (currentTheme.value) {
      case "system":
        return isDarkComputed.value ? "Auto (Dark)" : "Auto (Light)";
      case "dark":
        return "Dark";
      case "light":
        return "Light";
      default:
        return "Light";
    }
  });

  return {
    currentTheme,
    isDark: isDarkComputed,
    themeLabel,
    setTheme,
    toggleDarkMode,
  };
}
