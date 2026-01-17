export const PARKING_S3_PREFIX = 'parking/'
export const MAX_PARKING_IMAGES = 5
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const PARKING_ICONS = [
  'turn-left',
  'turn-right',
  'straight',
  'landmark',
  'parking',
  'entrance',
] as const

export type ParkingIcon = (typeof PARKING_ICONS)[number]
