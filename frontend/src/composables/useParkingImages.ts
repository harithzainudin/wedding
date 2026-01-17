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

export function useParkingImages() {
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
  const fetchImages = async (): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    try {
      const response = await listParkingImages()
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
    caption?: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const fileId = `${file.name}-${Date.now()}`
    const abortController = new AbortController()
    uploadControllers.value.set(fileId, abortController)
    uploadProgress.value.set(fileId, { progress: 0, status: 'uploading' })

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await getParkingPresignedUrl({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        caption,
      })

      // Check if cancelled
      if (abortController.signal.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError')
      }

      uploadProgress.value.set(fileId, { progress: 30, status: 'uploading' })

      // Step 2: Upload to S3
      const uploadSuccess = await uploadToS3(
        presignedResponse.uploadUrl,
        file,
        abortController.signal
      )
      if (!uploadSuccess) {
        uploadProgress.value.set(fileId, {
          progress: 30,
          status: 'error',
          error: 'Failed to upload file to storage',
        })
        uploadControllers.value.delete(fileId)
        setTimeout(() => uploadProgress.value.delete(fileId), 5000)
        return { success: false, error: 'Failed to upload file to storage' }
      }

      uploadProgress.value.set(fileId, { progress: 70, status: 'uploading' })

      // Step 3: Confirm upload
      const confirmResponse = await confirmParkingUpload({
        imageId: presignedResponse.imageId,
        s3Key: presignedResponse.s3Key,
        filename: file.name,
        mimeType: file.type,
        caption,
      })

      uploadProgress.value.set(fileId, { progress: 100, status: 'completed' })
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
    imageId: string
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    try {
      await deleteParkingImage(imageId)
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
    newOrder: string[]
  ): Promise<{ success: boolean; error?: string | undefined }> => {
    // Optimistically update the UI
    const previousImages = [...images.value]
    images.value = newOrder
      .map((id, index) => {
        const img = images.value.find((i) => i.id === id)
        return img ? { ...img, order: index + 1 } : null
      })
      .filter((img): img is ParkingImage => img !== null)

    try {
      await reorderParkingImages(newOrder)
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
