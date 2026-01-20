import { ref, computed } from 'vue'
import type {
  GlobalMusicTrack,
  MusicCategory,
  GlobalMusicPresignedUrlRequest,
  GlobalMusicConfirmRequest,
  GlobalMusicUpdateRequest,
  GlobalMusicDeletePreviewResponse,
} from '@/types/music'
import {
  listGlobalMusic as apiListGlobalMusic,
  getGlobalMusicPresignedUrl,
  confirmGlobalMusicUpload,
  updateGlobalMusic as apiUpdateGlobalMusic,
  getGlobalMusicDeletePreview as apiGetDeletePreview,
  deleteGlobalMusic as apiDeleteGlobalMusic,
  reorderGlobalMusic as apiReorderGlobalMusic,
} from '@/services/api'

// Singleton state
const tracks = ref<GlobalMusicTrack[]>([])
const isLoading = ref(false)
const isUploading = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const isReordering = ref(false)
const loadError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actionSuccess = ref<string | null>(null)
const uploadProgress = ref<number>(0)

export function useGlobalMusic() {
  // Computed: group tracks by category
  const tracksByCategory = computed(() => {
    const grouped: Partial<Record<MusicCategory, GlobalMusicTrack[]>> = {}
    for (const track of tracks.value) {
      if (!grouped[track.category]) {
        grouped[track.category] = []
      }
      grouped[track.category]!.push(track)
    }
    // Sort tracks within each category by order
    for (const category of Object.keys(grouped) as MusicCategory[]) {
      grouped[category]!.sort((a, b) => a.order - b.order)
    }
    return grouped
  })

  // Computed: total track count
  const totalTracks = computed(() => tracks.value.length)

  // Fetch all global music tracks
  const fetchTracks = async (category?: MusicCategory): Promise<void> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await apiListGlobalMusic(category)
      tracks.value = response.tracks
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load music library'
    } finally {
      isLoading.value = false
    }
  }

  // Upload a new track
  const uploadTrack = async (
    file: File,
    metadata: {
      title: string
      artist?: string
      duration: number
      category: MusicCategory
      licenseType?: GlobalMusicPresignedUrlRequest['licenseType']
      sourceUrl?: string
      customAttribution?: string // For custom license type
    }
  ): Promise<{ success: boolean; track?: GlobalMusicTrack; error?: string }> => {
    isUploading.value = true
    uploadProgress.value = 0
    actionError.value = null
    actionSuccess.value = null

    try {
      // Step 1: Get presigned URL
      uploadProgress.value = 10
      const presignedRequest: GlobalMusicPresignedUrlRequest = {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        title: metadata.title,
        category: metadata.category,
        ...(metadata.artist && { artist: metadata.artist }),
        ...(metadata.duration && { duration: metadata.duration }),
        ...(metadata.licenseType && { licenseType: metadata.licenseType }),
        ...(metadata.sourceUrl && { sourceUrl: metadata.sourceUrl }),
        ...(metadata.customAttribution && { customAttribution: metadata.customAttribution }),
      }

      const presignedResponse = await getGlobalMusicPresignedUrl(presignedRequest)
      uploadProgress.value = 20

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(presignedResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage')
      }
      uploadProgress.value = 80

      // Step 3: Confirm upload
      const confirmRequest: GlobalMusicConfirmRequest = {
        trackId: presignedResponse.trackId,
        s3Key: presignedResponse.s3Key,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        title: metadata.title,
        duration: metadata.duration,
        category: metadata.category,
        ...(metadata.artist && { artist: metadata.artist }),
        ...(metadata.licenseType && { licenseType: metadata.licenseType }),
        ...(metadata.sourceUrl && { sourceUrl: metadata.sourceUrl }),
        ...(metadata.customAttribution && { customAttribution: metadata.customAttribution }),
      }

      const track = await confirmGlobalMusicUpload(confirmRequest)
      uploadProgress.value = 100

      // Add to local list
      tracks.value.push(track)
      // Re-sort by category and order
      tracks.value.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.order - b.order
      })

      actionSuccess.value = `Track "${track.title}" uploaded successfully!`
      return { success: true, track }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload track'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  // Update track metadata
  const updateTrack = async (
    trackId: string,
    data: GlobalMusicUpdateRequest
  ): Promise<{ success: boolean; track?: GlobalMusicTrack; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const updatedTrack = await apiUpdateGlobalMusic(trackId, data)

      // Update in local list
      const index = tracks.value.findIndex((t) => t.id === trackId)
      if (index !== -1) {
        tracks.value[index] = updatedTrack
        // Re-sort if category changed
        if (data.category) {
          tracks.value.sort((a, b) => {
            if (a.category !== b.category) {
              return a.category.localeCompare(b.category)
            }
            return a.order - b.order
          })
        }
      }

      actionSuccess.value = `Track "${updatedTrack.title}" updated successfully!`
      return { success: true, track: updatedTrack }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update track'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Get delete preview (usage check)
  const getDeletePreview = async (
    trackId: string
  ): Promise<{ success: boolean; preview?: GlobalMusicDeletePreviewResponse; error?: string }> => {
    try {
      const preview = await apiGetDeletePreview(trackId)
      return { success: true, preview }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get delete preview'
      return { success: false, error: errorMessage }
    }
  }

  // Delete a track
  const deleteTrack = async (
    trackId: string,
    replacementTrackId?: string
  ): Promise<{ success: boolean; replacedCount?: number; error?: string }> => {
    isDeleting.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const deletedTrack = tracks.value.find((t) => t.id === trackId)
      const response = await apiDeleteGlobalMusic(
        trackId,
        replacementTrackId ? { replacementTrackId } : undefined
      )

      // Remove from local list
      tracks.value = tracks.value.filter((t) => t.id !== trackId)

      const message = response.replacedCount
        ? `Track "${deletedTrack?.title ?? trackId}" deleted. ${response.replacedCount} wedding(s) updated to use replacement track.`
        : `Track "${deletedTrack?.title ?? trackId}" deleted successfully!`

      actionSuccess.value = message
      return {
        success: true,
        ...(response.replacedCount !== undefined && { replacedCount: response.replacedCount }),
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete track'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isDeleting.value = false
    }
  }

  // Reorder tracks within a category
  const reorderTracks = async (
    category: MusicCategory,
    trackIds: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    isReordering.value = true
    actionError.value = null

    // Optimistic update
    const previousTracks = [...tracks.value]
    const categoryTracks = tracks.value.filter((t) => t.category === category)
    const trackMap = new Map(categoryTracks.map((t) => [t.id, t]))

    // Update order based on new trackIds order
    trackIds.forEach((id, index) => {
      const track = trackMap.get(id)
      if (track) {
        track.order = index
      }
    })

    // Re-sort local tracks
    tracks.value.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.order - b.order
    })

    try {
      await apiReorderGlobalMusic({ category, trackIds })
      return { success: true }
    } catch (err) {
      // Rollback on error
      tracks.value = previousTracks
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder tracks'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isReordering.value = false
    }
  }

  // Get tracks for a specific category
  const getTracksByCategory = (category: MusicCategory): GlobalMusicTrack[] => {
    return tracksByCategory.value[category] ?? []
  }

  // Get a track by ID
  const getTrackById = (trackId: string): GlobalMusicTrack | undefined => {
    return tracks.value.find((t) => t.id === trackId)
  }

  // Clear messages
  const clearMessages = (): void => {
    actionError.value = null
    actionSuccess.value = null
    loadError.value = null
  }

  // Reset state (useful when leaving the page)
  const resetState = (): void => {
    tracks.value = []
    isLoading.value = false
    isUploading.value = false
    isUpdating.value = false
    isDeleting.value = false
    isReordering.value = false
    loadError.value = null
    actionError.value = null
    actionSuccess.value = null
    uploadProgress.value = 0
  }

  return {
    // State
    tracks,
    tracksByCategory,
    totalTracks,
    isLoading,
    isUploading,
    isUpdating,
    isDeleting,
    isReordering,
    loadError,
    actionError,
    actionSuccess,
    uploadProgress,

    // Actions
    fetchTracks,
    uploadTrack,
    updateTrack,
    getDeletePreview,
    deleteTrack,
    reorderTracks,
    getTracksByCategory,
    getTrackById,
    clearMessages,
    resetState,
  }
}
