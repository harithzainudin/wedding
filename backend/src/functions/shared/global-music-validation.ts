/**
 * Global Music Library Validation and Constants
 *
 * Shared constants and validation functions for the super admin
 * managed global music library.
 */

// ============================================
// MUSIC CATEGORIES
// ============================================

export const MUSIC_CATEGORIES = [
  'romantic',
  'celebration',
  'classical',
  'traditional',
  'modern',
  'instrumental',
  'other',
] as const

export type MusicCategory = (typeof MUSIC_CATEGORIES)[number]

export function isValidMusicCategory(category: string): category is MusicCategory {
  return MUSIC_CATEGORIES.includes(category as MusicCategory)
}

// ============================================
// LICENSE TYPES
// ============================================

export const LICENSE_TYPES = [
  'free', // Free to use, no restrictions
  'cc0', // Creative Commons Zero (public domain)
  'cc-by', // Creative Commons Attribution
  'cc-by-sa', // Creative Commons Attribution-ShareAlike
  'cc-by-nc', // Creative Commons Attribution-NonCommercial
  'royalty-free', // Royalty-free (purchased license)
  'purchased', // Purchased from a music service
  'custom', // Custom license
] as const

export type LicenseType = (typeof LICENSE_TYPES)[number]

export function isValidLicenseType(type: string): type is LicenseType {
  return LICENSE_TYPES.includes(type as LicenseType)
}

/**
 * License types that require attribution to be displayed publicly
 */
export const ATTRIBUTION_REQUIRED_LICENSES: LicenseType[] = ['cc-by', 'cc-by-sa', 'cc-by-nc']

export function requiresAttribution(licenseType: LicenseType): boolean {
  return ATTRIBUTION_REQUIRED_LICENSES.includes(licenseType)
}

// ============================================
// LICENSE INFO INTERFACE
// ============================================

export interface LicenseInfo {
  type: LicenseType
  sourceUrl?: string // Where the track was obtained (e.g., Pixabay URL)
  attribution?: string // Custom attribution text (for custom license or override)
}

// ============================================
// GLOBAL MUSIC TRACK INTERFACE
// ============================================

export interface GlobalMusicTrack {
  id: string
  title: string
  artist?: string
  duration: number
  filename: string
  s3Key: string
  mimeType: string
  fileSize: number
  category: MusicCategory
  order: number
  license?: LicenseInfo
  uploadedAt: string
  uploadedBy: string
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export interface GlobalMusicUploadRequest {
  filename: string
  mimeType: string
  fileSize: number
  title: string
  artist?: string
  duration?: number
  category: string
  licenseType?: string
  sourceUrl?: string
}

export interface GlobalMusicUpdateRequest {
  title?: string
  artist?: string
  category?: string
  licenseType?: string
  sourceUrl?: string
  attribution?: string
}

export interface ValidatedGlobalMusicUpload {
  filename: string
  mimeType: string
  fileSize: number
  title: string
  artist?: string
  duration?: number
  category: MusicCategory
  license?: LicenseInfo
}

export function validateGlobalMusicUploadRequest(
  data: GlobalMusicUploadRequest
): ValidatedGlobalMusicUpload | { error: string } {
  // Required fields
  if (!data.filename || typeof data.filename !== 'string') {
    return { error: 'filename is required' }
  }
  if (!data.mimeType || typeof data.mimeType !== 'string') {
    return { error: 'mimeType is required' }
  }
  if (!data.fileSize || typeof data.fileSize !== 'number' || data.fileSize <= 0) {
    return { error: 'fileSize must be a positive number' }
  }
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return { error: 'title is required' }
  }
  if (!data.category || typeof data.category !== 'string') {
    return { error: 'category is required' }
  }

  // Validate category
  if (!isValidMusicCategory(data.category)) {
    return { error: `Invalid category. Must be one of: ${MUSIC_CATEGORIES.join(', ')}` }
  }

  // Build license info if provided
  let license: LicenseInfo | undefined
  if (data.licenseType) {
    if (!isValidLicenseType(data.licenseType)) {
      return { error: `Invalid license type. Must be one of: ${LICENSE_TYPES.join(', ')}` }
    }
    license = {
      type: data.licenseType,
      ...(data.sourceUrl && { sourceUrl: data.sourceUrl }),
    }
  }

  return {
    filename: data.filename,
    mimeType: data.mimeType,
    fileSize: data.fileSize,
    title: data.title.trim(),
    ...(data.artist && { artist: data.artist.trim() }),
    ...(data.duration && { duration: data.duration }),
    category: data.category,
    ...(license && { license }),
  }
}

export interface ValidatedGlobalMusicUpdate {
  title?: string
  artist?: string
  category?: MusicCategory
  license?: LicenseInfo
}

export function validateGlobalMusicUpdateRequest(
  data: GlobalMusicUpdateRequest,
  existingLicense?: LicenseInfo
): ValidatedGlobalMusicUpdate | { error: string } {
  const result: ValidatedGlobalMusicUpdate = {}

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      return { error: 'title must be a non-empty string' }
    }
    result.title = data.title.trim()
  }

  if (data.artist !== undefined) {
    if (typeof data.artist !== 'string') {
      return { error: 'artist must be a string' }
    }
    result.artist = data.artist.trim() || undefined
  }

  if (data.category !== undefined) {
    if (!isValidMusicCategory(data.category)) {
      return { error: `Invalid category. Must be one of: ${MUSIC_CATEGORIES.join(', ')}` }
    }
    result.category = data.category
  }

  // Handle license updates
  if (
    data.licenseType !== undefined ||
    data.sourceUrl !== undefined ||
    data.attribution !== undefined
  ) {
    const licenseType = data.licenseType ?? existingLicense?.type ?? 'free'
    if (!isValidLicenseType(licenseType)) {
      return { error: `Invalid license type. Must be one of: ${LICENSE_TYPES.join(', ')}` }
    }

    result.license = {
      type: licenseType,
      ...(data.sourceUrl !== undefined
        ? { sourceUrl: data.sourceUrl || undefined }
        : existingLicense?.sourceUrl
          ? { sourceUrl: existingLicense.sourceUrl }
          : {}),
      ...(data.attribution !== undefined
        ? { attribution: data.attribution || undefined }
        : existingLicense?.attribution
          ? { attribution: existingLicense.attribution }
          : {}),
    }
  }

  return result
}

/**
 * Generate attribution text for a track based on its license
 */
export function generateAttributionText(track: {
  title: string
  artist?: string
  license?: LicenseInfo
}): string | null {
  if (!track.license) return null

  // If custom attribution is provided, use it
  if (track.license.attribution) {
    return track.license.attribution
  }

  // If license doesn't require attribution, return null
  if (!requiresAttribution(track.license.type)) {
    return null
  }

  // Generate standard attribution
  let attribution = `Music: ${track.title}`
  if (track.artist) {
    attribution += ` by ${track.artist}`
  }
  if (track.license.sourceUrl) {
    attribution += ` (${track.license.sourceUrl})`
  }

  return attribution
}
