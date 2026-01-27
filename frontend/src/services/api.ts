import type {
  RsvpFormData,
  RsvpApiResponse,
  RsvpListResponse,
  AdminRsvpRequest,
  CreateRsvpResponse,
  UpdateRsvpResponse,
  DeleteRsvpResponse,
  RsvpSettings,
  RsvpSettingsResponse,
} from '@/types/rsvp'
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  CreateAdminRequest,
  CreateAdminResponse,
  ListAdminsResponse,
  DeleteAdminResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetProfileResponse,
  UpdateEmailRequest,
  UpdateEmailResponse,
  ForceResetPasswordResponse,
  SetNewPasswordRequest,
  SetNewPasswordResponse,
  Wedding,
  ListWeddingsResponse,
  CreateWeddingRequest,
  CreateWeddingResponse,
  UpdateWeddingRequest,
  UpdateWeddingResponse,
  AddWeddingOwnerRequest,
  AddWeddingOwnerResponse,
  UpdateWeddingOwnerRequest,
  UpdateWeddingOwnerResponse,
  RemoveWeddingOwnerResponse,
  ResetOwnerPasswordResponse,
  WeddingDetailResponse,
  DeletionPreview,
  HardDeleteResponse,
  ListStaffResponse,
  CreateStaffRequest,
  CreateStaffResponse,
  UpdateStaffRequest,
  UpdateStaffResponse,
  DeleteStaffResponse,
  // Super Admin Settings
  ListSuperAdminsResponse,
  ChangeSuperAdminPasswordRequest,
  ChangeSuperAdminPasswordResponse,
  ResetSuperAdminPasswordResponse,
  // Wedding Limits
  WeddingLimits,
  UpdateWeddingLimitsRequest,
  UpdateWeddingLimitsResponse,
} from '@/types/admin'
import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  ListImagesResponse,
  ReorderImagesRequest,
  DeleteImageResponse,
  UpdateSettingsRequest,
  SettingsResponse,
} from '@/types/gallery'
import type {
  VenueData,
  VenueUpdateRequest,
  ParkingImageUploadRequest,
  ParkingPresignedUrlResponse,
  ParkingConfirmUploadRequest,
  ParkingImage,
  ParkingImagesResponse,
} from '@/types/venue'
import type { WeddingDetailsData, WeddingDetailsUpdateRequest } from '@/types/weddingDetails'
import type { ScheduleData, ScheduleUpdateRequest, ScheduleSettings } from '@/types/schedule'
import type { ContactsData, ContactsUpdateRequest, ContactsSettings } from '@/types/contacts'
import type {
  MusicResponse,
  MusicSettingsUpdateRequest,
  MusicSettingsUpdateResponse,
  MusicPresignedUrlRequest,
  MusicPresignedUrlResponse,
  MusicConfirmRequest,
  MusicConfirmResponse,
  MusicDeleteResponse,
  MusicReorderRequest,
  MusicReorderResponse,
  MusicCategory,
  GlobalMusicListResponse,
  GlobalMusicPresignedUrlRequest,
  GlobalMusicPresignedUrlResponse,
  GlobalMusicConfirmRequest,
  GlobalMusicConfirmResponse,
  GlobalMusicUpdateRequest,
  GlobalMusicUpdateResponse,
  GlobalMusicDeleteRequest,
  GlobalMusicDeleteResponse,
  GlobalMusicDeletePreviewResponse,
  GlobalMusicReorderRequest,
  GlobalMusicReorderResponse,
  AddFromLibraryResponse,
  AddYouTubeTrackResponse,
} from '@/types/music'
import type { ThemeSettings, ThemeUpdateRequest } from '@/types/theme'
import type { DesignSettings, DesignUpdateRequest } from '@/types/design'
import type {
  GiftListResponse,
  CreateGiftRequest,
  CreateGiftResponse,
  UpdateGiftRequest,
  UpdateGiftResponse,
  DeleteGiftResponse,
  BulkDeleteGiftsRequest,
  BulkDeleteGiftsResponse,
  BulkCreateGiftsRequest,
  BulkCreateGiftsResponse,
  ReorderGiftsRequest,
  ReorderGiftsResponse,
  GiftPresignedUrlRequest,
  GiftPresignedUrlResponse,
  GiftConfirmUploadRequest,
  GiftConfirmUploadResponse,
  ReserveGiftRequest,
  ReserveGiftResponse,
  GiftSettings,
  GiftSettingsUpdateRequest,
  ReservationListResponse,
} from '@/types/gift'
import type {
  QRCodeHubSettings,
  QRCodeHubUpdateRequest,
  QRCodeHubPresignedUrlRequest,
  QRCodeHubPresignedUrlResponse,
} from '@/types/qrCodeHub'
import type {
  HeroBackgroundSettings,
  HeroBackgroundUpdateRequest,
  HeroBackgroundPresignedUrlRequest,
  HeroBackgroundPresignedUrlResponse,
  HeroBackgroundConfirmRequest,
  DeviceType,
} from '@/types/heroBackground'
import {
  getAccessToken,
  refreshTokens,
  isTokenExpiringSoon,
  notifyAuthExpired,
} from './tokenManager'
import { cachedFetch, CACHE_KEYS, clearCache } from '@/utils/apiCache'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ============================================================================
// Multi-tenant URL helpers
// ============================================================================

/**
 * Build public endpoint URL with optional wedding slug
 * If weddingSlug is provided, uses multi-tenant path: /{weddingSlug}/endpoint
 * Otherwise uses legacy path: /endpoint
 */
function buildPublicUrl(endpoint: string, weddingSlug?: string): string {
  // Guard against the literal string "undefined" being passed as a slug
  // This can happen if undefined is accidentally coerced to string somewhere
  if (weddingSlug && weddingSlug !== 'undefined') {
    return `${API_URL}/${encodeURIComponent(weddingSlug)}${endpoint}`
  }
  return `${API_URL}${endpoint}`
}

/**
 * Build admin endpoint URL with optional wedding ID
 * If weddingId is provided, uses multi-tenant path: /admin/w/{weddingId}/endpoint
 * Otherwise uses legacy path: /endpoint (for backward compatibility)
 */
function buildAdminUrl(endpoint: string, weddingId?: string): string {
  // Guard against the literal string "undefined" being passed as a wedding ID
  if (weddingId && weddingId !== 'undefined') {
    return `${API_URL}/admin/w/${encodeURIComponent(weddingId)}${endpoint}`
  }
  return `${API_URL}${endpoint}`
}

// API Response wrapper types for standardized backend format
interface ApiSuccessResponse<T> {
  success: true
  data: T
  metadata: {
    requestId: string
    timestamp: string
  }
}

interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
  }
  metadata: {
    requestId: string
    timestamp: string
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Unwraps the standardized API response format
 * Returns the data on success, throws an error on failure
 */
function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data
  }
  throw new Error(response.error.message)
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function authenticatedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  // Proactively refresh if token is expiring soon
  if (isTokenExpiringSoon()) {
    await refreshTokens()
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })

  // If 401, try to refresh and retry once
  if (response.status === 401) {
    const refreshSuccess = await refreshTokens()

    if (refreshSuccess) {
      // Retry with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      })
      const retryJson = (await retryResponse.json()) as ApiResponse<T>
      return unwrapResponse(retryJson)
    }

    // Refresh failed - notify app to redirect to login
    notifyAuthExpired()
  }

  const json = (await response.json()) as ApiResponse<T>
  return unwrapResponse(json)
}

export async function submitRsvp(
  data: RsvpFormData,
  weddingSlug?: string
): Promise<RsvpApiResponse> {
  const response = await fetch(buildPublicUrl('/rsvp', weddingSlug), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const json = (await response.json()) as ApiResponse<RsvpApiResponse>
  return unwrapResponse(json)
}

export interface PaginationParams {
  limit?: number
  lastKey?: string | null
}

export async function listRsvps(
  status?: 'attending' | 'maybe' | 'not_attending',
  weddingId?: string,
  pagination?: PaginationParams
): Promise<RsvpListResponse> {
  const baseUrl = buildAdminUrl('/rsvps', weddingId)
  const url = new URL(baseUrl)
  if (status) {
    url.searchParams.set('status', status)
  }
  if (pagination?.limit) {
    url.searchParams.set('limit', String(pagination.limit))
  }
  if (pagination?.lastKey) {
    url.searchParams.set('lastKey', pagination.lastKey)
  }

  return authenticatedFetch<RsvpListResponse>(url.toString(), {
    method: 'GET',
  })
}

export async function createRsvp(
  data: AdminRsvpRequest,
  weddingId?: string
): Promise<CreateRsvpResponse> {
  return authenticatedFetch<CreateRsvpResponse>(buildAdminUrl('/rsvps', weddingId), {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRsvp(
  id: string,
  data: AdminRsvpRequest,
  weddingId?: string
): Promise<UpdateRsvpResponse> {
  return authenticatedFetch<UpdateRsvpResponse>(
    buildAdminUrl(`/rsvps/${encodeURIComponent(id)}`, weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function deleteRsvp(id: string, weddingId?: string): Promise<DeleteRsvpResponse> {
  return authenticatedFetch<DeleteRsvpResponse>(
    buildAdminUrl(`/rsvps/${encodeURIComponent(id)}`, weddingId),
    {
      method: 'DELETE',
    }
  )
}

// Get RSVP settings (public)
export async function getRsvpSettings(weddingSlug?: string): Promise<RsvpSettingsResponse> {
  const response = await fetch(buildPublicUrl('/rsvp/settings', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<RsvpSettingsResponse>
  return unwrapResponse(json)
}

// Update RSVP settings (admin)
export async function updateRsvpSettings(
  settings: Partial<RsvpSettings>,
  weddingId?: string
): Promise<{ settings: RsvpSettings }> {
  return authenticatedFetch<{ settings: RsvpSettings }>(
    buildAdminUrl('/rsvp/settings', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    }
  )
}

export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const json = (await response.json()) as ApiResponse<AdminLoginResponse>
  return unwrapResponse(json)
}

export async function createAdminUser(data: CreateAdminRequest): Promise<CreateAdminResponse> {
  return authenticatedFetch<CreateAdminResponse>(`${API_URL}/admin/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function listAdminUsers(): Promise<ListAdminsResponse> {
  return authenticatedFetch<ListAdminsResponse>(`${API_URL}/admin/users`, {
    method: 'GET',
  })
}

export async function deleteAdminUser(username: string): Promise<DeleteAdminResponse> {
  return authenticatedFetch<DeleteAdminResponse>(
    `${API_URL}/admin/users/${encodeURIComponent(username)}`,
    { method: 'DELETE' }
  )
}

export async function changeAdminPassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return authenticatedFetch<ChangePasswordResponse>(`${API_URL}/admin/users/password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getAdminProfile(): Promise<GetProfileResponse> {
  return authenticatedFetch<GetProfileResponse>(`${API_URL}/admin/users/me`, {
    method: 'GET',
  })
}

export async function updateAdminEmail(data: UpdateEmailRequest): Promise<UpdateEmailResponse> {
  return authenticatedFetch<UpdateEmailResponse>(`${API_URL}/admin/users/me/email`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function forceResetPassword(username: string): Promise<ForceResetPasswordResponse> {
  return authenticatedFetch<ForceResetPasswordResponse>(
    `${API_URL}/admin/users/${encodeURIComponent(username)}/reset-password`,
    { method: 'PUT' }
  )
}

export async function setNewPassword(data: SetNewPasswordRequest): Promise<SetNewPasswordResponse> {
  return authenticatedFetch<SetNewPasswordResponse>(`${API_URL}/admin/users/set-password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Gallery API functions

export async function listGalleryImages(weddingId?: string): Promise<ListImagesResponse> {
  return authenticatedFetch<ListImagesResponse>(buildAdminUrl('/images', weddingId), {
    method: 'GET',
  })
}

export async function getPresignedUrl(
  data: PresignedUrlRequest,
  weddingId?: string
): Promise<PresignedUrlResponse> {
  return authenticatedFetch<PresignedUrlResponse>(
    buildAdminUrl('/images/presigned-url', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function uploadToS3(
  presignedUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<boolean> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
    signal: signal ?? null,
  })
  return response.ok
}

/**
 * Upload file to S3 with progress tracking using XMLHttpRequest
 */
export function uploadToS3WithProgress(
  presignedUrl: string,
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('Upload aborted'))
      })
    }

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress(percentComplete)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true)
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

export async function confirmImageUpload(
  data: ConfirmUploadRequest,
  weddingId?: string
): Promise<ConfirmUploadResponse> {
  return authenticatedFetch<ConfirmUploadResponse>(buildAdminUrl('/images/confirm', weddingId), {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteGalleryImage(
  imageId: string,
  weddingId?: string
): Promise<DeleteImageResponse> {
  return authenticatedFetch<DeleteImageResponse>(
    buildAdminUrl(`/images/${encodeURIComponent(imageId)}`, weddingId),
    { method: 'DELETE' }
  )
}

export async function reorderGalleryImages(
  data: ReorderImagesRequest,
  weddingId?: string
): Promise<{ success: boolean; error?: string }> {
  return authenticatedFetch<{ success: boolean; error?: string }>(
    buildAdminUrl('/images/reorder', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function getGallerySettings(weddingId?: string): Promise<SettingsResponse> {
  return authenticatedFetch<SettingsResponse>(buildAdminUrl('/images/settings', weddingId), {
    method: 'GET',
  })
}

export async function updateGallerySettings(
  data: UpdateSettingsRequest,
  weddingId?: string
): Promise<SettingsResponse> {
  return authenticatedFetch<SettingsResponse>(buildAdminUrl('/images/settings', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Venue API functions

export async function getVenue(weddingSlug?: string): Promise<VenueData> {
  const response = await fetch(buildPublicUrl('/venue', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<VenueData>
  return unwrapResponse(json)
}

export async function updateVenue(
  data: VenueUpdateRequest,
  weddingId?: string
): Promise<VenueData> {
  return authenticatedFetch<VenueData>(buildAdminUrl('/venue', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Parking Images API functions

export async function listParkingImages(weddingSlug?: string): Promise<ParkingImagesResponse> {
  const response = await fetch(buildPublicUrl('/parking', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<ParkingImagesResponse>
  return unwrapResponse(json)
}

export async function getParkingPresignedUrl(
  data: ParkingImageUploadRequest,
  weddingId?: string
): Promise<ParkingPresignedUrlResponse> {
  return authenticatedFetch<ParkingPresignedUrlResponse>(
    buildAdminUrl('/parking/presigned-url', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function confirmParkingUpload(
  data: ParkingConfirmUploadRequest,
  weddingId?: string
): Promise<ParkingImage> {
  return authenticatedFetch<ParkingImage>(buildAdminUrl('/parking/confirm', weddingId), {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteParkingImage(
  imageId: string,
  weddingId?: string
): Promise<{ message: string }> {
  return authenticatedFetch<{ message: string }>(
    buildAdminUrl(`/parking/${encodeURIComponent(imageId)}`, weddingId),
    { method: 'DELETE' }
  )
}

export async function reorderParkingImages(
  imageIds: string[],
  weddingId?: string
): Promise<{ message: string; newOrder: string[] }> {
  return authenticatedFetch<{ message: string; newOrder: string[] }>(
    buildAdminUrl('/parking/reorder', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify({ imageIds }),
    }
  )
}

// Wedding Details API functions

export async function getWeddingDetails(weddingSlug?: string): Promise<WeddingDetailsData> {
  const response = await fetch(buildPublicUrl('/wedding-details', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<WeddingDetailsData>
  return unwrapResponse(json)
}

export async function updateWeddingDetails(
  data: WeddingDetailsUpdateRequest,
  weddingId?: string
): Promise<WeddingDetailsData> {
  return authenticatedFetch<WeddingDetailsData>(buildAdminUrl('/wedding-details', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Schedule API functions

export async function getSchedule(weddingSlug?: string): Promise<ScheduleData> {
  const response = await fetch(buildPublicUrl('/schedule', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<ScheduleData>
  return unwrapResponse(json)
}

export async function getScheduleAdmin(weddingId?: string): Promise<ScheduleData> {
  return authenticatedFetch<ScheduleData>(buildAdminUrl('/schedule', weddingId), {
    method: 'GET',
  })
}

export async function updateSchedule(
  data: ScheduleUpdateRequest,
  weddingId?: string
): Promise<ScheduleData> {
  return authenticatedFetch<ScheduleData>(buildAdminUrl('/schedule', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateScheduleSettings(
  settings: Partial<ScheduleSettings>,
  weddingId?: string
): Promise<{ settings: ScheduleSettings }> {
  return authenticatedFetch<{ settings: ScheduleSettings }>(
    buildAdminUrl('/schedule/settings', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    }
  )
}

// Contacts API functions

export async function getContacts(weddingSlug?: string): Promise<ContactsData> {
  const response = await fetch(buildPublicUrl('/contacts', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<ContactsData>
  return unwrapResponse(json)
}

export async function getContactsAdmin(weddingId?: string): Promise<ContactsData> {
  return authenticatedFetch<ContactsData>(buildAdminUrl('/contacts', weddingId), {
    method: 'GET',
  })
}

export async function updateContacts(
  data: ContactsUpdateRequest,
  weddingId?: string
): Promise<ContactsData> {
  return authenticatedFetch<ContactsData>(buildAdminUrl('/contacts', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateContactsSettings(
  settings: Partial<ContactsSettings>,
  weddingId?: string
): Promise<{ settings: ContactsSettings }> {
  return authenticatedFetch<{ settings: ContactsSettings }>(
    buildAdminUrl('/contacts/settings', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    }
  )
}

// Music API functions

export async function getMusic(weddingSlug?: string): Promise<MusicResponse> {
  const response = await fetch(buildPublicUrl('/music', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<MusicResponse>
  return unwrapResponse(json)
}

export async function getMusicAdmin(weddingId?: string): Promise<MusicResponse> {
  return authenticatedFetch<MusicResponse>(buildAdminUrl('/music', weddingId), {
    method: 'GET',
  })
}

export async function updateMusicSettings(
  data: MusicSettingsUpdateRequest,
  weddingId?: string
): Promise<MusicSettingsUpdateResponse> {
  return authenticatedFetch<MusicSettingsUpdateResponse>(
    buildAdminUrl('/music/settings', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function getMusicPresignedUrl(
  data: MusicPresignedUrlRequest,
  weddingId?: string
): Promise<MusicPresignedUrlResponse> {
  return authenticatedFetch<MusicPresignedUrlResponse>(
    buildAdminUrl('/music/upload-url', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function uploadMusicToS3(
  presignedUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<boolean> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
    signal: signal ?? null,
  })
  return response.ok
}

export async function confirmMusicUpload(
  data: MusicConfirmRequest,
  weddingId?: string
): Promise<MusicConfirmResponse> {
  return authenticatedFetch<MusicConfirmResponse>(buildAdminUrl('/music/confirm', weddingId), {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteMusicTrack(
  trackId: string,
  weddingId?: string
): Promise<MusicDeleteResponse> {
  return authenticatedFetch<MusicDeleteResponse>(
    buildAdminUrl(`/music/${encodeURIComponent(trackId)}`, weddingId),
    { method: 'DELETE' }
  )
}

export async function reorderMusicTracks(
  data: MusicReorderRequest,
  weddingId?: string
): Promise<MusicReorderResponse> {
  return authenticatedFetch<MusicReorderResponse>(buildAdminUrl('/music/reorder', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Add music from global library (wedding admin)
export async function addMusicFromLibrary(
  globalMusicId: string,
  weddingId?: string
): Promise<AddFromLibraryResponse> {
  return authenticatedFetch<AddFromLibraryResponse>(
    buildAdminUrl('/music/add-from-library', weddingId),
    {
      method: 'POST',
      body: JSON.stringify({ globalMusicId }),
    }
  )
}

// Add YouTube track (wedding admin)
export async function addYouTubeTrack(
  youtubeUrl: string,
  weddingId?: string
): Promise<AddYouTubeTrackResponse> {
  return authenticatedFetch<AddYouTubeTrackResponse>(
    buildAdminUrl('/music/add-youtube', weddingId),
    {
      method: 'POST',
      body: JSON.stringify({ youtubeUrl }),
    }
  )
}

// List global music library (wedding admin - read only)
export async function listMusicLibrary(category?: MusicCategory): Promise<GlobalMusicListResponse> {
  const params = category ? `?category=${category}` : ''
  return authenticatedFetch<GlobalMusicListResponse>(`${API_URL}/admin/music-library${params}`)
}

// Theme API functions

export async function getTheme(weddingSlug?: string): Promise<ThemeSettings> {
  const response = await fetch(buildPublicUrl('/theme', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<ThemeSettings>
  return unwrapResponse(json)
}

export async function updateTheme(
  data: ThemeUpdateRequest,
  weddingId?: string
): Promise<ThemeSettings> {
  return authenticatedFetch<ThemeSettings>(buildAdminUrl('/theme', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Design/Layout API functions

export async function getDesign(weddingSlug?: string): Promise<DesignSettings> {
  const response = await fetch(buildPublicUrl('/design', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<DesignSettings>
  return unwrapResponse(json)
}

export async function updateDesign(
  data: DesignUpdateRequest,
  weddingId?: string
): Promise<DesignSettings> {
  return authenticatedFetch<DesignSettings>(buildAdminUrl('/design', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function getDesignCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<DesignSettings> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.DESIGN}-${weddingSlug}` : CACHE_KEYS.DESIGN
  return cachedFetch(cacheKey, () => getDesign(weddingSlug), forceRefresh)
}

// Gift Registry API functions

export async function listGifts(weddingSlug?: string): Promise<GiftListResponse> {
  const response = await fetch(buildPublicUrl('/gifts', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<GiftListResponse>
  return unwrapResponse(json)
}

export async function listGiftsAdmin(weddingId?: string): Promise<GiftListResponse> {
  return authenticatedFetch<GiftListResponse>(buildAdminUrl('/gifts', weddingId), {
    method: 'GET',
  })
}

export async function createGift(
  data: CreateGiftRequest,
  weddingId?: string
): Promise<CreateGiftResponse> {
  return authenticatedFetch<CreateGiftResponse>(buildAdminUrl('/gifts', weddingId), {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function bulkCreateGifts(
  request: BulkCreateGiftsRequest,
  weddingId?: string
): Promise<BulkCreateGiftsResponse> {
  return authenticatedFetch<BulkCreateGiftsResponse>(buildAdminUrl('/gifts/bulk', weddingId), {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateGift(
  id: string,
  data: UpdateGiftRequest,
  weddingId?: string
): Promise<UpdateGiftResponse> {
  return authenticatedFetch<UpdateGiftResponse>(
    buildAdminUrl(`/gifts/${encodeURIComponent(id)}`, weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function deleteGift(id: string, weddingId?: string): Promise<DeleteGiftResponse> {
  return authenticatedFetch<DeleteGiftResponse>(
    buildAdminUrl(`/gifts/${encodeURIComponent(id)}`, weddingId),
    {
      method: 'DELETE',
    }
  )
}

export async function bulkDeleteGifts(
  request: BulkDeleteGiftsRequest,
  weddingId?: string
): Promise<BulkDeleteGiftsResponse> {
  return authenticatedFetch<BulkDeleteGiftsResponse>(buildAdminUrl('/gifts/bulk', weddingId), {
    method: 'DELETE',
    body: JSON.stringify(request),
  })
}

export async function reorderGifts(
  data: ReorderGiftsRequest,
  weddingId?: string
): Promise<ReorderGiftsResponse> {
  return authenticatedFetch<ReorderGiftsResponse>(buildAdminUrl('/gifts/reorder', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getGiftPresignedUrl(
  data: GiftPresignedUrlRequest,
  weddingId?: string
): Promise<GiftPresignedUrlResponse> {
  return authenticatedFetch<GiftPresignedUrlResponse>(
    buildAdminUrl('/gifts/presigned-url', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function confirmGiftUpload(
  data: GiftConfirmUploadRequest,
  weddingId?: string
): Promise<GiftConfirmUploadResponse> {
  return authenticatedFetch<GiftConfirmUploadResponse>(buildAdminUrl('/gifts/confirm', weddingId), {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function reserveGift(
  giftId: string,
  data: ReserveGiftRequest,
  weddingSlug?: string
): Promise<ReserveGiftResponse> {
  const response = await fetch(
    buildPublicUrl(`/gifts/${encodeURIComponent(giftId)}/reserve`, weddingSlug),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  const json = (await response.json()) as ApiResponse<ReserveGiftResponse>
  return unwrapResponse(json)
}

export async function getGiftSettings(weddingId?: string): Promise<GiftSettings> {
  return authenticatedFetch<GiftSettings>(buildAdminUrl('/gifts/settings', weddingId), {
    method: 'GET',
  })
}

export async function updateGiftSettings(
  data: GiftSettingsUpdateRequest,
  weddingId?: string
): Promise<GiftSettings> {
  return authenticatedFetch<GiftSettings>(buildAdminUrl('/gifts/settings', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function listGiftReservations(
  giftId?: string,
  weddingId?: string
): Promise<ReservationListResponse> {
  const baseUrl = buildAdminUrl('/gifts/reservations', weddingId)
  const url = new URL(baseUrl)
  if (giftId) {
    url.searchParams.set('giftId', giftId)
  }

  return authenticatedFetch<ReservationListResponse>(url.toString(), {
    method: 'GET',
  })
}

// ============================================================================
// Cached API Functions (for public pages - session-level caching)
// ============================================================================

/**
 * Public gallery images fetch (no auth required)
 * Used by GallerySection on the public page
 */
export async function listGalleryImagesPublic(weddingSlug?: string): Promise<ListImagesResponse> {
  const response = await fetch(buildPublicUrl('/gallery', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<ListImagesResponse>
  return unwrapResponse(json)
}

/**
 * Public RSVP list fetch (no auth required for guestbook wishes)
 * Used by GuestbookSection on the public page
 */
export async function listRsvpsPublic(weddingSlug?: string): Promise<RsvpListResponse> {
  const response = await fetch(buildPublicUrl('/rsvps', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<RsvpListResponse>
  return unwrapResponse(json)
}

// Cached versions of public GET endpoints
// All cached functions now support optional wedding slug/id for multi-tenant

export function getVenueCached(weddingSlug?: string, forceRefresh = false): Promise<VenueData> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.VENUE}-${weddingSlug}` : CACHE_KEYS.VENUE
  return cachedFetch(cacheKey, () => getVenue(weddingSlug), forceRefresh)
}

export function getWeddingDetailsCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<WeddingDetailsData> {
  const cacheKey = weddingSlug
    ? `${CACHE_KEYS.WEDDING_DETAILS}-${weddingSlug}`
    : CACHE_KEYS.WEDDING_DETAILS
  return cachedFetch(cacheKey, () => getWeddingDetails(weddingSlug), forceRefresh)
}

export function getScheduleCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<ScheduleData> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.SCHEDULE}-${weddingSlug}` : CACHE_KEYS.SCHEDULE
  return cachedFetch(cacheKey, () => getSchedule(weddingSlug), forceRefresh)
}

export function getContactsCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<ContactsData> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.CONTACTS}-${weddingSlug}` : CACHE_KEYS.CONTACTS
  return cachedFetch(cacheKey, () => getContacts(weddingSlug), forceRefresh)
}

export function getMusicCached(weddingSlug?: string, forceRefresh = false): Promise<MusicResponse> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.MUSIC}-${weddingSlug}` : CACHE_KEYS.MUSIC
  return cachedFetch(cacheKey, () => getMusic(weddingSlug), forceRefresh)
}

export function getThemeCached(weddingSlug?: string, forceRefresh = false): Promise<ThemeSettings> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.THEME}-${weddingSlug}` : CACHE_KEYS.THEME
  return cachedFetch(cacheKey, () => getTheme(weddingSlug), forceRefresh)
}

export function listGalleryImagesCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<ListImagesResponse> {
  const cacheKey = weddingSlug
    ? `${CACHE_KEYS.GALLERY_IMAGES}-${weddingSlug}`
    : CACHE_KEYS.GALLERY_IMAGES
  return cachedFetch(cacheKey, () => listGalleryImagesPublic(weddingSlug), forceRefresh)
}

export function listRsvpsCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<RsvpListResponse> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.RSVPS}-${weddingSlug}` : CACHE_KEYS.RSVPS
  return cachedFetch(cacheKey, () => listRsvpsPublic(weddingSlug), forceRefresh)
}

export function listGiftsCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<GiftListResponse> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.GIFTS}-${weddingSlug}` : CACHE_KEYS.GIFTS
  return cachedFetch(cacheKey, () => listGifts(weddingSlug), forceRefresh)
}

// Admin cached versions (authenticated)
export function listRsvpsAdminCached(
  weddingId?: string,
  forceRefresh = false
): Promise<RsvpListResponse> {
  const cacheKey = weddingId
    ? `${CACHE_KEYS.RSVPS}-admin-${weddingId}`
    : `${CACHE_KEYS.RSVPS}-admin`
  return cachedFetch(cacheKey, () => listRsvps(undefined, weddingId), forceRefresh)
}

export function listGalleryImagesAdminCached(
  weddingId?: string,
  forceRefresh = false
): Promise<ListImagesResponse> {
  const cacheKey = weddingId
    ? `${CACHE_KEYS.GALLERY_IMAGES}-admin-${weddingId}`
    : `${CACHE_KEYS.GALLERY_IMAGES}-admin`
  return cachedFetch(cacheKey, () => listGalleryImages(weddingId), forceRefresh)
}

// QR Code Hub API functions

export async function getQRCodeHub(weddingSlug?: string): Promise<QRCodeHubSettings> {
  const response = await fetch(buildPublicUrl('/qrcode-hub', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<QRCodeHubSettings>
  return unwrapResponse(json)
}

export async function getQRCodeHubAdmin(weddingId?: string): Promise<QRCodeHubSettings> {
  return authenticatedFetch<QRCodeHubSettings>(buildAdminUrl('/qrcode-hub', weddingId), {
    method: 'GET',
  })
}

export async function updateQRCodeHub(
  data: QRCodeHubUpdateRequest,
  weddingId?: string
): Promise<QRCodeHubSettings> {
  return authenticatedFetch<QRCodeHubSettings>(buildAdminUrl('/qrcode-hub', weddingId), {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getQRCodeHubPresignedUrl(
  data: QRCodeHubPresignedUrlRequest,
  weddingId?: string
): Promise<QRCodeHubPresignedUrlResponse> {
  return authenticatedFetch<QRCodeHubPresignedUrlResponse>(
    buildAdminUrl('/qrcode-hub/presigned-url', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export function getQRCodeHubCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<QRCodeHubSettings> {
  const cacheKey = weddingSlug ? `${CACHE_KEYS.QRCODE_HUB}-${weddingSlug}` : CACHE_KEYS.QRCODE_HUB
  return cachedFetch(cacheKey, () => getQRCodeHub(weddingSlug), forceRefresh)
}

// Re-export clearCache for components that need to invalidate cache
export { clearCache }

// ============================================
// Admin Utility Functions
// ============================================

interface ResolveSlugResponse {
  weddingId: string
  slug: string
  displayName: string
  status: string
}

/**
 * Resolve a wedding slug to its weddingId
 * Requires authentication - only returns if user has access to the wedding
 */
export async function resolveWeddingSlug(slug: string): Promise<ResolveSlugResponse> {
  return authenticatedFetch<ResolveSlugResponse>(
    `${API_URL}/admin/resolve-slug/${encodeURIComponent(slug)}`,
    { method: 'GET' }
  )
}

export interface WeddingMetadata {
  weddingId: string
  slug: string
  displayName: string
  status: 'active' | 'draft' | 'archived'
  weddingDate?: string
}

interface MyWeddingsResponse {
  weddings: WeddingMetadata[]
  primaryWeddingId: string | null
}

/**
 * Get all weddings assigned to the current user
 * Super admins get all weddings, wedding admins get their assigned weddings
 */
export async function getMyWeddings(): Promise<MyWeddingsResponse> {
  return authenticatedFetch<MyWeddingsResponse>(`${API_URL}/admin/my-weddings`, {
    method: 'GET',
  })
}

// ============================================
// Super Admin API Functions
// ============================================

const SUPERADMIN_URL = `${API_URL}/superadmin`

export async function listWeddings(): Promise<ListWeddingsResponse> {
  return authenticatedFetch<ListWeddingsResponse>(`${SUPERADMIN_URL}/weddings`, {
    method: 'GET',
  })
}

export async function getWeddingById(weddingId: string): Promise<WeddingDetailResponse> {
  return authenticatedFetch<WeddingDetailResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}`,
    { method: 'GET' }
  )
}

export async function createWedding(data: CreateWeddingRequest): Promise<CreateWeddingResponse> {
  return authenticatedFetch<CreateWeddingResponse>(`${SUPERADMIN_URL}/weddings`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateWeddingById(
  weddingId: string,
  data: UpdateWeddingRequest
): Promise<Wedding> {
  const response = await authenticatedFetch<UpdateWeddingResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
  return response.wedding
}

export async function archiveWedding(weddingId: string): Promise<{ message: string }> {
  return authenticatedFetch<{ message: string }>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}`,
    { method: 'DELETE' }
  )
}

export async function addWeddingOwner(
  weddingId: string,
  data: AddWeddingOwnerRequest
): Promise<AddWeddingOwnerResponse> {
  return authenticatedFetch<AddWeddingOwnerResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/users`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function updateWeddingOwner(
  weddingId: string,
  username: string,
  data: UpdateWeddingOwnerRequest
): Promise<UpdateWeddingOwnerResponse> {
  return authenticatedFetch<UpdateWeddingOwnerResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/users/${encodeURIComponent(username)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function removeWeddingOwner(
  weddingId: string,
  username: string
): Promise<RemoveWeddingOwnerResponse> {
  return authenticatedFetch<RemoveWeddingOwnerResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/users/${encodeURIComponent(username)}`,
    { method: 'DELETE' }
  )
}

export async function resetOwnerPassword(
  weddingId: string,
  username: string
): Promise<ResetOwnerPasswordResponse> {
  return authenticatedFetch<ResetOwnerPasswordResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/users/${encodeURIComponent(username)}/reset-password`,
    { method: 'POST' }
  )
}

export async function getDeletionPreview(weddingId: string): Promise<DeletionPreview> {
  return authenticatedFetch<DeletionPreview>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/deletion-preview`
  )
}

export async function hardDeleteWedding(weddingId: string): Promise<HardDeleteResponse> {
  return authenticatedFetch<HardDeleteResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/hard-delete`,
    { method: 'DELETE' }
  )
}

export async function getWeddingLimits(weddingId: string): Promise<WeddingLimits> {
  return authenticatedFetch<WeddingLimits>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/limits`
  )
}

export async function updateWeddingLimits(
  weddingId: string,
  data: UpdateWeddingLimitsRequest
): Promise<UpdateWeddingLimitsResponse> {
  return authenticatedFetch<UpdateWeddingLimitsResponse>(
    `${SUPERADMIN_URL}/weddings/${encodeURIComponent(weddingId)}/limits`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

// ============================================
// STAFF MANAGEMENT (Super Admin)
// ============================================

export async function listStaff(): Promise<ListStaffResponse> {
  return authenticatedFetch<ListStaffResponse>(`${SUPERADMIN_URL}/staff`)
}

export async function createStaff(data: CreateStaffRequest): Promise<CreateStaffResponse> {
  return authenticatedFetch<CreateStaffResponse>(`${SUPERADMIN_URL}/staff`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStaff(
  username: string,
  data: UpdateStaffRequest
): Promise<UpdateStaffResponse> {
  return authenticatedFetch<UpdateStaffResponse>(
    `${SUPERADMIN_URL}/staff/${encodeURIComponent(username)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function deleteStaff(username: string): Promise<DeleteStaffResponse> {
  return authenticatedFetch<DeleteStaffResponse>(
    `${SUPERADMIN_URL}/staff/${encodeURIComponent(username)}`,
    { method: 'DELETE' }
  )
}

// ============================================
// SUPER ADMIN SETTINGS
// ============================================

export async function changeSuperAdminPassword(
  data: ChangeSuperAdminPasswordRequest
): Promise<ChangeSuperAdminPasswordResponse> {
  return authenticatedFetch<ChangeSuperAdminPasswordResponse>(`${SUPERADMIN_URL}/password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function listSuperAdmins(): Promise<ListSuperAdminsResponse> {
  return authenticatedFetch<ListSuperAdminsResponse>(`${SUPERADMIN_URL}/admins`)
}

export async function resetSuperAdminPassword(
  username: string
): Promise<ResetSuperAdminPasswordResponse> {
  return authenticatedFetch<ResetSuperAdminPasswordResponse>(
    `${SUPERADMIN_URL}/admins/${encodeURIComponent(username)}/reset-password`,
    { method: 'POST' }
  )
}

// ============================================
// GLOBAL MUSIC LIBRARY (Super Admin)
// ============================================

export async function listGlobalMusic(category?: MusicCategory): Promise<GlobalMusicListResponse> {
  const params = category ? `?category=${category}` : ''
  return authenticatedFetch<GlobalMusicListResponse>(`${SUPERADMIN_URL}/music-library${params}`)
}

export async function getGlobalMusicPresignedUrl(
  data: GlobalMusicPresignedUrlRequest
): Promise<GlobalMusicPresignedUrlResponse> {
  return authenticatedFetch<GlobalMusicPresignedUrlResponse>(
    `${SUPERADMIN_URL}/music-library/upload-url`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function confirmGlobalMusicUpload(
  data: GlobalMusicConfirmRequest
): Promise<GlobalMusicConfirmResponse> {
  return authenticatedFetch<GlobalMusicConfirmResponse>(`${SUPERADMIN_URL}/music-library/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateGlobalMusic(
  trackId: string,
  data: GlobalMusicUpdateRequest
): Promise<GlobalMusicUpdateResponse> {
  return authenticatedFetch<GlobalMusicUpdateResponse>(
    `${SUPERADMIN_URL}/music-library/${encodeURIComponent(trackId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function getGlobalMusicDeletePreview(
  trackId: string
): Promise<GlobalMusicDeletePreviewResponse> {
  return authenticatedFetch<GlobalMusicDeletePreviewResponse>(
    `${SUPERADMIN_URL}/music-library/${encodeURIComponent(trackId)}?preview=true`,
    { method: 'DELETE' }
  )
}

export async function deleteGlobalMusic(
  trackId: string,
  data?: GlobalMusicDeleteRequest
): Promise<GlobalMusicDeleteResponse> {
  return authenticatedFetch<GlobalMusicDeleteResponse>(
    `${SUPERADMIN_URL}/music-library/${encodeURIComponent(trackId)}`,
    {
      method: 'DELETE',
      ...(data && { body: JSON.stringify(data) }),
    }
  )
}

export async function reorderGlobalMusic(
  data: GlobalMusicReorderRequest
): Promise<GlobalMusicReorderResponse> {
  return authenticatedFetch<GlobalMusicReorderResponse>(`${SUPERADMIN_URL}/music-library/reorder`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ============================================
// HERO BACKGROUND API Functions
// ============================================

/**
 * Get hero background settings (public)
 */
export async function getHeroBackground(weddingSlug?: string): Promise<HeroBackgroundSettings> {
  const response = await fetch(buildPublicUrl('/hero-background', weddingSlug), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const json = (await response.json()) as ApiResponse<{ heroBackground: HeroBackgroundSettings }>
  return unwrapResponse(json).heroBackground
}

/**
 * Get hero background settings (cached for public pages)
 */
export function getHeroBackgroundCached(
  weddingSlug?: string,
  forceRefresh = false
): Promise<HeroBackgroundSettings> {
  const cacheKey = weddingSlug
    ? `${CACHE_KEYS.HERO_BACKGROUND}-${weddingSlug}`
    : CACHE_KEYS.HERO_BACKGROUND
  return cachedFetch(cacheKey, () => getHeroBackground(weddingSlug), forceRefresh)
}

/**
 * Get hero background settings (admin - authenticated)
 */
export async function getHeroBackgroundAdmin(weddingId?: string): Promise<HeroBackgroundSettings> {
  const result = await authenticatedFetch<{ heroBackground: HeroBackgroundSettings }>(
    buildAdminUrl('/hero-background', weddingId),
    { method: 'GET' }
  )
  return result.heroBackground
}

/**
 * Update hero background settings (admin)
 */
export async function updateHeroBackground(
  data: HeroBackgroundUpdateRequest,
  weddingId?: string
): Promise<HeroBackgroundSettings> {
  const result = await authenticatedFetch<{ heroBackground: HeroBackgroundSettings }>(
    buildAdminUrl('/hero-background', weddingId),
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
  return result.heroBackground
}

/**
 * Get presigned URL for hero background upload
 */
export async function getHeroBackgroundPresignedUrl(
  data: HeroBackgroundPresignedUrlRequest,
  weddingId?: string
): Promise<HeroBackgroundPresignedUrlResponse> {
  return authenticatedFetch<HeroBackgroundPresignedUrlResponse>(
    buildAdminUrl('/hero-background/presigned-url', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

/**
 * Confirm hero background upload
 */
export async function confirmHeroBackgroundUpload(
  data: HeroBackgroundConfirmRequest,
  weddingId?: string
): Promise<HeroBackgroundSettings> {
  const result = await authenticatedFetch<{ heroBackground: HeroBackgroundSettings }>(
    buildAdminUrl('/hero-background/confirm', weddingId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
  return result.heroBackground
}

/**
 * Delete hero background media
 */
export async function deleteHeroBackgroundMedia(
  deviceType: DeviceType,
  weddingId?: string
): Promise<HeroBackgroundSettings> {
  const result = await authenticatedFetch<{ heroBackground: HeroBackgroundSettings }>(
    buildAdminUrl(`/hero-background/${encodeURIComponent(deviceType)}`, weddingId),
    { method: 'DELETE' }
  )
  return result.heroBackground
}
