import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  PARKING_ICONS,
  type AllowedMimeType,
  type ParkingIcon,
} from './parking-constants'

export interface ParkingImageUploadRequest {
  filename: string
  mimeType: string
  fileSize: number
  caption?: string
}

export interface ParkingConfirmUploadRequest {
  imageId: string
  s3Key: string
  filename: string
  mimeType: string
  caption?: string
}

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

export function validateParkingImageUpload(
  input: unknown,
  currentImageCount: number,
  maxImages: number
): { valid: true; data: ParkingImageUploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Check max images limit
  if (currentImageCount >= maxImages) {
    return {
      valid: false,
      error: `Maximum of ${maxImages} parking images allowed`,
    }
  }

  // Validate filename
  if (typeof body.filename !== 'string' || !body.filename.trim()) {
    return { valid: false, error: 'Filename is required' }
  }

  // Validate mimeType
  if (typeof body.mimeType !== 'string') {
    return { valid: false, error: 'MIME type is required' }
  }

  if (!ALLOWED_MIME_TYPES.includes(body.mimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  // Validate fileSize
  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    return { valid: false, error: 'File size must be a positive number' }
  }

  if (body.fileSize > MAX_FILE_SIZE) {
    const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
    return { valid: false, error: `File size exceeds maximum of ${maxMB}MB` }
  }

  // Validate caption (optional)
  let caption: string | undefined
  if (body.caption !== undefined && body.caption !== null) {
    if (typeof body.caption !== 'string') {
      return { valid: false, error: 'Caption must be a string' }
    }
    if (body.caption.length > 200) {
      return { valid: false, error: 'Caption must be 200 characters or less' }
    }
    caption = body.caption.trim() || undefined
  }

  return {
    valid: true,
    data: {
      filename: body.filename.trim(),
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      caption,
    },
  }
}

export function validateParkingConfirmUpload(
  input: unknown
): { valid: true; data: ParkingConfirmUploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (typeof body.imageId !== 'string' || !body.imageId.trim()) {
    return { valid: false, error: 'Image ID is required' }
  }

  if (typeof body.s3Key !== 'string' || !body.s3Key.trim()) {
    return { valid: false, error: 'S3 key is required' }
  }

  if (typeof body.filename !== 'string' || !body.filename.trim()) {
    return { valid: false, error: 'Filename is required' }
  }

  if (typeof body.mimeType !== 'string' || !body.mimeType.trim()) {
    return { valid: false, error: 'MIME type is required' }
  }

  // Validate caption (optional)
  let caption: string | undefined
  if (body.caption !== undefined && body.caption !== null) {
    if (typeof body.caption !== 'string') {
      return { valid: false, error: 'Caption must be a string' }
    }
    caption = body.caption.trim() || undefined
  }

  return {
    valid: true,
    data: {
      imageId: body.imageId.trim(),
      s3Key: body.s3Key.trim(),
      filename: body.filename.trim(),
      mimeType: body.mimeType.trim(),
      caption,
    },
  }
}

export function validateParkingReorderRequest(
  input: unknown
): { valid: true; data: { imageIds: string[] } } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (!Array.isArray(body.imageIds)) {
    return { valid: false, error: 'imageIds must be an array' }
  }

  if (body.imageIds.length === 0) {
    return { valid: false, error: 'imageIds cannot be empty' }
  }

  if (!body.imageIds.every((id) => typeof id === 'string' && id.trim())) {
    return { valid: false, error: 'All imageIds must be non-empty strings' }
  }

  return {
    valid: true,
    data: { imageIds: body.imageIds as string[] },
  }
}

export function validateParkingSteps(
  input: unknown
): { valid: true; data: ParkingStep[] } | { valid: false; error: string } {
  if (!Array.isArray(input)) {
    return { valid: false, error: 'Parking steps must be an array' }
  }

  if (input.length > 10) {
    return { valid: false, error: 'Maximum of 10 parking steps allowed' }
  }

  const steps: ParkingStep[] = []

  for (let i = 0; i < input.length; i++) {
    const step = input[i]
    if (typeof step !== 'object' || step === null) {
      return { valid: false, error: `Step ${i + 1} must be an object` }
    }

    const s = step as Record<string, unknown>

    if (typeof s.id !== 'string' || !s.id.trim()) {
      return { valid: false, error: `Step ${i + 1} must have an id` }
    }

    if (typeof s.text !== 'string' || !s.text.trim()) {
      return { valid: false, error: `Step ${i + 1} must have text` }
    }

    if (s.text.length > 200) {
      return {
        valid: false,
        error: `Step ${i + 1} text must be 200 characters or less`,
      }
    }

    // Validate icon (optional)
    let icon: ParkingIcon | undefined
    if (s.icon !== undefined && s.icon !== null) {
      if (typeof s.icon !== 'string' || !PARKING_ICONS.includes(s.icon as ParkingIcon)) {
        return {
          valid: false,
          error: `Step ${i + 1} has invalid icon. Allowed: ${PARKING_ICONS.join(', ')}`,
        }
      }
      icon = s.icon as ParkingIcon
    }

    steps.push({
      id: s.id.trim(),
      text: s.text.trim(),
      icon,
    })
  }

  return { valid: true, data: steps }
}

const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]+/

export function validateParkingVideoUrl(
  input: unknown
): { valid: true; data: string | null } | { valid: false; error: string } {
  if (input === undefined || input === null || input === '') {
    return { valid: true, data: null }
  }

  if (typeof input !== 'string') {
    return { valid: false, error: 'Video URL must be a string' }
  }

  const url = input.trim()
  if (!url) {
    return { valid: true, data: null }
  }

  if (!YOUTUBE_URL_REGEX.test(url)) {
    return {
      valid: false,
      error: 'Invalid YouTube URL format',
    }
  }

  if (url.length > 500) {
    return { valid: false, error: 'Video URL must be 500 characters or less' }
  }

  return { valid: true, data: url }
}
