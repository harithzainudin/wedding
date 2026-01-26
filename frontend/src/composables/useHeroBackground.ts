import { ref, computed } from 'vue'
import type {
  HeroBackgroundSettings,
  HeroBackgroundUpdateRequest,
  HeroMediaType,
  DeviceType,
  MediaDimensions,
  MediaRecommendation,
} from '@/types/heroBackground'
import type { UploadState, UploadProgress } from '@/types/upload'
import {
  getHeroBackgroundAdmin,
  updateHeroBackground,
  getHeroBackgroundPresignedUrl,
  uploadToS3WithProgress,
  confirmHeroBackgroundUpload,
  deleteHeroBackgroundMedia,
} from '@/services/api'
import { clearCache, CACHE_KEYS } from '@/utils/apiCache'

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const

// Default limits (can be overridden by settings from backend)
const DEFAULT_IMAGE_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_VIDEO_MAX_SIZE = 30 * 1024 * 1024 // 30MB

// Singleton state
const heroBackground = ref<HeroBackgroundSettings>({
  mediaType: 'none',
  uploadMode: 'single',
  overlay: {
    enabled: true,
    color: 'black',
    opacity: 30,
  },
})
const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref('')
const saveError = ref('')
const uploadProgress = ref<Map<string, UploadState>>(new Map())
const uploadControllers = ref<Map<string, AbortController>>(new Map())

// Multi-tenant tracking
const currentWeddingId = ref<string | undefined>(undefined)

export function useHeroBackground() {
  // Computed properties
  const hasDesktopMedia = computed(() => !!heroBackground.value?.desktop)
  const hasMobileMedia = computed(() => !!heroBackground.value?.mobile)
  const hasUniversalMedia = computed(() => !!heroBackground.value?.universal)

  const currentMediaType = computed(() => heroBackground.value?.mediaType ?? 'none')
  const currentUploadMode = computed(() => heroBackground.value?.uploadMode ?? 'single')
  const currentOverlay = computed(
    () => heroBackground.value?.overlay ?? { enabled: true, color: 'black' as const, opacity: 30 }
  )

  // Get max file size based on media type
  const maxImageSize = computed(() => heroBackground.value?.maxImageSize ?? DEFAULT_IMAGE_MAX_SIZE)
  const maxVideoSize = computed(() => heroBackground.value?.maxVideoSize ?? DEFAULT_VIDEO_MAX_SIZE)

  // Active uploads as array for UI
  const activeUploads = computed<UploadProgress[]>(() => {
    const uploads: UploadProgress[] = []
    uploadProgress.value.forEach((state, uploadId) => {
      const upload: UploadProgress = {
        id: uploadId,
        filename: uploadId,
        progress: state.progress,
        status: state.status,
      }
      if (state.error !== undefined) {
        upload.error = state.error
      }
      uploads.push(upload)
    })
    return uploads
  })

  // Validate file before upload
  const validateFile = (
    file: File,
    mediaType: HeroMediaType
  ): { valid: boolean; error?: string } => {
    // Check if media type allows this file
    if (
      mediaType === 'image' &&
      !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])
    ) {
      return {
        valid: false,
        error: `Invalid image type. Allowed: JPG, PNG, WebP`,
      }
    }
    if (
      mediaType === 'video' &&
      !ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])
    ) {
      return {
        valid: false,
        error: `Invalid video type. Allowed: MP4, WebM`,
      }
    }
    if (mediaType === 'none') {
      return {
        valid: false,
        error: `Please select a media type first`,
      }
    }

    // Check file size based on type
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? maxVideoSize.value : maxImageSize.value
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      }
    }

    return { valid: true }
  }

  // Fetch hero background settings
  const fetchHeroBackground = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''
    currentWeddingId.value = weddingId

    try {
      const response = await getHeroBackgroundAdmin(weddingId)
      heroBackground.value = response
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load hero background'
    } finally {
      isLoading.value = false
    }
  }

  // Update settings (overlay, media type, upload mode)
  const updateSettings = async (data: HeroBackgroundUpdateRequest): Promise<boolean> => {
    isSaving.value = true
    saveError.value = ''

    try {
      const response = await updateHeroBackground(data, currentWeddingId.value)
      heroBackground.value = response
      // Clear cache for public pages
      clearCache(`${CACHE_KEYS.HERO_BACKGROUND}-${currentWeddingId.value}`)
      return true
    } catch (err) {
      saveError.value = err instanceof Error ? err.message : 'Failed to update settings'
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Upload media file
  const uploadMedia = async (
    file: File,
    deviceType: DeviceType,
    mediaType: HeroMediaType
  ): Promise<{ success: boolean; error?: string }> => {
    const uploadId = `${deviceType}-${Date.now()}`
    const abortController = new AbortController()
    uploadControllers.value.set(uploadId, abortController)
    uploadProgress.value.set(uploadId, { progress: 0, status: 'preparing' })

    try {
      // Validate file
      const validation = validateFile(file, mediaType)
      if (!validation.valid) {
        uploadProgress.value.set(uploadId, {
          progress: 0,
          status: 'error',
          ...(validation.error && { error: validation.error }),
        })
        return { success: false, ...(validation.error && { error: validation.error }) }
      }

      // Get media dimensions (0-5%)
      uploadProgress.value.set(uploadId, { progress: 2, status: 'preparing' })
      const dimensions = await getMediaDimensions(file)

      // Get presigned URL (5-10%)
      uploadProgress.value.set(uploadId, { progress: 5, status: 'preparing' })
      const { uploadUrl, s3Key } = await getHeroBackgroundPresignedUrl(
        {
          deviceType,
          mimeType: file.type,
          fileSize: file.size,
          filename: file.name,
        },
        currentWeddingId.value
      )

      // Upload to S3 with real progress tracking (10-90%)
      uploadProgress.value.set(uploadId, { progress: 10, status: 'uploading' })

      // Progress callback maps 0-100% of S3 upload to 10-90% of total progress
      const handleS3Progress = (s3Progress: number) => {
        // Map S3 progress (0-100) to our progress (10-90)
        const mappedProgress = 10 + Math.round((s3Progress / 100) * 80)
        uploadProgress.value.set(uploadId, { progress: mappedProgress, status: 'uploading' })
      }

      await uploadToS3WithProgress(uploadUrl, file, handleS3Progress, abortController.signal)

      // Confirm upload (90-100%)
      uploadProgress.value.set(uploadId, { progress: 92, status: 'confirming' })
      const response = await confirmHeroBackgroundUpload(
        {
          deviceType,
          s3Key,
          mimeType: file.type,
          fileSize: file.size,
          dimensions,
        },
        currentWeddingId.value
      )

      heroBackground.value = response
      uploadProgress.value.set(uploadId, { progress: 100, status: 'completed' })

      // Clear cache
      clearCache(`${CACHE_KEYS.HERO_BACKGROUND}-${currentWeddingId.value}`)

      // Remove from progress after a delay
      setTimeout(() => {
        uploadProgress.value.delete(uploadId)
        uploadControllers.value.delete(uploadId)
      }, 2000)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      uploadProgress.value.set(uploadId, {
        progress: 0,
        status: 'error',
        error: errorMessage,
      })
      return { success: false, error: errorMessage }
    }
  }

  // Delete media
  const deleteMedia = async (deviceType: DeviceType): Promise<boolean> => {
    isSaving.value = true
    saveError.value = ''

    try {
      const response = await deleteHeroBackgroundMedia(deviceType, currentWeddingId.value)
      heroBackground.value = response
      clearCache(`${CACHE_KEYS.HERO_BACKGROUND}-${currentWeddingId.value}`)
      return true
    } catch (err) {
      saveError.value = err instanceof Error ? err.message : 'Failed to delete media'
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Cancel upload
  const cancelUpload = (uploadId: string): void => {
    const controller = uploadControllers.value.get(uploadId)
    if (controller) {
      controller.abort()
    }
    uploadProgress.value.delete(uploadId)
    uploadControllers.value.delete(uploadId)
  }

  // Clear any upload errors
  const clearUploadError = (uploadId: string): void => {
    uploadProgress.value.delete(uploadId)
    uploadControllers.value.delete(uploadId)
  }

  return {
    // State
    heroBackground,
    isLoading,
    isSaving,
    loadError,
    saveError,
    activeUploads,

    // Computed
    hasDesktopMedia,
    hasMobileMedia,
    hasUniversalMedia,
    currentMediaType,
    currentUploadMode,
    currentOverlay,
    maxImageSize,
    maxVideoSize,

    // Actions
    fetchHeroBackground,
    updateSettings,
    uploadMedia,
    deleteMedia,
    cancelUpload,
    clearUploadError,
    validateFile,
  }
}

// ============================================
// Media Detection Utilities
// ============================================

/**
 * Get image dimensions from a File
 */
export function getImageDimensions(file: File): Promise<MediaDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const divisor = gcd(img.width, img.height)
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: `${img.width / divisor}:${img.height / divisor}`,
      })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get video dimensions and duration from a File
 */
export function getVideoDimensions(file: File): Promise<MediaDimensions> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const divisor = gcd(video.videoWidth, video.videoHeight)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: `${video.videoWidth / divisor}:${video.videoHeight / divisor}`,
        duration: video.duration,
      })
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video'))
    }
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Get media dimensions (auto-detects image vs video)
 */
export async function getMediaDimensions(file: File): Promise<MediaDimensions> {
  if (file.type.startsWith('video/')) {
    return getVideoDimensions(file)
  }
  return getImageDimensions(file)
}

/**
 * Generate recommendation based on dimensions and device type
 */
export function getMediaRecommendation(
  dimensions: MediaDimensions,
  deviceType: DeviceType
): MediaRecommendation {
  const { width, height } = dimensions

  if (deviceType === 'desktop') {
    // Desktop: prefer landscape 16:9
    if (width >= 1920 && height >= 1080 && width > height) {
      return { status: 'perfect', message: 'Perfect for desktop!' }
    }
    if (width >= 1280 && width > height) {
      return { status: 'good', message: 'Good resolution for desktop' }
    }
    return { status: 'optimize', message: 'Consider a landscape image (1920x1080)' }
  }

  if (deviceType === 'mobile') {
    // Mobile: prefer portrait 9:16
    if (width >= 1080 && height >= 1920 && height > width) {
      return { status: 'perfect', message: 'Perfect for mobile!' }
    }
    if (height >= 1280 && height > width) {
      return { status: 'good', message: 'Good resolution for mobile' }
    }
    return { status: 'optimize', message: 'Consider a portrait image (1080x1920)' }
  }

  // Universal mode
  if (width >= 1920 && height >= 1080) {
    return { status: 'perfect', message: 'Great resolution!' }
  }
  if (width >= 1280 || height >= 1280) {
    return { status: 'good', message: 'Will work for both devices' }
  }
  return { status: 'optimize', message: 'Consider higher resolution (1920x1080 or larger)' }
}

/**
 * Check if video duration is suitable for hero
 */
export function checkVideoDuration(duration: number): {
  suitable: boolean
  message?: string
} {
  if (duration <= 15) {
    return { suitable: true }
  }
  if (duration <= 30) {
    return {
      suitable: true,
      message: 'Video is a bit long for a hero. Consider trimming to under 15 seconds.',
    }
  }
  return {
    suitable: false,
    message: 'Video is too long. Hero videos should be under 30 seconds.',
  }
}

/**
 * Format aspect ratio for display
 */
export function formatAspectRatio(aspectRatio: string): string {
  // Simplify common ratios
  const ratioMap: Record<string, string> = {
    '16:9': '16:9 (Landscape)',
    '9:16': '9:16 (Portrait)',
    '4:3': '4:3',
    '3:4': '3:4',
    '1:1': '1:1 (Square)',
  }
  return ratioMap[aspectRatio] ?? aspectRatio
}
