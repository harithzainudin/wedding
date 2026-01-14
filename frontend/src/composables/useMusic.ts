import { ref, computed } from "vue";
import type {
  MusicTrack,
  MusicSettings,
  MusicSettingsUpdateRequest,
} from "@/types/music";
import {
  getMusic,
  getMusicPresignedUrl,
  uploadMusicToS3,
  confirmMusicUpload,
  deleteMusicTrack,
  reorderMusicTracks,
  updateMusicSettings,
} from "@/services/api";

// Allowed MIME types
const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
];

// Singleton state
const tracks = ref<MusicTrack[]>([]);
const settings = ref<MusicSettings>({
  enabled: true,
  autoplay: false,
  volume: 0.3,
  mode: "single",
  shuffle: false,
  loop: true,
  maxFileSize: 20 * 1024 * 1024, // 20MB default
  maxTracks: 20,
  allowedFormats: ALLOWED_AUDIO_MIME_TYPES,
});
const isLoading = ref(false);
const loadError = ref("");
const uploadProgress = ref<Map<string, number>>(new Map());

export function useMusic() {
  // Computed
  const sortedTracks = computed(() => [...tracks.value].sort((a, b) => a.order - b.order));

  const canUploadMore = computed(() => tracks.value.length < settings.value.maxTracks);

  const remainingSlots = computed(() => settings.value.maxTracks - tracks.value.length);

  const selectedTrack = computed(() => {
    if (settings.value.mode === "single" && settings.value.selectedTrackId) {
      return tracks.value.find((t) => t.id === settings.value.selectedTrackId);
    }
    return null;
  });

  // Validate a file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: MP3, M4A, WAV, OGG`,
      };
    }

    // Check file size
    if (file.size > settings.value.maxFileSize) {
      const maxMB = Math.round(settings.value.maxFileSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      };
    }

    // Check if we can upload more
    if (!canUploadMore.value) {
      return {
        valid: false,
        error: `Maximum of ${settings.value.maxTracks} tracks reached`,
      };
    }

    return { valid: true };
  };

  // Fetch all tracks and settings
  const fetchTracks = async (): Promise<void> => {
    isLoading.value = true;
    loadError.value = "";

    try {
      const response = await getMusic();
      tracks.value = response.tracks;
      settings.value = response.settings;
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : "Failed to load music";
    } finally {
      isLoading.value = false;
    }
  };

  // Get audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(audio.src);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  // Upload a single track
  const uploadTrack = async (
    file: File,
    title: string,
    artist?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error ?? "Validation failed" };
    }

    const fileId = `${file.name}-${Date.now()}`;
    uploadProgress.value.set(fileId, 0);

    try {
      // Get audio duration
      const duration = await getAudioDuration(file);
      uploadProgress.value.set(fileId, 10);

      // Step 1: Get presigned URL
      const presignedRequest: {
        filename: string;
        mimeType: string;
        fileSize: number;
        title: string;
        artist?: string;
        duration?: number;
      } = {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        title,
        duration,
      };
      if (artist) {
        presignedRequest.artist = artist;
      }
      const presignedResponse = await getMusicPresignedUrl(presignedRequest);

      uploadProgress.value.set(fileId, 30);

      // Step 2: Upload to S3
      const uploadSuccess = await uploadMusicToS3(presignedResponse.uploadUrl, file);
      if (!uploadSuccess) {
        uploadProgress.value.delete(fileId);
        return { success: false, error: "Failed to upload file to storage" };
      }

      uploadProgress.value.set(fileId, 70);

      // Step 3: Confirm upload
      const confirmRequest: {
        trackId: string;
        s3Key: string;
        filename: string;
        mimeType: string;
        title: string;
        artist?: string;
        duration: number;
      } = {
        trackId: presignedResponse.trackId,
        s3Key: presignedResponse.s3Key,
        filename: file.name,
        mimeType: file.type,
        title,
        duration,
      };
      if (artist) {
        confirmRequest.artist = artist;
      }
      const confirmResponse = await confirmMusicUpload(confirmRequest);

      uploadProgress.value.set(fileId, 100);

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
      });

      // Clean up progress after a delay
      setTimeout(() => {
        uploadProgress.value.delete(fileId);
      }, 1000);

      return { success: true };
    } catch (err) {
      uploadProgress.value.delete(fileId);
      return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
    }
  };

  // Remove a track
  const removeTrack = async (trackId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteMusicTrack(trackId);
      tracks.value = tracks.value.filter((t) => t.id !== trackId);
      // Clear selected track if it was deleted
      if (settings.value.selectedTrackId === trackId) {
        settings.value.selectedTrackId = undefined;
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to delete track" };
    }
  };

  // Update track order
  const updateOrder = async (newOrder: string[]): Promise<{ success: boolean; error?: string }> => {
    // Optimistically update the UI
    const previousTracks = [...tracks.value];
    tracks.value = newOrder
      .map((id, index) => {
        const track = tracks.value.find((t) => t.id === id);
        return track ? { ...track, order: index } : null;
      })
      .filter((track): track is MusicTrack => track !== null);

    try {
      await reorderMusicTracks({ trackIds: newOrder });
      return { success: true };
    } catch (err) {
      // Revert on error
      tracks.value = previousTracks;
      return { success: false, error: err instanceof Error ? err.message : "Failed to reorder tracks" };
    }
  };

  // Update settings
  const saveSettings = async (
    newSettings: MusicSettingsUpdateRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateMusicSettings(newSettings);
      // Update local settings
      Object.assign(settings.value, newSettings);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to update settings" };
    }
  };

  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    tracks: sortedTracks,
    settings,
    isLoading,
    loadError,
    uploadProgress,
    canUploadMore,
    remainingSlots,
    selectedTrack,
    // Methods
    fetchTracks,
    uploadTrack,
    removeTrack,
    updateOrder,
    saveSettings,
    validateFile,
    formatDuration,
    formatFileSize,
  };
}
