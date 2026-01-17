import { ref, computed } from 'vue'
import type { ParkingImage } from '@/types/venue'
import type { UploadState, UploadProgress } from '@/types/upload'
import {
  listParkingImages,
  getParkingPresignedUrl,
  uploadToS3,
  confirmParkingUpload,
  deleteParkingImage,
  reorderParkingImages,
} from '@/services/api'
import { compressImage, formatBytes } from '@/utils/imageCompression'

// Allowed MIME types for parking images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PARKING_IMAGES = 5

// Singleton state
const images = ref<ParkingImage[]>([])
const isLoading = ref(false)
const loadError = ref('')
const uploadProgress = ref<Map<string, UploadState>>(new Map())
const uploadControllers = ref<Map<string, AbortController>>(new Map())
const currentWeddingSlug = ref<string | null>(null)
const currentWeddingId = ref<string | null>(null)

export function useParkingImages() {
  /**
   * Set the wedding context for this composable
   * @param weddingSlug - Wedding slug for public routes
   * @param weddingId - Wedding ID for admin routes
   */
  const setWeddingContext = (weddingSlug: string, weddingId: string): void => {
    currentWeddingSlug.value = weddingSlug
    currentWeddingId.value = weddingId
  }

  // Computed
  const sortedImages = computed(() => [...images.value].sort((a, b) => a.order - b.order))

  const canUploadMore = computed(() => images.value.length < MAX_PARKING_IMAGES)

  const remainingSlots = computed(() => MAX_PARKING_IMAGES - images.value.length)

  // Computed property to expose uploads as array for UI components
  const activeUploads = computed<UploadProgress[]>(() => {
    const uploads: UploadProgress[] = []
    uploadProgress.value.forEach((state, fileId) => {
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
        error: `Invalid file type. Allowed: JPG, PNG, WebP`,
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      }
    }

    // Check if we can upload more
    if (!canUploadMore.value) {
      return {
        valid: false,
        error: `Maximum of ${MAX_PARKING_IMAGES} parking images reached`,
      }
    }

    return { valid: true }
  }

  // Fetch all parking images
  const fetchImages = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    const slug = weddingSlug ?? currentWeddingSlug.value
    if (!slug) {
      loadError.value = 'Wedding context not set'
      isLoading.value = false
      return
    }

    try {
      const response = await listParkingImages(slug)
      images.value = response.images
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load parking images'
    } finally {
      isLoading.value = false
    }
  }

  // Upload a single image
  const uploadImage = async (
    file: File,
    caption?: string,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    const id = weddingId ?? currentWeddingId.value
    if (!id) {
      return { success: false, error: 'Wedding context not set' }
    }

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
          `[Parking] Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${compressionInfo.savedPercent}% saved)`
        )
      }
    } catch (compressionError) {
      console.warn('[Parking] Compression failed, using original:', compressionError)
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
      compression: compressionInfo,
    })

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await getParkingPresignedUrl(
        {
          filename: fileToUpload.name,
          mimeType: fileToUpload.type,
          fileSize: fileToUpload.size,
          ...(caption ? { caption } : {}),
        },
        id
      )

      // Check if cancelled
      if (abortController.signal.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError')
      }

      uploadProgress.value.set(fileId, {
        progress: 30,
        status: 'uploading',
        compression: compressionInfo,
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
          compression: compressionInfo,
        })
        uploadControllers.value.delete(fileId)
        setTimeout(() => uploadProgress.value.delete(fileId), 5000)
        return { success: false, error: 'Failed to upload file to storage' }
      }

      uploadProgress.value.set(fileId, {
        progress: 70,
        status: 'uploading',
        compression: compressionInfo,
      })

      // Step 3: Confirm upload
      const confirmResponse = await confirmParkingUpload(
        {
          imageId: presignedResponse.imageId,
          s3Key: presignedResponse.s3Key,
          filename: fileToUpload.name,
          mimeType: fileToUpload.type,
          ...(caption ? { caption } : {}),
        },
        id
      )

      uploadProgress.value.set(fileId, {
        progress: 100,
        status: 'completed',
        compression: compressionInfo,
      })
      uploadControllers.value.delete(fileId)

      // Add the new image to the list
      images.value.push(confirmResponse)

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
    const id = weddingId ?? currentWeddingId.value
    if (!id) {
      return { success: false, error: 'Wedding context not set' }
    }

    try {
      await deleteParkingImage(imageId, id)
      images.value = images.value.filter((img) => img.id !== imageId)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete parking image',
      }
    }
  }

  // Update image order
  const updateOrder = async (
    newOrder: string[],
    weddingId?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    const id = weddingId ?? currentWeddingId.value
    if (!id) {
      return { success: false, error: 'Wedding context not set' }
    }

    // Optimistically update the UI
    const previousImages = [...images.value]
    images.value = newOrder
      .map((imageId, index) => {
        const img = images.value.find((i) => i.id === imageId)
        return img ? { ...img, order: index + 1 } : null
      })
      .filter((img): img is ParkingImage => img !== null)

    try {
      await reorderParkingImages(newOrder, id)
      return { success: true }
    } catch (err) {
      // Revert on error
      images.value = previousImages
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder parking images',
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
    isLoading,
    loadError,
    uploadProgress,
    activeUploads,
    canUploadMore,
    remainingSlots,
    maxImages: MAX_PARKING_IMAGES,
    maxFileSize: MAX_FILE_SIZE,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    setWeddingContext,
    fetchImages,
    uploadImage,
    cancelUpload,
    dismissUpload,
    removeImage,
    updateOrder,
    validateFile,
    formatFileSize,
  }
}
