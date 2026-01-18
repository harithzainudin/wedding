import { ref, computed } from 'vue'
import type { GalleryImage, GallerySettings } from '@/types/gallery'
import type { UploadState, UploadProgress } from '@/types/upload'
import {
  listGalleryImages,
  getPresignedUrl,
  uploadToS3,
  confirmImageUpload,
  deleteGalleryImage,
  reorderGalleryImages,
  updateGallerySettings,
} from '@/services/api'
import { compressImage, formatBytes } from '@/utils/imageCompression'

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Singleton state
const images = ref<GalleryImage[]>([])
const settings = ref<GallerySettings>({
  maxFileSize: 10 * 1024 * 1024, // 10MB default
  maxImages: 50,
  allowedFormats: ALLOWED_MIME_TYPES,
  showGallery: true,
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
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: JPG, PNG, WebP, GIF`,
      }
    }

    // Check file size
    if (file.size > settings.value.maxFileSize) {
      const maxMB = Math.round(settings.value.maxFileSize / (1024 * 1024))
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      }
    }

    // Check if we can upload more
    if (!canUploadMore.value) {
      return {
        valid: false,
        error: `Maximum of ${settings.value.maxImages} images reached`,
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
        settings.value = response.settings
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load images'
    } finally {
      isLoading.value = false
    }
  }

  // Upload a single image
  const uploadImage = async (
    file: File,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    currentWeddingId.value = weddingId
    const fileId = `${file.name}-${Date.now()}`
    const abortController = new AbortController()
    uploadControllers.value.set(fileId, abortController)
    uploadProgress.value.set(fileId, { progress: 0, status: 'compressing' })

    // Step 0: Compress image before upload
    let fileToUpload = file
    let compressionInfo:
      | { originalSize: number; compressedSize: number; savedPercent: number }
      | undefined
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
          `[Gallery] Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${compressionInfo.savedPercent}% saved)`
        )
      }
    } catch (compressionError) {
      console.warn('[Gallery] Compression failed, using original:', compressionError)
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
      // Step 1: Get presigned URL
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
        progress: 30,
        status: 'uploading',
        ...(compressionInfo && { compression: compressionInfo }),
      })

      // Step 2: Upload to S3
      const uploadSuccess = await uploadToS3(
        presignedResponse.uploadUrl,
        fileToUpload,
        abortController.signal
      )
      if (!uploadSuccess) {
        uploadProgress.value.set(fileId, {
          progress: 30,
          status: 'error',
          error: 'Failed to upload file to storage',
          ...(compressionInfo && { compression: compressionInfo }),
        })
        uploadControllers.value.delete(fileId)
        setTimeout(() => uploadProgress.value.delete(fileId), 5000)
        return { success: false, error: 'Failed to upload file to storage' }
      }

      uploadProgress.value.set(fileId, {
        progress: 70,
        status: 'uploading',
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

      // Add the new image to the list
      images.value.push({
        id: confirmResponse.id,
        url: confirmResponse.url,
        filename: confirmResponse.filename,
        mimeType: confirmResponse.mimeType,
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
      maxImages?: number | undefined
    },
    weddingId?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    try {
      currentWeddingId.value = weddingId
      const response = await updateGallerySettings(newSettings, weddingId)
      settings.value = response
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
  }
}
