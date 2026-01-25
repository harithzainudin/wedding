import { ALLOWED_MIME_TYPES, type AllowedMimeType } from './image-constants'

export interface ImageUploadRequest {
  filename: string
  mimeType: string
  fileSize: number
}

export interface ImageSettings {
  maxFileSize: number
  maxImages: number
  allowedFormats: string[]
}

export interface ConfirmUploadRequest {
  imageId: string
  s3Key: string
  filename: string
  mimeType: string
}

export function validateImageUpload(
  input: unknown,
  settings: ImageSettings
): { valid: true; data: ImageUploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

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

  if (body.fileSize > settings.maxFileSize) {
    const maxMB = Math.round(settings.maxFileSize / (1024 * 1024))
    return { valid: false, error: `File size exceeds maximum of ${maxMB}MB` }
  }

  return {
    valid: true,
    data: {
      filename: body.filename.trim(),
      mimeType: body.mimeType,
      fileSize: body.fileSize,
    },
  }
}

export function validateConfirmUpload(
  input: unknown
): { valid: true; data: ConfirmUploadRequest } | { valid: false; error: string } {
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

  return {
    valid: true,
    data: {
      imageId: body.imageId.trim(),
      s3Key: body.s3Key.trim(),
      filename: body.filename.trim(),
      mimeType: body.mimeType.trim(),
    },
  }
}

export function validateReorderRequest(
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

export function validateSettingsUpdate(input: unknown):
  | {
      valid: true
      data: { maxFileSize?: number; maxImages?: number }
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const result: {
    maxFileSize?: number
    maxImages?: number
  } = {}

  // Validate maxFileSize (1MB to 50MB)
  if (body.maxFileSize !== undefined) {
    if (
      typeof body.maxFileSize !== 'number' ||
      body.maxFileSize < 1024 * 1024 ||
      body.maxFileSize > 50 * 1024 * 1024
    ) {
      return {
        valid: false,
        error: 'maxFileSize must be between 1MB and 50MB',
      }
    }
    result.maxFileSize = body.maxFileSize
  }

  // Validate maxImages (1 to 200)
  if (body.maxImages !== undefined) {
    if (typeof body.maxImages !== 'number' || body.maxImages < 1 || body.maxImages > 200) {
      return { valid: false, error: 'maxImages must be between 1 and 200' }
    }
    result.maxImages = body.maxImages
  }

  if (result.maxFileSize === undefined && result.maxImages === undefined) {
    return { valid: false, error: 'At least one setting must be provided' }
  }

  return { valid: true, data: result }
}
