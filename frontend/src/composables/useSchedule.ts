import { ref } from 'vue'
import type {
  ScheduleData,
  ScheduleItem,
  ScheduleUpdateRequest,
  ScheduleSettings,
} from '@/types/schedule'
import { DEFAULT_SCHEDULE_SETTINGS } from '@/types/schedule'
import {
  getSchedule,
  getScheduleAdmin,
  updateSchedule as apiUpdateSchedule,
  updateScheduleSettings as apiUpdateScheduleSettings,
} from '@/services/api'

// Default schedule data (matches backend defaults)
// Empty array to show empty state - admins should add their own schedule items
const DEFAULT_SCHEDULE: ScheduleData = {
  items: [],
  settings: DEFAULT_SCHEDULE_SETTINGS,
}

// Singleton state
const schedule = ref<ScheduleData>(DEFAULT_SCHEDULE)
const isLoading = ref(false)
const loadError = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

// Multi-tenant tracking
const currentWeddingSlug = ref<string | null>(null)
const currentWeddingId = ref<string | null>(null)

export function useSchedule() {
  // Fetch schedule from API (public endpoint - uses weddingSlug)
  const fetchSchedule = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Track current wedding context
    if (weddingSlug !== undefined) {
      currentWeddingSlug.value = weddingSlug
    }

    try {
      const data = await getSchedule(weddingSlug)
      schedule.value = data
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load schedule'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch schedule from admin API (authenticated - uses weddingId)
  const fetchScheduleAdmin = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Track current wedding context
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const data = await getScheduleAdmin(weddingId)
      schedule.value = data
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load schedule'
    } finally {
      isLoading.value = false
    }
  }

  // Update schedule
  const updateSchedule = async (
    items: ScheduleItem[],
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = false

    // Track current wedding context
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const requestData: ScheduleUpdateRequest = { items }
      const responseData = await apiUpdateSchedule(requestData, weddingId)
      schedule.value = responseData
      saveSuccess.value = true
      // Clear success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule'
      saveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  // Generate unique ID for new items
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  // Update schedule settings (showSchedule toggle)
  const updateScheduleSettings = async (
    settings: Partial<ScheduleSettings>,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    saveError.value = ''

    try {
      const response = await apiUpdateScheduleSettings(settings, weddingId)
      // Update local state with new settings
      schedule.value = {
        ...schedule.value,
        settings: response.settings,
      }
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings'
      saveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  // Reset to defaults (for form reset)
  const resetToDefaults = (): void => {
    schedule.value = {
      ...DEFAULT_SCHEDULE,
      items: [...DEFAULT_SCHEDULE.items],
    }
  }

  return {
    schedule,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    currentWeddingSlug,
    currentWeddingId,
    fetchSchedule,
    fetchScheduleAdmin,
    updateSchedule,
    updateScheduleSettings,
    generateId,
    resetToDefaults,
  }
}
