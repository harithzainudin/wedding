import { ref, computed } from 'vue'
import type {
  QRCodeHubSettings,
  QRCodeHubUpdateRequest,
  QRCodeHubPresignedUrlRequest,
} from '@/types/qrCodeHub'
import { DEFAULT_QRCODE_HUB_SETTINGS } from '@/types/qrCodeHub'
import {
  getQRCodeHub,
  getQRCodeHubAdmin,
  updateQRCodeHub,
  getQRCodeHubPresignedUrl,
  uploadToS3,
  clearCache,
} from '@/services/api'
import { CACHE_KEYS } from '@/utils/apiCache'

// Allowed MIME types for QR images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Singleton state
const settings = ref<QRCodeHubSettings>({ ...DEFAULT_QRCODE_HUB_SETTINGS })
const isLoading = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const loadError = ref('')
const saveError = ref('')
const uploadError = ref('')
const uploadProgress = ref(0)

// Multi-tenant context tracking
const currentWeddingSlug = ref<string | null>(null)
const currentWeddingId = ref<string | null>(null)

export function useQRCodeHub() {
  // Computed
  const enabledQRCodes = computed(() => {
    const enabled: string[] = []
    if (settings.value.website.enabled) enabled.push('website')
    if (settings.value.restuDigital.enabled) enabled.push('restuDigital')
    if (settings.value.location.enabled) enabled.push('location')
    if (settings.value.wifi.enabled) enabled.push('wifi')
    if (settings.value.rsvp.enabled) enabled.push('rsvp')
    if (settings.value.calendar.enabled) enabled.push('calendar')
    if (settings.value.hashtag.enabled) enabled.push('hashtag')
    return enabled
  })

  const enabledCount = computed(() => enabledQRCodes.value.length)

  // Validate a file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Allowed: JPG, PNG, WebP',
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      }
    }

    return { valid: true }
  }

  // Fetch QR Code Hub settings (public API - uses weddingSlug)
  const fetchSettings = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Track current wedding context
    if (weddingSlug !== undefined) {
      currentWeddingSlug.value = weddingSlug
    }

    try {
      const response = await getQRCodeHub(weddingSlug)
      settings.value = response
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load QR Code Hub settings'
      console.error('Failed to load QR Code Hub settings:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch QR Code Hub settings (admin API - uses weddingId)
  const fetchSettingsAdmin = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Track current wedding context
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const response = await getQRCodeHubAdmin(weddingId)
      settings.value = response
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load QR Code Hub settings'
      console.error('Failed to load QR Code Hub settings:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Update QR Code Hub settings
  const saveSettings = async (
    data: QRCodeHubUpdateRequest,
    weddingId?: string
  ): Promise<boolean> => {
    isSaving.value = true
    saveError.value = ''

    // Track current wedding context
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const response = await updateQRCodeHub(data, weddingId)
      settings.value = response
      // Clear cache so public page gets fresh data
      clearCache(CACHE_KEYS.QRCODE_HUB)
      return true
    } catch (err) {
      saveError.value = err instanceof Error ? err.message : 'Failed to save settings'
      console.error('Failed to save QR Code Hub settings:', err)
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Upload Restu Digital QR image
  const uploadRestuDigitalImage = async (
    file: File,
    weddingId?: string
  ): Promise<string | null> => {
    // Validate file first
    const validation = validateFile(file)
    if (!validation.valid) {
      uploadError.value = validation.error ?? 'Invalid file'
      return null
    }

    isUploading.value = true
    uploadError.value = ''
    uploadProgress.value = 0

    try {
      // Get presigned URL
      const presignedData: QRCodeHubPresignedUrlRequest = {
        mimeType: file.type,
        fileSize: file.size,
      }
      const { uploadUrl, publicUrl } = await getQRCodeHubPresignedUrl(presignedData, weddingId)

      // Upload to S3
      uploadProgress.value = 50
      const uploadSuccess = await uploadToS3(uploadUrl, file)

      if (!uploadSuccess) {
        throw new Error('Failed to upload file to storage')
      }

      uploadProgress.value = 100
      return publicUrl
    } catch (err) {
      uploadError.value = err instanceof Error ? err.message : 'Failed to upload image'
      console.error('Failed to upload Restu Digital QR image:', err)
      return null
    } finally {
      isUploading.value = false
    }
  }

  // Reset state
  const reset = (): void => {
    settings.value = { ...DEFAULT_QRCODE_HUB_SETTINGS }
    loadError.value = ''
    saveError.value = ''
    uploadError.value = ''
  }

  return {
    // State
    settings,
    isLoading,
    isSaving,
    isUploading,
    loadError,
    saveError,
    uploadError,
    uploadProgress,

    // Multi-tenant context
    currentWeddingSlug,
    currentWeddingId,

    // Computed
    enabledQRCodes,
    enabledCount,

    // Methods
    fetchSettings,
    fetchSettingsAdmin,
    saveSettings,
    uploadRestuDigitalImage,
    validateFile,
    reset,
  }
}
