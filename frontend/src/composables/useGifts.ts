import { ref, computed } from 'vue'
import type {
  GiftItem,
  GiftSettings,
  GiftReservation,
  CreateGiftRequest,
  UpdateGiftRequest,
} from '@/types/gift'
import type { UploadState, UploadProgress } from '@/types/upload'
import {
  listGifts,
  listGiftsAdmin,
  createGift,
  updateGift,
  deleteGift,
  reorderGifts,
  getGiftPresignedUrl,
  uploadToS3,
  confirmGiftUpload,
  getGiftSettings,
  updateGiftSettings,
  listGiftReservations,
} from '@/services/api'
import { compressImage, formatBytes } from '@/utils/imageCompression'

// Allowed MIME types for gift images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Default settings
const DEFAULT_SETTINGS: GiftSettings = {
  enabled: false,
  maxItems: 50,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ALLOWED_MIME_TYPES,
}

// Singleton state
const gifts = ref<GiftItem[]>([])
const settings = ref<GiftSettings>({ ...DEFAULT_SETTINGS })
const reservations = ref<GiftReservation[]>([])
const reservationSummary = ref({
  totalReservations: 0,
  totalQuantity: 0,
  uniqueGuests: 0,
})
const isLoading = ref(false)
const isLoadingSettings = ref(false)
const isLoadingReservations = ref(false)
const loadError = ref('')
const operationError = ref('')
const isCreating = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const isReordering = ref(false)
const isTogglingEnabled = ref(false)
const uploadProgress = ref<Map<string, UploadState>>(new Map())
const uploadControllers = ref<Map<string, AbortController>>(new Map())

// Multi-tenant context tracking
const currentWeddingSlug = ref<string | null>(null)
const currentWeddingId = ref<string | null>(null)

export function useGifts() {
  // Computed
  const sortedGifts = computed(() => [...gifts.value].sort((a, b) => a.order - b.order))

  const canAddMore = computed(() => gifts.value.length < settings.value.maxItems)

  const remainingSlots = computed(() => settings.value.maxItems - gifts.value.length)

  const summary = computed(() => {
    const total = gifts.value.length
    const totalQuantity = gifts.value.reduce((sum, g) => sum + g.quantityTotal, 0)
    const reservedQuantity = gifts.value.reduce((sum, g) => sum + g.quantityReserved, 0)
    const availableQuantity = totalQuantity - reservedQuantity
    const fullyReserved = gifts.value.filter((g) => g.quantityReserved >= g.quantityTotal).length

    return {
      total,
      totalQuantity,
      reservedQuantity,
      availableQuantity,
      fullyReserved,
    }
  })

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
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const allowedFormats = settings.value.allowedFormats ?? ALLOWED_MIME_TYPES
    if (!allowedFormats.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Allowed: JPG, PNG, WebP',
      }
    }

    if (file.size > settings.value.maxFileSize) {
      const maxMB = Math.round(settings.value.maxFileSize / (1024 * 1024))
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      }
    }

    return { valid: true }
  }

  // Fetch all gifts (public API - uses weddingSlug)
  const fetchGifts = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Track current wedding context
    if (weddingSlug !== undefined) {
      currentWeddingSlug.value = weddingSlug
    }

    try {
      const response = await listGifts(weddingSlug)
      gifts.value = response.gifts
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load gifts'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch all gifts (admin API - uses weddingId)
  const fetchGiftsAdmin = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Track current wedding context
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const response = await listGiftsAdmin(weddingId)
      gifts.value = response.gifts
      // Admin response also includes settings
      if (response.settings) {
        settings.value = response.settings
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load gifts'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch gift settings
  const fetchSettings = async (weddingId?: string): Promise<void> => {
    isLoadingSettings.value = true

    // Track current wedding context
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const response = await getGiftSettings(weddingId)
      settings.value = response
    } catch (err) {
      console.error('Failed to load gift settings:', err)
    } finally {
      isLoadingSettings.value = false
    }
  }

  // Fetch reservations
  const fetchReservations = async (giftId?: string, weddingId?: string): Promise<void> => {
    isLoadingReservations.value = true

    try {
      const response = await listGiftReservations(giftId, weddingId)
      reservations.value = response.reservations
      reservationSummary.value = response.summary
    } catch (err) {
      console.error('Failed to load reservations:', err)
    } finally {
      isLoadingReservations.value = false
    }
  }

  // Create a new gift
  const createGiftItem = async (
    data: CreateGiftRequest,
    weddingId?: string
  ): Promise<{ success: boolean; giftId?: string; error?: string }> => {
    isCreating.value = true
    operationError.value = ''

    try {
      const response = await createGift(data, weddingId)
      // Add to local state
      const newGift: GiftItem = {
        id: response.id,
        name: response.name,
        description: response.description,
        externalLink: response.externalLink,
        priceRange: response.priceRange,
        category: response.category,
        priority: response.priority,
        quantityTotal: response.quantityTotal,
        quantityReserved: response.quantityReserved,
        order: response.order,
        createdAt: response.createdAt,
      }
      if (response.notes) {
        newGift.notes = response.notes
      }
      gifts.value.push(newGift)
      return { success: true, giftId: response.id }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create gift'
      operationError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isCreating.value = false
    }
  }

  // Update an existing gift
  const updateGiftItem = async (
    id: string,
    data: UpdateGiftRequest,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    operationError.value = ''

    try {
      const response = await updateGift(id, data, weddingId)
      // Update local state
      const index = gifts.value.findIndex((g) => g.id === id)
      if (index !== -1) {
        gifts.value[index] = response
      }
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update gift'
      operationError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Delete a gift
  const deleteGiftItem = async (
    id: string,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isDeleting.value = true
    operationError.value = ''

    try {
      await deleteGift(id, weddingId)
      // Remove from local state
      gifts.value = gifts.value.filter((g) => g.id !== id)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete gift'
      operationError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isDeleting.value = false
    }
  }

  // Reorder gifts
  const reorderGiftItems = async (
    giftIds: string[],
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isReordering.value = true
    operationError.value = ''

    try {
      await reorderGifts({ giftIds }, weddingId)
      // Update local state order
      giftIds.forEach((id, index) => {
        const gift = gifts.value.find((g) => g.id === id)
        if (gift) {
          gift.order = index + 1
        }
      })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder gifts'
      operationError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isReordering.value = false
    }
  }

  // Upload gift image
  const uploadGiftImage = async (
    giftId: string,
    file: File,
    weddingId?: string
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
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
          `[Gifts] Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${compressionInfo.savedPercent}% saved)`
        )
      }
    } catch (compressionError) {
      console.warn('[Gifts] Compression failed, using original:', compressionError)
    }

    // Validate the (possibly compressed) file
    const validation = validateFile(fileToUpload)
    if (!validation.valid) {
      uploadProgress.value.delete(fileId)
      uploadControllers.value.delete(fileId)
      return { success: false, error: validation.error ?? 'Validation failed' }
    }

    uploadProgress.value.set(fileId, {
      progress: 10,
      status: 'uploading',
      ...(compressionInfo && { compression: compressionInfo }),
    })

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await getGiftPresignedUrl(
        {
          filename: fileToUpload.name,
          mimeType: fileToUpload.type,
          fileSize: fileToUpload.size,
          giftId,
        },
        weddingId
      )

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
      const confirmResponse = await confirmGiftUpload(
        {
          giftId: presignedResponse.giftId,
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

      // Update local state
      const gift = gifts.value.find((g) => g.id === giftId)
      if (gift) {
        gift.imageUrl = confirmResponse.imageUrl
      }

      // Clean up after a short delay
      setTimeout(() => uploadProgress.value.delete(fileId), 2000)

      return { success: true, imageUrl: confirmResponse.imageUrl }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        uploadProgress.value.set(fileId, {
          progress: 0,
          status: 'error',
          error: 'Upload cancelled',
        })
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        uploadProgress.value.set(fileId, {
          progress: 0,
          status: 'error',
          error: errorMessage,
        })
      }
      uploadControllers.value.delete(fileId)
      setTimeout(() => uploadProgress.value.delete(fileId), 5000)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      }
    }
  }

  // Cancel upload
  const cancelUpload = (fileId: string): void => {
    const controller = uploadControllers.value.get(fileId)
    if (controller) {
      controller.abort()
      uploadControllers.value.delete(fileId)
    }
  }

  // Update settings
  const updateSettings = async (
    data: Partial<GiftSettings>,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await updateGiftSettings(data, weddingId)
      settings.value = response
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update settings',
      }
    }
  }

  // Toggle enabled
  const toggleEnabled = async (
    weddingId?: string
  ): Promise<{
    success: boolean
    error?: string
  }> => {
    isTogglingEnabled.value = true
    try {
      return await updateSettings({ enabled: !settings.value.enabled }, weddingId)
    } finally {
      isTogglingEnabled.value = false
    }
  }

  return {
    // State
    gifts: sortedGifts,
    settings,
    reservations,
    reservationSummary,
    isLoading,
    isLoadingSettings,
    isLoadingReservations,
    loadError,
    operationError,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering,
    isTogglingEnabled,
    activeUploads,

    // Multi-tenant context
    currentWeddingSlug,
    currentWeddingId,

    // Computed
    canAddMore,
    remainingSlots,
    summary,

    // Methods
    fetchGifts,
    fetchGiftsAdmin,
    fetchSettings,
    fetchReservations,
    createGiftItem,
    updateGiftItem,
    deleteGiftItem,
    reorderGiftItems,
    uploadGiftImage,
    cancelUpload,
    updateSettings,
    toggleEnabled,
    validateFile,
  }
}
