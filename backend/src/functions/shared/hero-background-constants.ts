/**
 * Hero Background Constants
 *
 * Default limits and allowed formats for hero background media.
 * Limits can be overridden by super admin per-wedding.
 */

// ============================================
// IMAGE LIMITS
// ============================================

/** Default max image size (5MB) */
export const HERO_IMAGE_DEFAULT_MAX_SIZE = 5 * 1024 * 1024

/** Minimum configurable image size limit (1MB) */
export const HERO_IMAGE_MIN_LIMIT = 1 * 1024 * 1024

/** Maximum configurable image size limit (20MB) */
export const HERO_IMAGE_MAX_LIMIT = 20 * 1024 * 1024

// ============================================
// VIDEO LIMITS
// ============================================

/** Default max video size (30MB) */
export const HERO_VIDEO_DEFAULT_MAX_SIZE = 30 * 1024 * 1024

/** Minimum configurable video size limit (10MB) */
export const HERO_VIDEO_MIN_LIMIT = 10 * 1024 * 1024

/** Maximum configurable video size limit (100MB) */
export const HERO_VIDEO_MAX_LIMIT = 100 * 1024 * 1024

// ============================================
// ALLOWED FORMATS
// ============================================

/** Allowed image MIME types for hero background */
export const HERO_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Allowed video MIME types for hero background */
export const HERO_ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const

/** All allowed media MIME types for hero background */
export const HERO_ALLOWED_MEDIA_TYPES = [
  ...HERO_ALLOWED_IMAGE_TYPES,
  ...HERO_ALLOWED_VIDEO_TYPES,
] as const

/** MIME type to file extension mapping */
export const HERO_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
}

// ============================================
// OVERLAY SETTINGS
// ============================================

/** Minimum overlay opacity (0 = fully transparent) */
export const OVERLAY_MIN_OPACITY = 0

/** Maximum overlay opacity (80 = 80% opaque) */
export const OVERLAY_MAX_OPACITY = 80

/** Default overlay opacity */
export const OVERLAY_DEFAULT_OPACITY = 30

/** Valid overlay color options */
export const VALID_OVERLAY_COLORS = ['black', 'white', 'theme'] as const

// ============================================
// DEVICE TYPES
// ============================================

/** Valid device types for hero background media */
export const VALID_DEVICE_TYPES = ['desktop', 'mobile', 'universal', 'poster'] as const

/** Valid upload modes */
export const VALID_UPLOAD_MODES = ['separate', 'single'] as const

/** Valid media types */
export const VALID_MEDIA_TYPES = ['image', 'video', 'none'] as const

// ============================================
// TYPE EXPORTS
// ============================================

export type HeroImageMimeType = (typeof HERO_ALLOWED_IMAGE_TYPES)[number]
export type HeroVideoMimeType = (typeof HERO_ALLOWED_VIDEO_TYPES)[number]
export type HeroMediaMimeType = (typeof HERO_ALLOWED_MEDIA_TYPES)[number]
export type OverlayColor = (typeof VALID_OVERLAY_COLORS)[number]
export type DeviceType = (typeof VALID_DEVICE_TYPES)[number]
export type UploadMode = (typeof VALID_UPLOAD_MODES)[number]
export type HeroMediaType = (typeof VALID_MEDIA_TYPES)[number]
