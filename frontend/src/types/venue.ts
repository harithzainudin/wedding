export type ParkingIcon =
  | 'turn-left'
  | 'turn-right'
  | 'straight'
  | 'landmark'
  | 'parking'
  | 'entrance'

export interface ParkingStep {
  id: string
  text: string
  icon?: ParkingIcon
}

export interface ParkingImage {
  id: string
  url: string
  s3Key: string
  filename: string
  mimeType: string
  fileSize: number
  caption?: string
  order: number
  uploadedAt: string
  uploadedBy: string
}

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
  // Visibility settings for parking sections
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

export interface VenueResponse {
  success: boolean
  data?: VenueData
  error?: string
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
}

export interface ParkingImageUploadRequest {
  filename: string
  mimeType: string
  fileSize: number
  caption?: string
}

export interface ParkingPresignedUrlResponse {
  uploadUrl: string
  imageId: string
  s3Key: string
  expiresIn: number
  caption?: string
}

export interface ParkingConfirmUploadRequest {
  imageId: string
  s3Key: string
  filename: string
  mimeType: string
  caption?: string
}

export interface ParkingImagesResponse {
  images: ParkingImage[]
  total: number
  maxImages: number
  remainingSlots: number
}
