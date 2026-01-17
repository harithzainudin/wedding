import { ref, readonly, computed } from 'vue'
import type {
  ThemeSettings,
  ThemeUpdateRequest,
  ResolvedTheme,
  ThemeId,
  CustomThemeData,
} from '@/types/theme'
import { getThemeCached, updateTheme as updateThemeApi, clearCache } from '@/services/api'
import { CACHE_KEYS } from '@/utils/apiCache'
import { DEFAULT_THEMES, DEFAULT_THEME_ID, isPresetThemeId } from '@/constants/themes'
import { applyTheme, storeThemePreference, getStoredThemePreference } from '@/utils/themeInjector'

// Singleton state
const themeSettings = ref<ThemeSettings>({
  activeThemeId: DEFAULT_THEME_ID,
})
const isLoaded = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const currentWeddingSlug = ref<string | null>(null)

/**
 * Resolves theme settings to a complete theme definition
 * For preset themes, returns the preset definition
 * For custom themes, builds a definition from custom data
 */
function resolveTheme(settings: ThemeSettings): ResolvedTheme {
  if (settings.activeThemeId === 'custom' && settings.customTheme) {
    return {
      id: 'custom',
      name: settings.customTheme.name,
      description: 'Custom theme',
      colors: settings.customTheme.colors,
      fonts: settings.customTheme.fonts,
    }
  }

  // For preset themes, return the preset definition
  const presetId = isPresetThemeId(settings.activeThemeId)
    ? settings.activeThemeId
    : DEFAULT_THEME_ID

  return DEFAULT_THEMES[presetId]
}

export function useTheme() {
  // Computed resolved theme
  const resolvedTheme = computed<ResolvedTheme>(() => resolveTheme(themeSettings.value))

  /**
   * Load theme from API and apply to page
   * @param weddingSlug - The wedding slug to load theme for
   * @param forceRefresh - Force refresh the cache
   */
  const loadTheme = async (weddingSlug: string, forceRefresh = false): Promise<void> => {
    // Reload if wedding changed or not loaded yet
    if (isLoading.value) return
    if (!forceRefresh && isLoaded.value && currentWeddingSlug.value === weddingSlug) return

    isLoading.value = true
    error.value = null
    currentWeddingSlug.value = weddingSlug

    try {
      const data = await getThemeCached(weddingSlug, forceRefresh)
      themeSettings.value = data

      // Apply theme to page
      const theme = resolveTheme(data)
      applyTheme(theme)

      // Store preference for instant apply on next page load
      storeThemePreference(data.activeThemeId)
    } catch (e) {
      console.warn('Failed to load theme from API, using default theme')
      error.value = e instanceof Error ? e.message : 'Failed to load theme'

      // Apply default theme as fallback
      const defaultTheme = DEFAULT_THEMES[DEFAULT_THEME_ID]
      applyTheme(defaultTheme)
    } finally {
      isLoading.value = false
      isLoaded.value = true
    }
  }

  /**
   * Update theme settings and apply to page
   * @param data - Theme update request
   * @param weddingId - Wedding ID for admin operations
   */
  const saveTheme = async (
    data: ThemeUpdateRequest,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    error.value = null

    try {
      const updatedSettings = await updateThemeApi(data, weddingId)
      themeSettings.value = updatedSettings

      // Clear cache to get fresh data next time
      clearCache(CACHE_KEYS.THEME)

      // Apply theme to page
      const theme = resolveTheme(updatedSettings)
      applyTheme(theme)

      // Store preference
      storeThemePreference(updatedSettings.activeThemeId)

      return { success: true }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save theme'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Apply a theme without saving (for preview)
   */
  const previewTheme = (themeId: ThemeId, customTheme?: CustomThemeData): void => {
    const previewSettings: ThemeSettings = {
      activeThemeId: themeId,
      customTheme: themeId === 'custom' ? customTheme : undefined,
    }

    const theme = resolveTheme(previewSettings)
    applyTheme(theme)
  }

  /**
   * Restore the currently saved theme (after preview)
   */
  const restoreTheme = (): void => {
    const theme = resolveTheme(themeSettings.value)
    applyTheme(theme)
  }

  /**
   * Get stored theme preference from localStorage
   * Used for instant theme application on page load
   */
  const getStoredPreference = (): string | null => {
    return getStoredThemePreference()
  }

  /**
   * Apply theme instantly from stored preference (before API loads)
   * This prevents theme flash on page load
   */
  const applyStoredTheme = (): void => {
    const storedId = getStoredThemePreference()
    if (storedId && isPresetThemeId(storedId)) {
      const theme = DEFAULT_THEMES[storedId]
      applyTheme(theme)
    }
    // Note: Custom themes can't be applied from localStorage
    // They'll be applied when API loads
  }

  return {
    themeSettings: readonly(themeSettings),
    resolvedTheme,
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    error: readonly(error),
    loadTheme,
    saveTheme,
    previewTheme,
    restoreTheme,
    getStoredPreference,
    applyStoredTheme,
  }
}
