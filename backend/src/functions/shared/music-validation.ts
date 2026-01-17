import {
  ALLOWED_AUDIO_MIME_TYPES,
  type AllowedAudioMimeType,
  type PlayMode,
} from './music-constants'

export interface MusicUploadRequest {
  filename: string
  mimeType: string
  fileSize: number
  title: string
  artist?: string
  duration?: number
}

export interface MusicSettings {
  maxFileSize: number
  maxTracks: number
  allowedFormats: string[]
}

export interface ConfirmMusicUploadRequest {
  trackId: string
  s3Key: string
  filename: string
  mimeType: string
  title: string
  artist?: string
  duration: number
}

export interface MusicSettingsUpdate {
  enabled?: boolean
  autoplay?: boolean
  volume?: number
  mode?: PlayMode
  shuffle?: boolean
  loop?: boolean
  selectedTrackId?: string | null
}

export function validateMusicUpload(
  input: unknown,
  settings: MusicSettings
): { valid: true; data: MusicUploadRequest } | { valid: false; error: string } {
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

  if (!ALLOWED_AUDIO_MIME_TYPES.includes(body.mimeType as AllowedAudioMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_AUDIO_MIME_TYPES.join(', ')}`,
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

  // Validate title
  if (typeof body.title !== 'string' || !body.title.trim()) {
    return { valid: false, error: 'Title is required' }
  }

  // Validate optional artist
  if (body.artist !== undefined && typeof body.artist !== 'string') {
    return { valid: false, error: 'Artist must be a string' }
  }

  // Validate optional duration
  if (body.duration !== undefined && (typeof body.duration !== 'number' || body.duration <= 0)) {
    return { valid: false, error: 'Duration must be a positive number' }
  }

  return {
    valid: true,
    data: {
      filename: body.filename.trim(),
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      title: body.title.trim(),
      artist: typeof body.artist === 'string' ? body.artist.trim() : undefined,
      duration: typeof body.duration === 'number' ? body.duration : undefined,
    },
  }
}

export function validateConfirmMusicUpload(
  input: unknown
): { valid: true; data: ConfirmMusicUploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (typeof body.trackId !== 'string' || !body.trackId.trim()) {
    return { valid: false, error: 'Track ID is required' }
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

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return { valid: false, error: 'Title is required' }
  }

  if (typeof body.duration !== 'number' || body.duration <= 0) {
    return { valid: false, error: 'Duration is required and must be positive' }
  }

  return {
    valid: true,
    data: {
      trackId: body.trackId.trim(),
      s3Key: body.s3Key.trim(),
      filename: body.filename.trim(),
      mimeType: body.mimeType.trim(),
      title: body.title.trim(),
      artist: typeof body.artist === 'string' ? body.artist.trim() : undefined,
      duration: body.duration,
    },
  }
}

export function validateReorderRequest(
  input: unknown
): { valid: true; data: { trackIds: string[] } } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (!Array.isArray(body.trackIds)) {
    return { valid: false, error: 'trackIds must be an array' }
  }

  if (body.trackIds.length === 0) {
    return { valid: false, error: 'trackIds cannot be empty' }
  }

  if (!body.trackIds.every((id) => typeof id === 'string' && id.trim())) {
    return { valid: false, error: 'All trackIds must be non-empty strings' }
  }

  return {
    valid: true,
    data: { trackIds: body.trackIds as string[] },
  }
}

export function validateSettingsUpdate(
  input: unknown
): { valid: true; data: MusicSettingsUpdate } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const result: MusicSettingsUpdate = {}

  // Validate enabled
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return { valid: false, error: 'enabled must be a boolean' }
    }
    result.enabled = body.enabled
  }

  // Validate autoplay
  if (body.autoplay !== undefined) {
    if (typeof body.autoplay !== 'boolean') {
      return { valid: false, error: 'autoplay must be a boolean' }
    }
    result.autoplay = body.autoplay
  }

  // Validate volume (0.0 to 1.0)
  if (body.volume !== undefined) {
    if (typeof body.volume !== 'number' || body.volume < 0 || body.volume > 1) {
      return { valid: false, error: 'volume must be a number between 0 and 1' }
    }
    result.volume = body.volume
  }

  // Validate mode
  if (body.mode !== undefined) {
    if (body.mode !== 'single' && body.mode !== 'playlist') {
      return { valid: false, error: "mode must be 'single' or 'playlist'" }
    }
    result.mode = body.mode
  }

  // Validate shuffle
  if (body.shuffle !== undefined) {
    if (typeof body.shuffle !== 'boolean') {
      return { valid: false, error: 'shuffle must be a boolean' }
    }
    result.shuffle = body.shuffle
  }

  // Validate loop
  if (body.loop !== undefined) {
    if (typeof body.loop !== 'boolean') {
      return { valid: false, error: 'loop must be a boolean' }
    }
    result.loop = body.loop
  }

  // Validate selectedTrackId (can be string or null)
  if (body.selectedTrackId !== undefined) {
    if (body.selectedTrackId !== null && typeof body.selectedTrackId !== 'string') {
      return {
        valid: false,
        error: 'selectedTrackId must be a string or null',
      }
    }
    result.selectedTrackId = body.selectedTrackId
  }

  if (Object.keys(result).length === 0) {
    return { valid: false, error: 'At least one setting must be provided' }
  }

  return { valid: true, data: result }
}
