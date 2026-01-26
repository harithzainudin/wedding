/**
 * Hero Background Validation
 *
 * Validation functions for hero background upload and settings operations.
 */

import {
  HERO_IMAGE_DEFAULT_MAX_SIZE,
  HERO_VIDEO_DEFAULT_MAX_SIZE,
  HERO_ALLOWED_IMAGE_TYPES,
  HERO_ALLOWED_VIDEO_TYPES,
  HERO_ALLOWED_MEDIA_TYPES,
  OVERLAY_MIN_OPACITY,
  OVERLAY_MAX_OPACITY,
  VALID_OVERLAY_COLORS,
  VALID_DEVICE_TYPES,
  VALID_UPLOAD_MODES,
  VALID_MEDIA_TYPES,
  type DeviceType,
  type UploadMode,
  type HeroMediaType,
  type OverlayColor,
} from './hero-background-constants'

// ============================================
// VALIDATION RESULT TYPES
// ============================================

interface ValidationSuccess<T> {
  valid: true
  data: T
}

interface ValidationError {
  valid: false
  error: string
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationError

// ============================================
// INPUT TYPES
// ============================================

export interface HeroBackgroundUploadInput {
  deviceType: DeviceType
  mimeType: string
  fileSize: number
  filename: string
}

export interface HeroBackgroundConfirmInput {
  deviceType: DeviceType
  s3Key: string
  mimeType: string
  fileSize: number
  dimensions: {
    width: number
    height: number
    aspectRatio: string
    duration?: number
  }
}

export interface MediaDimensions {
  width: number
  height: number
  aspectRatio: string
  duration?: number
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
  opacity: number
}

export interface HeroBackgroundUpdateInput {
  mediaType?: HeroMediaType
  uploadMode?: UploadMode
  overlay?: Partial<HeroOverlay>
  posterUrl?: string
}

export interface HeroBackgroundLimits {
  maxImageSize: number
  maxVideoSize: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isImageMimeType(mimeType: string): boolean {
  return (HERO_ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)
}

function isVideoMimeType(mimeType: string): boolean {
  return (HERO_ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType)
}

function isValidMimeType(mimeType: string): boolean {
  return (HERO_ALLOWED_MEDIA_TYPES as readonly string[]).includes(mimeType)
}

function isValidDeviceType(deviceType: string): deviceType is DeviceType {
  return (VALID_DEVICE_TYPES as readonly string[]).includes(deviceType)
}

function isValidUploadMode(mode: string): mode is UploadMode {
  return (VALID_UPLOAD_MODES as readonly string[]).includes(mode)
}

function isValidMediaType(type: string): type is HeroMediaType {
  return (VALID_MEDIA_TYPES as readonly string[]).includes(type)
}

function isValidOverlayColor(color: string): color is OverlayColor {
  return (VALID_OVERLAY_COLORS as readonly string[]).includes(color)
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate presigned URL request for hero background upload
 */
export function validateHeroBackgroundUpload(
  input: unknown,
  limits?: HeroBackgroundLimits
): ValidationResult<HeroBackgroundUploadInput> {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate deviceType
  if (typeof body.deviceType !== 'string' || !isValidDeviceType(body.deviceType)) {
    return {
      valid: false,
      error: `Invalid device type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
    }
  }

  // Validate mimeType
  if (typeof body.mimeType !== 'string' || !isValidMimeType(body.mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${HERO_ALLOWED_MEDIA_TYPES.join(', ')}`,
    }
  }

  // Validate fileSize
  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    return { valid: false, error: 'File size must be a positive number' }
  }

  // Check file size limits based on media type
  const maxImageSize = limits?.maxImageSize ?? HERO_IMAGE_DEFAULT_MAX_SIZE
  const maxVideoSize = limits?.maxVideoSize ?? HERO_VIDEO_DEFAULT_MAX_SIZE

  if (isImageMimeType(body.mimeType) && body.fileSize > maxImageSize) {
    const maxMB = Math.round(maxImageSize / (1024 * 1024))
    return { valid: false, error: `Image file size exceeds maximum of ${maxMB}MB` }
  }

  if (isVideoMimeType(body.mimeType) && body.fileSize > maxVideoSize) {
    const maxMB = Math.round(maxVideoSize / (1024 * 1024))
    return { valid: false, error: `Video file size exceeds maximum of ${maxMB}MB` }
  }

  // Validate filename
  if (typeof body.filename !== 'string' || body.filename.trim() === '') {
    return { valid: false, error: 'Filename is required' }
  }

  return {
    valid: true,
    data: {
      deviceType: body.deviceType,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      filename: body.filename.trim(),
    },
  }
}

/**
 * Validate upload confirmation for hero background
 */
export function validateHeroBackgroundConfirm(
  input: unknown
): ValidationResult<HeroBackgroundConfirmInput> {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate deviceType
  if (typeof body.deviceType !== 'string' || !isValidDeviceType(body.deviceType)) {
    return {
      valid: false,
      error: `Invalid device type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
    }
  }

  // Validate s3Key
  if (typeof body.s3Key !== 'string' || body.s3Key.trim() === '') {
    return { valid: false, error: 'S3 key is required' }
  }

  // Validate mimeType
  if (typeof body.mimeType !== 'string' || !isValidMimeType(body.mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${HERO_ALLOWED_MEDIA_TYPES.join(', ')}`,
    }
  }

  // Validate fileSize
  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    return { valid: false, error: 'File size must be a positive number' }
  }

  // Validate dimensions
  if (typeof body.dimensions !== 'object' || body.dimensions === null) {
    return { valid: false, error: 'Dimensions are required' }
  }

  const dims = body.dimensions as Record<string, unknown>

  if (typeof dims.width !== 'number' || dims.width <= 0) {
    return { valid: false, error: 'Width must be a positive number' }
  }

  if (typeof dims.height !== 'number' || dims.height <= 0) {
    return { valid: false, error: 'Height must be a positive number' }
  }

  if (typeof dims.aspectRatio !== 'string' || dims.aspectRatio.trim() === '') {
    return { valid: false, error: 'Aspect ratio is required' }
  }

  // Duration is optional (only for videos)
  const duration = dims.duration !== undefined ? dims.duration : undefined
  if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
    return { valid: false, error: 'Duration must be a non-negative number' }
  }

  return {
    valid: true,
    data: {
      deviceType: body.deviceType,
      s3Key: body.s3Key.trim(),
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      dimensions: {
        width: dims.width,
        height: dims.height,
        aspectRatio: dims.aspectRatio.trim(),
        ...(duration !== undefined && { duration }),
      },
    },
  }
}

/**
 * Validate hero background settings update
 */
export function validateHeroBackgroundUpdate(
  input: unknown
): ValidationResult<HeroBackgroundUpdateInput> {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const data: HeroBackgroundUpdateInput = {}

  // Validate mediaType (optional)
  if (body.mediaType !== undefined) {
    if (typeof body.mediaType !== 'string' || !isValidMediaType(body.mediaType)) {
      return {
        valid: false,
        error: `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(', ')}`,
      }
    }
    data.mediaType = body.mediaType
  }

  // Validate uploadMode (optional)
  if (body.uploadMode !== undefined) {
    if (typeof body.uploadMode !== 'string' || !isValidUploadMode(body.uploadMode)) {
      return {
        valid: false,
        error: `Invalid upload mode. Must be one of: ${VALID_UPLOAD_MODES.join(', ')}`,
      }
    }
    data.uploadMode = body.uploadMode
  }

  // Validate overlay (optional)
  if (body.overlay !== undefined) {
    if (typeof body.overlay !== 'object' || body.overlay === null) {
      return { valid: false, error: 'Overlay must be an object' }
    }

    const overlay = body.overlay as Record<string, unknown>
    data.overlay = {}

    // Validate overlay.enabled
    if (overlay.enabled !== undefined) {
      if (typeof overlay.enabled !== 'boolean') {
        return { valid: false, error: 'Overlay enabled must be a boolean' }
      }
      data.overlay.enabled = overlay.enabled
    }

    // Validate overlay.color
    if (overlay.color !== undefined) {
      if (typeof overlay.color !== 'string' || !isValidOverlayColor(overlay.color)) {
        return {
          valid: false,
          error: `Invalid overlay color. Must be one of: ${VALID_OVERLAY_COLORS.join(', ')}`,
        }
      }
      data.overlay.color = overlay.color
    }

    // Validate overlay.opacity
    if (overlay.opacity !== undefined) {
      if (typeof overlay.opacity !== 'number') {
        return { valid: false, error: 'Overlay opacity must be a number' }
      }
      if (overlay.opacity < OVERLAY_MIN_OPACITY || overlay.opacity > OVERLAY_MAX_OPACITY) {
        return {
          valid: false,
          error: `Overlay opacity must be between ${OVERLAY_MIN_OPACITY} and ${OVERLAY_MAX_OPACITY}`,
        }
      }
      data.overlay.opacity = overlay.opacity
    }
  }

  // Validate posterUrl (optional)
  if (body.posterUrl !== undefined) {
    if (body.posterUrl !== null && typeof body.posterUrl !== 'string') {
      return { valid: false, error: 'Poster URL must be a string or null' }
    }
    if (typeof body.posterUrl === 'string') {
      data.posterUrl = body.posterUrl.trim()
    }
  }

  return { valid: true, data }
}

/**
 * Validate device type for delete operation
 */
export function validateDeviceType(deviceType: string | undefined): ValidationResult<DeviceType> {
  if (!deviceType || !isValidDeviceType(deviceType)) {
    return {
      valid: false,
      error: `Invalid device type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`,
    }
  }
  return { valid: true, data: deviceType }
}
