import {
  validateParkingSteps,
  validateParkingVideoUrl,
  type ParkingStep,
} from './parking-validation'

export interface VenueData {
  venueName: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  parkingInfo: string | null
  parkingSteps?: ParkingStep[]
  parkingVideoUrl?: string | null
  // Visibility settings for parking sections (default true)
  showParkingImages?: boolean
  showParkingDirections?: boolean
  showParkingVideo?: boolean
  googleMapsUrl: string
  wazeUrl: string
  updatedAt?: string
  updatedBy?: string
}

export interface VenueUpdateRequest {
  venueName: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  parkingInfo?: string
  parkingSteps?: ParkingStep[]
  parkingVideoUrl?: string | null
  // Visibility settings for parking sections
  showParkingImages?: boolean
  showParkingDirections?: boolean
  showParkingVideo?: boolean
}

export function validateVenueUpdate(
  input: unknown
): { valid: true; data: VenueUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate venueName
  if (typeof body.venueName !== 'string' || !body.venueName.trim()) {
    return { valid: false, error: 'Venue name is required' }
  }
  if (body.venueName.length > 100) {
    return { valid: false, error: 'Venue name must be 100 characters or less' }
  }

  // Validate address
  if (typeof body.address !== 'string' || !body.address.trim()) {
    return { valid: false, error: 'Address is required' }
  }
  if (body.address.length > 500) {
    return { valid: false, error: 'Address must be 500 characters or less' }
  }

  // Validate coordinates
  if (typeof body.coordinates !== 'object' || body.coordinates === null) {
    return { valid: false, error: 'Coordinates are required' }
  }

  const coords = body.coordinates as Record<string, unknown>
  if (typeof coords.lat !== 'number' || coords.lat < -90 || coords.lat > 90) {
    return {
      valid: false,
      error: 'Latitude must be a number between -90 and 90',
    }
  }
  if (typeof coords.lng !== 'number' || coords.lng < -180 || coords.lng > 180) {
    return {
      valid: false,
      error: 'Longitude must be a number between -180 and 180',
    }
  }

  // Validate parkingInfo (optional)
  let parkingInfo: string | undefined
  if (body.parkingInfo !== undefined && body.parkingInfo !== null) {
    if (typeof body.parkingInfo !== 'string') {
      return { valid: false, error: 'Parking info must be a string' }
    }
    if (body.parkingInfo.length > 500) {
      return {
        valid: false,
        error: 'Parking info must be 500 characters or less',
      }
    }
    parkingInfo = body.parkingInfo.trim() || undefined
  }

  // Validate parkingSteps (optional)
  let parkingSteps: ParkingStep[] | undefined
  if (body.parkingSteps !== undefined && body.parkingSteps !== null) {
    const stepsValidation = validateParkingSteps(body.parkingSteps)
    if (!stepsValidation.valid) {
      return { valid: false, error: stepsValidation.error }
    }
    parkingSteps = stepsValidation.data.length > 0 ? stepsValidation.data : undefined
  }

  // Validate parkingVideoUrl (optional)
  let parkingVideoUrl: string | null | undefined
  if (body.parkingVideoUrl !== undefined) {
    const videoValidation = validateParkingVideoUrl(body.parkingVideoUrl)
    if (!videoValidation.valid) {
      return { valid: false, error: videoValidation.error }
    }
    parkingVideoUrl = videoValidation.data
  }

  // Validate visibility settings (optional booleans, default to true)
  const showParkingImages =
    body.showParkingImages !== undefined ? Boolean(body.showParkingImages) : undefined
  const showParkingDirections =
    body.showParkingDirections !== undefined ? Boolean(body.showParkingDirections) : undefined
  const showParkingVideo =
    body.showParkingVideo !== undefined ? Boolean(body.showParkingVideo) : undefined

  return {
    valid: true,
    data: {
      venueName: body.venueName.trim(),
      address: body.address.trim(),
      coordinates: {
        lat: coords.lat,
        lng: coords.lng,
      },
      parkingInfo,
      parkingSteps,
      parkingVideoUrl,
      showParkingImages,
      showParkingDirections,
      showParkingVideo,
    },
  }
}

export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function generateWazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

// Default venue data (fallback when no data exists in DB)
// Uses bracket notation placeholders to clearly indicate data needs to be updated
// Coordinates (0,0) indicate venue location has not been set
export const DEFAULT_VENUE: VenueData = {
  venueName: '[Your Venue Name]',
  address: '[Venue address]',
  coordinates: {
    lat: 0,
    lng: 0,
  },
  parkingInfo: null,
  parkingSteps: [],
  parkingVideoUrl: null,
  showParkingImages: true,
  showParkingDirections: true,
  showParkingVideo: true,
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=0,0',
  wazeUrl: 'https://waze.com/ul?ll=0,0&navigate=yes',
}
