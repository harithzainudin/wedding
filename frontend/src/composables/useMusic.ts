import { ref, computed } from 'vue'
import type { MusicTrack, MusicSettings, MusicSettingsUpdateRequest } from '@/types/music'
import type { UploadState, UploadProgress } from '@/types/upload'
import {
  getMusic,
  getMusicAdmin,
  getMusicPresignedUrl,
  uploadToS3WithProgress,
  confirmMusicUpload,
  deleteMusicTrack,
  reorderMusicTracks,
  updateMusicSettings,
  addYouTubeTrack as addYouTubeTrackApi,
} from '@/services/api'

// Allowed MIME types
const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
]

// Singleton state
const tracks = ref<MusicTrack[]>([])
const settings = ref<MusicSettings>({
  enabled: true,
  autoplay: false,
  volume: 0.3,
  mode: 'single',
  shuffle: false,
  loop: true,
  maxFileSize: 20 * 1024 * 1024, // 20MB default
  maxTracks: 20,
  allowedFormats: ALLOWED_AUDIO_MIME_TYPES,
})
const isLoading = ref(false)
const loadError = ref('')
const uploadProgress = ref<Map<string, UploadState>>(new Map())
const uploadControllers = ref<Map<string, AbortController>>(new Map())

// Multi-tenant context tracking
const currentWeddingSlug = ref<string | undefined>()
const currentWeddingId = ref<string | undefined>()

export function useMusic() {
  // Computed
  const sortedTracks = computed(() => [...tracks.value].sort((a, b) => a.order - b.order))

  const canUploadMore = computed(() => tracks.value.length < settings.value.maxTracks)

  const remainingSlots = computed(() => settings.value.maxTracks - tracks.value.length)

  const selectedTrack = computed(() => {
    if (settings.value.mode === 'single' && settings.value.selectedTrackId) {
      return tracks.value.find((t) => t.id === settings.value.selectedTrackId)
    }
    return null
  })

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
      uploads.push(upload)
    })
    return uploads
  })

  // Validate a file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: MP3, M4A, WAV, OGG`,
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
        error: `Maximum of ${settings.value.maxTracks} tracks reached`,
      }
    }

    return { valid: true }
  }

  // Fetch all tracks and settings (public API - uses weddingSlug)
  const fetchTracks = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Update context tracking
    currentWeddingSlug.value = weddingSlug

    try {
      const response = await getMusic(weddingSlug)
      tracks.value = response.tracks
      settings.value = response.settings
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load music'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch all tracks and settings (admin API - uses weddingId)
  const fetchTracksAdmin = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Update context tracking
    currentWeddingId.value = weddingId

    try {
      const response = await getMusicAdmin(weddingId)
      tracks.value = response.tracks
      settings.value = response.settings
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load music'
    } finally {
      isLoading.value = false
    }
  }

  // Get audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration))
        URL.revokeObjectURL(audio.src)
      }
      audio.onerror = () => {
        resolve(0)
        URL.revokeObjectURL(audio.src)
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  // Upload a single track
  const uploadTrack = async (
    file: File,
    title: string,
    artist?: string,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error ?? 'Validation failed' }
    }

    // Update context tracking
    currentWeddingId.value = weddingId

    const fileId = `${file.name}-${Date.now()}`
    const abortController = new AbortController()
    uploadControllers.value.set(fileId, abortController)
    uploadProgress.value.set(fileId, { progress: 0, status: 'uploading' })

    try {
      // Get audio duration
      const duration = await getAudioDuration(file)

      // Check if cancelled
      if (abortController.signal.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError')
      }

      uploadProgress.value.set(fileId, { progress: 10, status: 'uploading' })

      // Step 1: Get presigned URL (10-15%)
      const presignedRequest: {
        filename: string
        mimeType: string
        fileSize: number
        title: string
        artist?: string
        duration?: number
      } = {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        title,
        duration,
      }
      if (artist) {
        presignedRequest.artist = artist
      }
      const presignedResponse = await getMusicPresignedUrl(presignedRequest, weddingId)

      // Check if cancelled
      if (abortController.signal.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError')
      }

      uploadProgress.value.set(fileId, { progress: 15, status: 'uploading' })

      // Step 2: Upload to S3 with real progress tracking (15-90%)
      // Progress callback maps 0-100% of S3 upload to 15-90% of total progress
      const handleS3Progress = (s3Progress: number) => {
        const mappedProgress = 15 + Math.round((s3Progress / 100) * 75)
        uploadProgress.value.set(fileId, {
          progress: mappedProgress,
          status: 'uploading',
        })
      }

      const uploadSuccess = await uploadToS3WithProgress(
        presignedResponse.uploadUrl,
        file,
        handleS3Progress,
        abortController.signal
      )
      if (!uploadSuccess) {
        uploadProgress.value.set(fileId, {
          progress: 15,
          status: 'error',
          error: 'Failed to upload file to storage',
        })
        uploadControllers.value.delete(fileId)
        setTimeout(() => uploadProgress.value.delete(fileId), 5000)
        return { success: false, error: 'Failed to upload file to storage' }
      }

      uploadProgress.value.set(fileId, { progress: 90, status: 'confirming' })

      // Step 3: Confirm upload
      const confirmRequest: {
        trackId: string
        s3Key: string
        filename: string
        mimeType: string
        title: string
        artist?: string
        duration: number
      } = {
        trackId: presignedResponse.trackId,
        s3Key: presignedResponse.s3Key,
        filename: file.name,
        mimeType: file.type,
        title,
        duration,
      }
      if (artist) {
        confirmRequest.artist = artist
      }
      const confirmResponse = await confirmMusicUpload(confirmRequest, weddingId)

      uploadProgress.value.set(fileId, { progress: 100, status: 'completed' })
      uploadControllers.value.delete(fileId)

      // Add the new track to the list
      tracks.value.push({
        id: confirmResponse.id,
        title: confirmResponse.title,
        artist: confirmResponse.artist,
        duration: confirmResponse.duration,
        filename: confirmResponse.filename,
        url: confirmResponse.url,
        mimeType: confirmResponse.mimeType,
        fileSize: 0,
        order: confirmResponse.order,
        source: confirmResponse.source,
        uploadedAt: confirmResponse.uploadedAt,
        uploadedBy: confirmResponse.uploadedBy,
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

  // Remove a track
  const removeTrack = async (
    trackId: string,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Update context tracking
    currentWeddingId.value = weddingId

    try {
      await deleteMusicTrack(trackId, weddingId)
      tracks.value = tracks.value.filter((t) => t.id !== trackId)
      // Clear selected track if it was deleted
      if (settings.value.selectedTrackId === trackId) {
        settings.value.selectedTrackId = undefined
      }
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete track',
      }
    }
  }

  // Update track order
  const updateOrder = async (
    newOrder: string[],
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Update context tracking
    currentWeddingId.value = weddingId

    // Optimistically update the UI
    const previousTracks = [...tracks.value]
    tracks.value = newOrder
      .map((id, index) => {
        const track = tracks.value.find((t) => t.id === id)
        return track ? { ...track, order: index } : null
      })
      .filter((track): track is MusicTrack => track !== null)

    try {
      await reorderMusicTracks({ trackIds: newOrder }, weddingId)
      return { success: true }
    } catch (err) {
      // Revert on error
      tracks.value = previousTracks
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder tracks',
      }
    }
  }

  // Update settings
  const saveSettings = async (
    newSettings: MusicSettingsUpdateRequest,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Update context tracking
    currentWeddingId.value = weddingId

    try {
      await updateMusicSettings(newSettings, weddingId)
      // Update local settings
      Object.assign(settings.value, newSettings)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update settings',
      }
    }
  }

  // Add a YouTube track
  const addYouTubeTrack = async (
    youtubeUrl: string,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Check if we can add more tracks
    if (!canUploadMore.value) {
      return {
        success: false,
        error: `Maximum of ${settings.value.maxTracks} tracks reached`,
      }
    }

    // Update context tracking
    currentWeddingId.value = weddingId

    try {
      const response = await addYouTubeTrackApi(youtubeUrl, weddingId)

      // Add the new track to the list
      tracks.value.push({
        id: response.id,
        title: response.title,
        artist: response.artist,
        duration: response.duration,
        filename: response.filename,
        url: response.url,
        mimeType: response.mimeType,
        fileSize: response.fileSize,
        order: response.order,
        source: response.source,
        externalId: response.externalId,
        externalUrl: response.externalUrl,
        thumbnailUrl: response.thumbnailUrl,
        uploadedAt: response.uploadedAt,
        uploadedBy: response.uploadedBy,
      })

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add YouTube track',
      }
    }
  }

  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return {
    tracks: sortedTracks,
    settings,
    isLoading,
    loadError,
    uploadProgress,
    activeUploads,
    canUploadMore,
    remainingSlots,
    selectedTrack,
    // Multi-tenant context
    currentWeddingSlug,
    currentWeddingId,
    // Methods
    fetchTracks,
    fetchTracksAdmin,
    uploadTrack,
    cancelUpload,
    dismissUpload,
    removeTrack,
    updateOrder,
    saveSettings,
    addYouTubeTrack,
    validateFile,
    formatDuration,
    formatFileSize,
  }
}
