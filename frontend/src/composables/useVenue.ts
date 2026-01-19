import { ref } from 'vue'
import type { VenueData, VenueUpdateRequest } from '@/types/venue'
import { getVenue, updateVenue as apiUpdateVenue } from '@/services/api'
import { clearCache, CACHE_KEYS } from '@/utils/apiCache'

// Default venue data (matches backend defaults)
// Uses bracket notation for placeholders to clearly indicate unfilled data
const DEFAULT_VENUE: VenueData = {
  venueName: '[Your Venue Name]',
  address: '[Venue address]',
  coordinates: {
    lat: 0,
    lng: 0,
  },
  parkingInfo: '',
  parkingSteps: [],
  parkingVideoUrl: null,
  showParkingImages: true,
  showParkingDirections: true,
  showParkingVideo: true,
  googleMapsUrl: '',
  wazeUrl: '',
}

// Singleton state
const venue = ref<VenueData>(DEFAULT_VENUE)
const isLoading = ref(false)
const loadError = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

// Multi-tenant tracking
const currentWeddingSlug = ref<string | null>(null)
const currentWeddingId = ref<string | null>(null)

export function useVenue() {
  // Fetch venue data from API
  const fetchVenue = async (weddingSlug: string): Promise<void> => {
    if (isLoading.value) return
    if (venue.value && currentWeddingSlug.value === weddingSlug) return

    currentWeddingSlug.value = weddingSlug
    isLoading.value = true
    loadError.value = ''

    try {
      const data = await getVenue(weddingSlug)
      venue.value = data
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load venue data'
    } finally {
      isLoading.value = false
    }
  }

  // Update venue data
  const updateVenue = async (
    updateData: VenueUpdateRequest,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = false

    try {
      const responseData = await apiUpdateVenue(updateData, weddingId)
      venue.value = responseData
      saveSuccess.value = true
      // Clear cache to ensure fresh data on next fetch
      clearCache(CACHE_KEYS.VENUE)
      // Clear success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update venue'
      saveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  // Generate Google Maps URL from coordinates
  const generateGoogleMapsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }

  // Generate Waze URL from coordinates
  const generateWazeUrl = (lat: number, lng: number): string => {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }

  // Reset to defaults (for form reset)
  const resetToDefaults = (): void => {
    venue.value = { ...DEFAULT_VENUE }
  }

  return {
    venue,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    currentWeddingSlug,
    currentWeddingId,
    fetchVenue,
    updateVenue,
    generateGoogleMapsUrl,
    generateWazeUrl,
    resetToDefaults,
  }
}
