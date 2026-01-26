// Image limits
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for images
export const DEFAULT_MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB for videos
export const DEFAULT_MAX_IMAGES = 50 // Combined count for images + videos
export const DEFAULT_SHOW_GALLERY = true

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV files from iPhone
] as const

// Combined media types (for backward compatibility, keep ALLOWED_MIME_TYPES as alias)
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] as const
export const ALLOWED_MIME_TYPES = ALLOWED_MEDIA_TYPES

export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

// Type exports
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_TYPES)[number]
export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_TYPES)[number]
export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_TYPES)[number]
export type AllowedMimeType = AllowedMediaMimeType // Backward compatibility

// Helper functions
export function isVideoMimeType(mimeType: string): boolean {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType)
}

export function isImageMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)
}
