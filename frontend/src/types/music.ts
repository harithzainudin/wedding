export type MusicSource = 'upload' | 'library'
export type PlayMode = 'single' | 'playlist'

// ============================================
// GLOBAL MUSIC LIBRARY TYPES
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

// License types
export const LICENSE_TYPES = [
  'free',
  'cc0',
  'cc-by',
  'cc-by-sa',
  'cc-by-nc',
  'royalty-free',
  'purchased',
  'custom',
] as const

export type LicenseType = (typeof LICENSE_TYPES)[number]

// Attribution required for these license types
export const ATTRIBUTION_REQUIRED_LICENSES: LicenseType[] = ['cc-by', 'cc-by-sa', 'cc-by-nc']

export interface LicenseInfo {
  type: LicenseType
  sourceUrl?: string | undefined
  attribution?: string | undefined
}

export interface GlobalMusicTrack {
  id: string
  title: string
  artist?: string | undefined
  duration: number
  filename: string
  url: string
  mimeType: string
  fileSize: number
  category: MusicCategory
  order: number
  license?: LicenseInfo | undefined
  attribution?: string | null | undefined // Pre-computed attribution text
  uploadedAt: string
  uploadedBy: string
}

export interface MusicTrack {
  id: string
  title: string
  artist?: string | undefined
  duration: number
  filename: string
  url: string
  mimeType: string
  fileSize: number
  order: number
  source: MusicSource
  globalMusicId?: string | undefined // Present when source is 'library'
  license?: LicenseInfo | undefined // Copied from global track
  attribution?: string | null | undefined // Pre-computed attribution text
  externalId?: string | undefined
  externalUrl?: string | undefined
  uploadedAt: string
  uploadedBy: string
}

export interface MusicSettings {
  enabled: boolean
  autoplay: boolean
  volume: number
  mode: PlayMode
  shuffle: boolean
  loop: boolean
  selectedTrackId?: string | undefined
  maxFileSize: number
  maxTracks: number
  allowedFormats: string[]
  updatedAt?: string | undefined
  updatedBy?: string | undefined
}

// Response data from music endpoint (unwrapped)
export interface MusicResponse {
  settings: MusicSettings
  tracks: MusicTrack[]
}

export interface MusicSettingsUpdateRequest {
  enabled?: boolean | undefined
  autoplay?: boolean | undefined
  volume?: number | undefined
  mode?: PlayMode | undefined
  shuffle?: boolean | undefined
  loop?: boolean | undefined
  selectedTrackId?: string | null | undefined
}

// Response data from music settings update endpoint (unwrapped)
export interface MusicSettingsUpdateResponse {
  message: string
}

export interface MusicPresignedUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
  title: string
  artist?: string | undefined
  duration?: number | undefined
}

// Response data from music presigned URL endpoint (unwrapped)
export interface MusicPresignedUrlResponse {
  uploadUrl: string
  trackId: string
  s3Key: string
  expiresIn: number
}

export interface MusicConfirmRequest {
  trackId: string
  s3Key: string
  filename: string
  mimeType: string
  title: string
  artist?: string | undefined
  duration: number
}

// Response data from music confirm upload endpoint (unwrapped)
export interface MusicConfirmResponse {
  id: string
  title: string
  artist?: string | undefined
  duration: number
  filename: string
  url: string
  mimeType: string
  order: number
  source: MusicSource
  uploadedAt: string
  uploadedBy: string
}

// Response data from music delete endpoint (unwrapped)
export interface MusicDeleteResponse {
  message: string
}

export interface MusicReorderRequest {
  trackIds: string[]
}

// Response data from music reorder endpoint (unwrapped)
export interface MusicReorderResponse {
  message: string
}

// ============================================
// GLOBAL MUSIC LIBRARY API TYPES
// ============================================

export interface GlobalMusicListResponse {
  tracks: GlobalMusicTrack[]
  total: number
  hasMore: boolean
  nextKey?: string | null | undefined
}

export interface GlobalMusicPresignedUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
  title: string
  artist?: string | undefined
  duration?: number | undefined
  category: MusicCategory
  licenseType?: LicenseType | undefined
  sourceUrl?: string | undefined
  customAttribution?: string | undefined // For custom license type
}

export interface GlobalMusicPresignedUrlResponse {
  uploadUrl: string
  trackId: string
  s3Key: string
  expiresIn: number
}

export interface GlobalMusicConfirmRequest {
  trackId: string
  s3Key: string
  filename: string
  mimeType: string
  fileSize: number
  title: string
  artist?: string | undefined
  duration: number
  category: MusicCategory
  licenseType?: LicenseType | undefined
  sourceUrl?: string | undefined
  customAttribution?: string | undefined // For custom license type
}

export interface GlobalMusicConfirmResponse extends GlobalMusicTrack {}

export interface GlobalMusicUpdateRequest {
  title?: string | undefined
  artist?: string | undefined
  category?: MusicCategory | undefined
  licenseType?: LicenseType | undefined
  sourceUrl?: string | undefined
  attribution?: string | undefined
}

export interface GlobalMusicUpdateResponse extends GlobalMusicTrack {
  updatedAt: string
  updatedBy: string
}

export interface GlobalMusicDeleteRequest {
  replacementTrackId?: string | undefined
}

export interface GlobalMusicDeleteResponse {
  success: boolean
  deletedTrackId: string
  replacedCount?: number | undefined
  replacementTrackId?: string | undefined
  affectedWeddings?: string[] | undefined
}

export interface GlobalMusicDeletePreviewResponse {
  trackId: string
  title: string
  usageCount: number
  affectedWeddings: string[]
  requiresReplacement: boolean
}

export interface GlobalMusicReorderRequest {
  category: MusicCategory
  trackIds: string[]
}

export interface GlobalMusicReorderResponse {
  success: boolean
  category: MusicCategory
  trackIds: string[]
  reorderedCount: number
}

// Add from library API types
export interface AddFromLibraryRequest {
  globalMusicId: string
}

export interface AddFromLibraryResponse {
  id: string
  title: string
  artist?: string | undefined
  duration: number
  filename: string
  url: string
  mimeType: string
  fileSize: number
  order: number
  source: 'library'
  globalMusicId: string
  license?: LicenseInfo | undefined
  attribution?: string | null | undefined
  uploadedAt: string
  uploadedBy: string
}
