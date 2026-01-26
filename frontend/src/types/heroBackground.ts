/**
 * Hero Background Types
 *
 * Types for hero section background image/video management
 */

export type HeroMediaType = 'image' | 'video' | 'none'
export type OverlayColor = 'black' | 'white' | 'theme'
export type DeviceType = 'desktop' | 'mobile' | 'universal'
export type UploadMode = 'separate' | 'single'

export interface MediaDimensions {
  width: number
  height: number
  aspectRatio: string // e.g., "16:9", "9:16", "4:3"
  duration?: number // For videos, in seconds
}

export interface HeroMediaItem {
  url: string
  s3Key: string
  mimeType: string
  fileSize: number
  dimensions: MediaDimensions
  uploadedAt: string
}

export interface HeroOverlay {
  enabled: boolean
  color: OverlayColor
  opacity: number // 0-80
}

export interface HeroBackgroundSettings {
  mediaType: HeroMediaType
  uploadMode: UploadMode
  // For 'separate' mode: use desktop + mobile
  // For 'single' mode: use universal only
  desktop?: HeroMediaItem
  mobile?: HeroMediaItem
  universal?: HeroMediaItem
  overlay: HeroOverlay
  posterUrl?: string // For video
  // Limits (configurable by super admin)
  maxImageSize?: number
  maxVideoSize?: number
  updatedAt?: string
  updatedBy?: string
}

// API request/response types
export interface HeroBackgroundUpdateRequest {
  mediaType?: HeroMediaType
  uploadMode?: UploadMode
  overlay?: Partial<HeroOverlay>
}

export interface HeroBackgroundPresignedUrlRequest {
  deviceType: DeviceType
  mimeType: string
  fileSize: number
  filename: string
}

export interface HeroBackgroundPresignedUrlResponse {
  uploadUrl: string
  s3Key: string
  expiresIn: number
}

export interface HeroBackgroundConfirmRequest {
  deviceType: DeviceType
  s3Key: string
  mimeType: string
  fileSize: number
  dimensions: MediaDimensions
}

export interface HeroBackgroundApiResponse {
  heroBackground: HeroBackgroundSettings
}

// Media info recommendation types
export type RecommendationStatus = 'perfect' | 'good' | 'optimize'

export interface MediaRecommendation {
  status: RecommendationStatus
  message: string
}

/**
 * Helper to get the appropriate media for current device
 */
export function getMediaForDevice(
  settings: HeroBackgroundSettings,
  isMobile: boolean
): HeroMediaItem | undefined {
  if (settings.uploadMode === 'single') {
    return settings.universal
  }
  // Separate mode: prefer device-specific, fall back to other
  if (isMobile) {
    return settings.mobile ?? settings.desktop
  }
  return settings.desktop ?? settings.mobile
}

/**
 * Check if media item is a video based on mime type
 */
export function isVideoMedia(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Check if media item is an image based on mime type
 */
export function isImageMedia(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format dimensions as string
 */
export function formatDimensions(dimensions: MediaDimensions): string {
  return `${dimensions.width} x ${dimensions.height}`
}

/**
 * Get mime type display name
 */
export function getMimeTypeDisplay(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
  }
  return mimeMap[mimeType] ?? mimeType.split('/')[1]?.toUpperCase() ?? mimeType
}
