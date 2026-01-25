<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
  import { useMusic } from '@/composables/useMusic'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { interpolate } from '@/i18n/translations'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import type { MusicTrack } from '@/types/music'
  import MusicUploader from './MusicUploader.vue'
  import MusicTrackList from './MusicTrackList.vue'
  import MusicSettings from './MusicSettings.vue'
  import DeleteConfirmModal from './DeleteConfirmModal.vue'
  import UploadProgressBar from './UploadProgressBar.vue'
  import MusicLibraryBrowser from './MusicLibraryBrowser.vue'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()

  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const {
    tracks,
    settings,
    isLoading,
    loadError,
    activeUploads,
    canUploadMore,
    remainingSlots,
    fetchTracksAdmin,
    uploadTrack,
    cancelUpload,
    dismissUpload,
    removeTrack,
    updateOrder,
    saveSettings,
    formatDuration,
    formatFileSize,
  } = useMusic()

  const showSettings = ref(false)
  const showLibraryBrowser = ref(false)
  const deleteConfirmId = ref<string | null>(null)
  const isDeleting = ref(false)
  const uploadErrors = ref<{ file: string; error: string }[]>([])

  // Handle track added from library
  const handleTrackAddedFromLibrary = (_track: MusicTrack) => {
    // Track is already added to the server, just need to update local state
    // The useMusic composable should have a method to add track to local state
    // For now, we'll just refetch the tracks to ensure consistency
    fetchTracksAdmin(weddingId.value ?? undefined)
  }

  onMounted(() => {
    fetchTracksAdmin(weddingId.value ?? undefined)
  })

  // Watch for wedding ID changes (user switching between weddings)
  watch(weddingId, (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchTracksAdmin(newId)
    }
  })

  const handleFilesSelected = async (
    files: { file: File; title: string; artist?: string }[]
  ): Promise<void> => {
    uploadErrors.value = []

    for (const { file, title, artist } of files) {
      const result = await uploadTrack(file, title, artist, weddingId.value ?? undefined)
      if (!result.success) {
        uploadErrors.value.push({
          file: file.name,
          error: result.error ?? 'Upload failed',
        })
      }
    }
  }

  const handleReorder = async (newOrder: string[]): Promise<void> => {
    const result = await updateOrder(newOrder, weddingId.value ?? undefined)
    if (!result.success) {
      console.error('Reorder failed:', result.error)
    }
  }

  const handleDeleteClick = (trackId: string): void => {
    deleteConfirmId.value = trackId
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmId.value) return

    const trackIdToDelete = deleteConfirmId.value
    deleteConfirmId.value = null

    await withLoading(
      async () => {
        const result = await removeTrack(trackIdToDelete, weddingId.value ?? undefined)
        if (!result.success) {
          console.error('Delete failed:', result.error)
        }
      },
      {
        message: adminT.value.loadingOverlay.deleting,
        showSuccess: true,
      }
    )
  }

  const handleDeleteCancel = (): void => {
    deleteConfirmId.value = null
  }

  const handleSettingsUpdate = async (newSettings: Record<string, unknown>): Promise<void> => {
    await withLoading(
      async () => {
        const result = await saveSettings(newSettings, weddingId.value ?? undefined)
        if (!result.success) {
          console.error('Settings update failed:', result.error)
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  const handleSelectTrack = async (trackId: string): Promise<void> => {
    // Toggle selection: if clicking the already selected track, deselect it
    const newSelectedId = settings.value.selectedTrackId === trackId ? null : trackId
    await withLoading(
      async () => {
        const result = await saveSettings(
          { selectedTrackId: newSelectedId },
          weddingId.value ?? undefined
        )
        if (!result.success) {
          console.error('Failed to select track:', result.error)
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  const dismissError = (index: number): void => {
    uploadErrors.value.splice(index, 1)
  }

  const getTrackToDelete = (): MusicTrack | undefined => {
    return tracks.value.find((t) => t.id === deleteConfirmId.value)
  }

  // Handle Escape key to close modals
  const handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (showSettings.value) showSettings.value = false
    }
  }

  // Reset body overflow after modal leave animation completes
  const onModalClosed = (): void => {
    document.body.style.overflow = ''
  }

  watch(showSettings, (settingsOpen) => {
    if (settingsOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscapeKey)
      // Note: body overflow is reset in onModalClosed (via @after-leave)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapeKey)
    document.body.style.overflow = ''
  })
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
          {{ adminT.music.title }}
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          {{
            interpolate(adminT.music.tracksCount, { count: tracks.length, max: settings.maxTracks })
          }}
          <span v-if="canUploadMore" class="text-sage">
            {{ interpolate(adminT.music.slotsRemaining, { remaining: remainingSlots }) }}
          </span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Browse Library Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage border border-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
          @click="showLibraryBrowser = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <span>{{ adminT.music?.browseLibrary ?? 'Browse Library' }}</span>
        </button>

        <!-- Settings Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
          @click="showSettings = !showSettings"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{{ adminT.common.settings }}</span>
        </button>
      </div>
    </div>

    <!-- Upload Progress Bar -->
    <UploadProgressBar
      v-if="activeUploads.length > 0"
      :uploads="activeUploads"
      type="music"
      @cancel="cancelUpload"
      @dismiss="dismissUpload"
    />

    <!-- Upload Errors -->
    <div v-if="uploadErrors.length > 0" class="space-y-2">
      <div
        v-for="(error, index) in uploadErrors"
        :key="index"
        class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="font-body text-sm text-red-700 dark:text-red-300">
            <strong>{{ error.file }}:</strong> {{ error.error }}
          </span>
        </div>
        <button
          type="button"
          class="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
          @click="dismissError(index)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      ></div>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.music.loadingMusic }}
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="fetchTracksAdmin(weddingId ?? undefined)"
      >
        {{ adminT.common.tryAgain }}
      </button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Upload Zone -->
      <MusicUploader
        v-if="canUploadMore"
        :max-file-size="settings.maxFileSize"
        :format-file-size="formatFileSize"
        @files-selected="handleFilesSelected"
      />

      <div
        v-else
        class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <p class="font-body text-sm text-amber-700 dark:text-amber-300">
          {{ interpolate(adminT.music.maxReached, { max: settings.maxTracks }) }}
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-if="tracks.length === 0"
        class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border"
      >
        <svg
          class="w-16 h-16 mx-auto text-charcoal-light/30 dark:text-dark-text-secondary/30 mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.music.noTracks }}
        </p>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2">
          {{ adminT.music.uploadFirst }}
        </p>
      </div>

      <!-- Track List -->
      <MusicTrackList
        v-else
        :tracks="tracks"
        :mode="settings.mode"
        :selected-track-id="settings.selectedTrackId"
        :format-duration="formatDuration"
        @reorder="handleReorder"
        @delete="handleDeleteClick"
        @select="handleSelectTrack"
      />
    </div>

    <!-- Settings Modal -->
    <Teleport to="body">
      <Transition name="modal" @after-leave="onModalClosed">
        <div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false">
          <div class="modal-content bg-white dark:bg-dark-bg-secondary">
            <div class="modal-header border-sand-dark dark:border-dark-border">
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ adminT.music.musicSettings }}
              </h3>
              <button
                type="button"
                class="p-2 -m-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="showSettings = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <MusicSettings :settings="settings" @update="handleSettingsUpdate" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="deleteConfirmId"
      :title="adminT.music.deleteTrack"
      :message="
        interpolate(adminT.music.deleteTrackConfirm, { title: getTrackToDelete()?.title || '' })
      "
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />

    <!-- Music Library Browser Modal -->
    <MusicLibraryBrowser
      v-model="showLibraryBrowser"
      :existing-tracks="tracks"
      v-bind="weddingId ? { weddingId } : {}"
      :can-add-more="canUploadMore"
      :max-tracks="settings.maxTracks"
      :current-count="tracks.length"
      @track-added="handleTrackAddedFromLibrary"
    />
  </div>
</template>

<style scoped>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom-width: 1px;
    border-bottom-style: solid;
  }

  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease-out;
  }

  .modal-enter-active .modal-content,
  .modal-leave-active .modal-content {
    transition:
      transform 0.2s ease-out,
      opacity 0.2s ease-out;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-from .modal-content,
  .modal-leave-to .modal-content {
    opacity: 0;
    transform: scale(0.95);
  }
</style>
