import { ref } from 'vue'
import type { WeddingDetailsData, WeddingDetailsUpdateRequest } from '@/types/weddingDetails'
import {
  DEFAULT_DISPLAY_FORMAT,
  DEFAULT_BISMILLAH_SETTINGS,
  DEFAULT_PARENTS_VISIBILITY,
} from '@/types/weddingDetails'
import { getWeddingDetails, updateWeddingDetails as apiUpdateWeddingDetails } from '@/services/api'

// Multi-tenant state
const currentWeddingSlug = ref<string | undefined>(undefined)
const currentWeddingId = ref<string | undefined>(undefined)

// Default wedding details data (matches backend defaults)
// Uses bracket notation for placeholders to clearly indicate unfilled data
const DEFAULT_WEDDING_DETAILS: WeddingDetailsData = {
  couple: {
    bride: {
      fullName: "[Bride's Full Name]",
      nickname: '[Bride]',
    },
    groom: {
      fullName: "[Groom's Full Name]",
      nickname: '[Groom]',
    },
  },
  parents: {
    bride: {
      father: "[Father's Name]",
      mother: "[Mother's Name]",
    },
    groom: {
      father: "[Father's Name]",
      mother: "[Mother's Name]",
    },
  },
  parentsVisibility: DEFAULT_PARENTS_VISIBILITY,
  eventDate: '2026-12-12T11:00:00+08:00',
  eventEndTime: '2026-12-12T16:00:00+08:00',
  eventDisplayFormat: DEFAULT_DISPLAY_FORMAT,
  bismillahCalligraphy: DEFAULT_BISMILLAH_SETTINGS,
  dressCode: '[Your Dress Code]',
  hashtag: '[#YourHashtag]',
}

// Singleton state
const weddingDetails = ref<WeddingDetailsData>(DEFAULT_WEDDING_DETAILS)
const isLoading = ref(false)
const loadError = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

export function useWeddingDetails() {
  // Set the current wedding slug (for public fetch operations)
  const setWeddingSlug = (slug: string | undefined): void => {
    currentWeddingSlug.value = slug
  }

  // Set the current wedding ID (for admin operations)
  const setWeddingId = (id: string | undefined): void => {
    currentWeddingId.value = id
  }

  // Fetch wedding details from API
  const fetchWeddingDetails = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Use provided slug, or fall back to current slug
    const slug = weddingSlug ?? currentWeddingSlug.value

    try {
      const data = await getWeddingDetails(slug)
      weddingDetails.value = data
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load wedding details'
    } finally {
      isLoading.value = false
    }
  }

  // Update wedding details
  const updateWeddingDetails = async (
    updateData: WeddingDetailsUpdateRequest,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = false

    // Use provided ID, or fall back to current ID
    const id = weddingId ?? currentWeddingId.value

    try {
      const responseData = await apiUpdateWeddingDetails(updateData, id)
      weddingDetails.value = responseData
      saveSuccess.value = true
      // Clear success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update wedding details'
      saveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  // Reset to defaults (for form reset)
  const resetToDefaults = (): void => {
    weddingDetails.value = { ...DEFAULT_WEDDING_DETAILS }
  }

  return {
    weddingDetails,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    currentWeddingSlug,
    currentWeddingId,
    setWeddingSlug,
    setWeddingId,
    fetchWeddingDetails,
    updateWeddingDetails,
    resetToDefaults,
  }
}
