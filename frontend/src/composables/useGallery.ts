import { ref, computed } from 'vue'
import type { GalleryImage, GallerySettings } from '@/types/gallery'
import type { UploadState, UploadProgress } from '@/types/upload'
import {
  listGalleryImages,
  getPresignedUrl,
  uploadToS3WithProgress,
  confirmImageUpload,
  deleteGalleryImage,
  reorderGalleryImages,
  updateGallerySettings,
} from '@/services/api'
import { compressImage, formatBytes } from '@/utils/imageCompression'
import { compressVideo, isVideoCompressionSupported } from '@/utils/videoCompression'
import { clearCache, CACHE_KEYS } from '@/utils/apiCache'

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

// Helper functions
const isVideoFile = (file: File): boolean =>
  file.type.startsWith('video/') || file.type === 'video/quicktime'

// Singleton state
const images = ref<GalleryImage[]>([])
const settings = ref<GallerySettings>({
  maxFileSize: 10 * 1024 * 1024, // 10MB default for images
  maxVideoSize: 100 * 1024 * 1024, // 100MB default for videos
  maxImages: 50,
  allowedFormats: ALLOWED_MEDIA_TYPES,
})
const isLoading = ref(false)
const loadError = ref('')
const uploadProgress = ref<Map<string, UploadState>>(new Map())
const uploadControllers = ref<Map<string, AbortController>>(new Map())

// Multi-tenant tracking
const currentWeddingSlug = ref<string | undefined>(undefined)
const currentWeddingId = ref<string | undefined>(undefined)

export function useGallery() {
  // Computed
  const sortedImages = computed(() => [...images.value].sort((a, b) => a.order - b.order))

  const canUploadMore = computed(() => images.value.length < settings.value.maxImages)

  const remainingSlots = computed(() => settings.value.maxImages - images.value.length)

  // Computed property to expose uploads as array for UI components
  const activeUploads = computed<UploadProgress[]>(() => {
    const uploads: UploadProgress[] = []
    uploadProgress.value.forEach((state, fileId) => {
      // Extract filename from fileId (format: "filename-timestamp")
      const filename = fileId.replace(/-\d+$/, '')
      const upload: UploadProgress = {
        id: fileId,
        filename,
        progress: state.progress,
        status: state.status,
      }
      if (state.error !== undefined) {
        upload.error = state.error
      }
      if (state.compression !== undefined) {
        upload.compression = state.compression
      }
      uploads.push(upload)
    })
    return uploads
  })

  // Validate a file before upload
  const validateFile = (file: File): { valid: boolean; error?: string | undefined } => {
    // Check file type
    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: JPG, PNG, WebP, GIF, MP4, WebM, MOV`,
      }
    }

    // Check file size (different limits for images vs videos)
    const isVideo = isVideoFile(file)
    const maxSize = isVideo ? settings.value.maxVideoSize : settings.value.maxFileSize
    const mediaType = isVideo ? 'Video' : 'Image'

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return {
        valid: false,
        error: `${mediaType} file size exceeds maximum of ${maxMB}MB`,
      }
    }

    // Check if we can upload more
    if (!canUploadMore.value) {
      return {
        valid: false,
        error: `Maximum of ${settings.value.maxImages} items reached`,
      }
    }

    return { valid: true }
  }

  // Fetch all images
  const fetchImages = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''
    currentWeddingId.value = weddingId

    try {
      const response = await listGalleryImages(weddingId)
      images.value = response.images
      if (response.settings) {
        // Always use ALLOWED_MEDIA_TYPES for allowedFormats (application-defined, not user-configurable)
        settings.value = {
          ...response.settings,
          allowedFormats: ALLOWED_MEDIA_TYPES,
        }
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load images'
    } finally {
      isLoading.value = false
    }
  }

  // Upload a single image or video
  const uploadImage = async (
    file: File,
    weddingId?: string,
    shouldCompressVideo?: boolean // Only applies to videos; images are always compressed
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    currentWeddingId.value = weddingId
    const fileId = `${file.name}-${Date.now()}`
    const abortController = new AbortController()
    uploadControllers.value.set(fileId, abortController)

    const isVideo = isVideoFile(file)
    const initialStatus = isVideo ? 'preparing' : 'compressing'
    uploadProgress.value.set(fileId, { progress: 0, status: initialStatus })

    // Step 0: Compress media before upload
    let fileToUpload = file
    let compressionInfo:
      | { originalSize: number; compressedSize: number; savedPercent: number }
      | undefined

    if (isVideo) {
      // VIDEO: Optional compression based on user choice
      if (shouldCompressVideo && isVideoCompressionSupported()) {
        uploadProgress.value.set(fileId, { progress: 0, status: 'optimizing' })
        try {
          const result = await compressVideo(file, {}, (progress) => {
            // Map compression progress (0-100) to (0-50) of total
            uploadProgress.value.set(fileId, {
              progress: Math.round(progress * 0.5),
              status: 'optimizing',
            })
          })
          fileToUpload = result.file
          if (result.wasCompressed) {
            compressionInfo = {
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              savedPercent: result.savedPercent,
            }
            console.log(
              `[Gallery] Video optimized: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.savedPercent}% saved)`
            )
          }
        } catch (compressionError) {
          console.warn('[Gallery] Video compression failed, using original:', compressionError)
        }
      } else {
        // Skip to uploading for videos without compression
        uploadProgress.value.set(fileId, { progress: 5, status: 'uploading' })
      }
    } else {
      // IMAGE: Always compress automatically
      try {
        const result = await compressImage(file)
        fileToUpload = result.file
        if (result.compressionRatio > 1) {
          compressionInfo = {
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            savedPercent: Math.round((1 - result.compressedSize / result.originalSize) * 100),
          }
          console.log(
            `[Gallery] Image compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${compressionInfo.savedPercent}% saved)`
          )
        }
      } catch (compressionError) {
        console.warn('[Gallery] Image compression failed, using original:', compressionError)
      }
    }

    // Validate the (possibly compressed) file
    const validation = validateFile(fileToUpload)
    if (!validation.valid) {
      uploadProgress.value.delete(fileId)
      uploadControllers.value.delete(fileId)
      return { success: false, error: validation.error }
    }

    uploadProgress.value.set(fileId, {
      progress: 10,
      status: 'uploading',
      ...(compressionInfo && { compression: compressionInfo }),
    })

    try {
      // Step 1: Get presigned URL (10-15%)
      const presignedResponse = await getPresignedUrl(
        {
          filename: fileToUpload.name,
          mimeType: fileToUpload.type,
          fileSize: fileToUpload.size,
        },
        weddingId
      )

      // Check if cancelled
      if (abortController.signal.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError')
      }

      uploadProgress.value.set(fileId, {
        progress: 15,
        status: 'uploading',
        ...(compressionInfo && { compression: compressionInfo }),
      })

      // Step 2: Upload to S3 with real progress tracking (15-90%)
      // Progress callback maps 0-100% of S3 upload to 15-90% of total progress
      const handleS3Progress = (s3Progress: number) => {
        const mappedProgress = 15 + Math.round((s3Progress / 100) * 75)
        uploadProgress.value.set(fileId, {
          progress: mappedProgress,
          status: 'uploading',
          ...(compressionInfo && { compression: compressionInfo }),
        })
      }

      const uploadSuccess = await uploadToS3WithProgress(
        presignedResponse.uploadUrl,
        fileToUpload,
        handleS3Progress,
        abortController.signal
      )
      if (!uploadSuccess) {
        uploadProgress.value.set(fileId, {
          progress: 15,
          status: 'error',
          error: 'Failed to upload file to storage',
          ...(compressionInfo && { compression: compressionInfo }),
        })
        uploadControllers.value.delete(fileId)
        setTimeout(() => uploadProgress.value.delete(fileId), 5000)
        return { success: false, error: 'Failed to upload file to storage' }
      }

      uploadProgress.value.set(fileId, {
        progress: 90,
        status: 'confirming',
        ...(compressionInfo && { compression: compressionInfo }),
      })

      // Step 3: Confirm upload
      const confirmResponse = await confirmImageUpload(
        {
          imageId: presignedResponse.imageId,
          s3Key: presignedResponse.s3Key,
          filename: fileToUpload.name,
          mimeType: fileToUpload.type,
        },
        weddingId
      )

      uploadProgress.value.set(fileId, {
        progress: 100,
        status: 'completed',
        ...(compressionInfo && { compression: compressionInfo }),
      })
      uploadControllers.value.delete(fileId)

      // Add the new media item to the list
      images.value.push({
        id: confirmResponse.id,
        url: confirmResponse.url,
        filename: confirmResponse.filename,
        mimeType: confirmResponse.mimeType,
        mediaType: confirmResponse.mediaType,
        fileSize: confirmResponse.fileSize,
        order: confirmResponse.order,
        uploadedAt: confirmResponse.uploadedAt,
        uploadedBy: '',
      })

      // Clean up progress after a delay
      setTimeout(() => {
        uploadProgress.value.delete(fileId)
      }, 2000)

      return { success: true }
    } catch (err) {
      uploadControllers.value.delete(fileId)

      // Handle abort error
      if (err instanceof DOMException && err.name === 'AbortError') {
        uploadProgress.value.set(fileId, {
          progress: uploadProgress.value.get(fileId)?.progress ?? 0,
          status: 'cancelled',
          error: 'Upload cancelled',
        })
        setTimeout(() => uploadProgress.value.delete(fileId), 3000)
        return { success: false, error: 'Upload cancelled' }
      }

      uploadProgress.value.set(fileId, {
        progress: uploadProgress.value.get(fileId)?.progress ?? 0,
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      })
      setTimeout(() => uploadProgress.value.delete(fileId), 5000)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      }
    }
  }

  // Cancel an in-progress upload
  const cancelUpload = (fileId: string): void => {
    const controller = uploadControllers.value.get(fileId)
    if (controller) {
      controller.abort()
    }
  }

  // Dismiss an upload from the progress list
  const dismissUpload = (fileId: string): void => {
    uploadProgress.value.delete(fileId)
    uploadControllers.value.delete(fileId)
  }

  // Remove an image
  const removeImage = async (
    imageId: string,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    try {
      currentWeddingId.value = weddingId
      await deleteGalleryImage(imageId, weddingId)
      images.value = images.value.filter((img) => img.id !== imageId)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete image',
      }
    }
  }

  // Update image order
  const updateOrder = async (
    newOrder: string[],
    weddingId?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    currentWeddingId.value = weddingId
    // Optimistically update the UI
    const previousImages = [...images.value]
    images.value = newOrder
      .map((id, index) => {
        const img = images.value.find((i) => i.id === id)
        return img ? { ...img, order: index + 1 } : null
      })
      .filter((img): img is GalleryImage => img !== null)

    try {
      await reorderGalleryImages({ imageIds: newOrder }, weddingId)
      return { success: true }
    } catch (err) {
      // Revert on error
      images.value = previousImages
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder images',
      }
    }
  }

  // Update settings
  const updateSettings = async (
    newSettings: {
      maxFileSize?: number | undefined
      maxVideoSize?: number | undefined
      maxImages?: number | undefined
    },
    weddingId?: string,
    weddingSlug?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    try {
      currentWeddingId.value = weddingId
      const response = await updateGallerySettings(newSettings, weddingId)
      settings.value = response
      // Clear cache to ensure fresh data on next public page load
      clearCache(CACHE_KEYS.GALLERY_IMAGES)
      if (weddingSlug) {
        clearCache(`${CACHE_KEYS.GALLERY_IMAGES}-${weddingSlug}`)
      }
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update settings',
      }
    }
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Check if a file is a video
  const checkIsVideoFile = (file: File): boolean => isVideoFile(file)

  // Check if video compression is supported in this browser
  const checkVideoCompressionSupported = (): boolean => isVideoCompressionSupported()

  return {
    images: sortedImages,
    settings,
    isLoading,
    loadError,
    uploadProgress,
    activeUploads,
    canUploadMore,
    remainingSlots,
    currentWeddingSlug,
    currentWeddingId,
    fetchImages,
    uploadImage,
    cancelUpload,
    dismissUpload,
    removeImage,
    updateOrder,
    updateSettings,
    validateFile,
    formatFileSize,
    checkIsVideoFile,
    checkVideoCompressionSupported,
  }
}
