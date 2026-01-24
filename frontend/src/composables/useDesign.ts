import { ref, readonly, computed } from 'vue'
import type { DesignSettings, DesignUpdateRequest, SectionConfig } from '@/types/design'
import { DEFAULT_DESIGN_SETTINGS, DEFAULT_SECTION_ORDER } from '@/types/design'
import { getDesignCached, updateDesign as updateDesignApi, clearCache } from '@/services/api'
import { CACHE_KEYS } from '@/utils/apiCache'

// Singleton state
const designSettings = ref<DesignSettings>({ ...DEFAULT_DESIGN_SETTINGS })
const isLoaded = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const currentWeddingSlug = ref<string | null>(null)

/**
 * Get visible sections sorted by order
 */
function getVisibleSections(sections: SectionConfig[]): SectionConfig[] {
  return sections.filter((s) => s.visible).sort((a, b) => a.order - b.order)
}

export function useDesign() {
  // Computed visible sections sorted by order
  const visibleSections = computed(() => getVisibleSections(designSettings.value.sections))

  /**
   * Load design settings from API
   * @param weddingSlug - The wedding slug to load design for
   * @param forceRefresh - Force refresh the cache
   */
  const loadDesign = async (weddingSlug: string, forceRefresh = false): Promise<void> => {
    // Reload if wedding changed or not loaded yet
    if (isLoading.value) return
    if (!forceRefresh && isLoaded.value && currentWeddingSlug.value === weddingSlug) return

    isLoading.value = true
    error.value = null
    currentWeddingSlug.value = weddingSlug

    try {
      const data = await getDesignCached(weddingSlug, forceRefresh)
      designSettings.value = data
    } catch (e) {
      console.warn('Failed to load design from API, using default settings')
      error.value = e instanceof Error ? e.message : 'Failed to load design'

      // Use default settings as fallback
      designSettings.value = { ...DEFAULT_DESIGN_SETTINGS }
    } finally {
      isLoading.value = false
      isLoaded.value = true
    }
  }

  /**
   * Update design settings
   * @param data - Design update request
   * @param weddingId - Wedding ID for admin operations
   */
  const saveDesign = async (
    data: DesignUpdateRequest,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    error.value = null

    try {
      const updatedSettings = await updateDesignApi(data, weddingId)
      designSettings.value = updatedSettings

      // Clear cache to get fresh data next time
      clearCache(CACHE_KEYS.DESIGN)

      return { success: true }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save design'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Reset to default section order
   */
  const resetSectionOrder = (): SectionConfig[] => {
    return [...DEFAULT_SECTION_ORDER]
  }

  /**
   * Get default design settings
   */
  const getDefaultSettings = (): DesignSettings => {
    return { ...DEFAULT_DESIGN_SETTINGS }
  }

  return {
    designSettings: readonly(designSettings),
    visibleSections,
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    error: readonly(error),
    loadDesign,
    saveDesign,
    resetSectionOrder,
    getDefaultSettings,
  }
}
