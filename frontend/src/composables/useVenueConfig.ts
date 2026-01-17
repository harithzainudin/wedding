import { ref, readonly } from 'vue'
import { weddingConfig } from '@/config/wedding'
import type { VenueData } from '@/types/venue'
import { getVenue, listParkingImages } from '@/services/api'

// Initialize with static config as fallback
const venueData = ref<VenueData>({
  venueName: weddingConfig.event.venue.name,
  address: weddingConfig.event.venue.address,
  coordinates: weddingConfig.event.venue.coordinates,
  parkingInfo: weddingConfig.event.venue.parkingInfo ?? null,
  googleMapsUrl: weddingConfig.event.venue.googleMapsUrl,
  wazeUrl: weddingConfig.event.venue.wazeUrl,
})

const isLoaded = ref(false)
const isLoading = ref(false)

export function useVenueConfig() {
  const loadVenue = async (): Promise<void> => {
    // Only load once
    if (isLoaded.value || isLoading.value) return

    isLoading.value = true

    try {
      // Fetch venue data and parking images in parallel
      const [venueResponse, parkingImagesResponse] = await Promise.all([
        getVenue(),
        listParkingImages().catch(() => ({ images: [] })),
      ])

      // Merge parking images into venue data
      venueData.value = {
        ...venueResponse,
        parkingImages: parkingImagesResponse.images,
      }
      // If API fails, keep static config as fallback (no error thrown to user)
    } catch {
      console.warn('Failed to load venue from API, using static config')
    } finally {
      isLoading.value = false
      isLoaded.value = true
    }
  }

  return {
    venue: readonly(venueData),
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    loadVenue,
  }
}
