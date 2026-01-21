<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { useGlobalMusic } from '@/composables/useGlobalMusic'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'
  import type {
    GlobalMusicTrack,
    MusicCategory,
    LicenseType,
    GlobalMusicDeletePreviewResponse,
  } from '@/types/music'
  import { MUSIC_CATEGORIES, LICENSE_TYPES } from '@/types/music'

  const { adminT } = useAdminLanguage()
  const {
    tracks,
    tracksByCategory,
    totalTracks,
    isLoading,
    isUploading,
    isUpdating,
    isDeleting,
    loadError,
    actionError,
    actionSuccess,
    uploadProgress,
    fetchTracks,
    uploadTrack,
    updateTrack,
    getDeletePreview,
    deleteTrack,
    clearMessages,
  } = useGlobalMusic()

  // Modal states
  const showUploadModal = ref(false)
  const showEditModal = ref<GlobalMusicTrack | null>(null)
  const showDeleteModal = ref<{
    track: GlobalMusicTrack
    preview: GlobalMusicDeletePreviewResponse | null
    loadingPreview: boolean
  } | null>(null)

  // Input refs for auto-focus
  const uploadTitleInput = ref<HTMLInputElement | null>(null)
  const editTitleInput = ref<HTMLInputElement | null>(null)

  // Upload form state
  const uploadForm = ref({
    file: null as File | null,
    title: '',
    artist: '',
    duration: 0,
    category: 'romantic' as MusicCategory,
    licenseType: 'free' as LicenseType,
    sourceUrl: '',
    customAttribution: '',
  })
  const uploadFormError = ref('')
  const audioPreviewUrl = ref<string | null>(null)

  // Edit form state
  const editForm = ref({
    title: '',
    artist: '',
    category: 'romantic' as MusicCategory,
    licenseType: 'free' as LicenseType,
    sourceUrl: '',
    customAttribution: '',
  })
  const editFormError = ref('')

  // Delete modal state
  const selectedReplacementId = ref<string | null>(null)

  // Category labels (will be replaced with i18n later)
  const categoryLabels: Record<MusicCategory, string> = {
    romantic: 'Romantic',
    celebration: 'Celebration',
    classical: 'Classical',
    traditional: 'Traditional',
    modern: 'Modern',
    instrumental: 'Instrumental',
    other: 'Other',
  }

  // License labels
  const licenseLabels: Record<LicenseType, string> = {
    free: 'Free',
    cc0: 'CC0 (Public Domain)',
    'cc-by': 'CC-BY (Attribution)',
    'cc-by-sa': 'CC-BY-SA',
    'cc-by-nc': 'CC-BY-NC',
    'royalty-free': 'Royalty Free',
    purchased: 'Purchased',
    custom: 'Custom',
  }

  // License descriptions for tooltips
  const licenseDescriptions: Record<LicenseType, string> = {
    free: 'No restrictions. Can be used freely without attribution. Common for tracks from free music sites.',
    cc0: 'Public Domain. The creator has waived all rights. Use freely without any attribution required.',
    'cc-by':
      'Attribution required. You must credit the creator. Attribution will be shown on the public wedding page.',
    'cc-by-sa':
      'Attribution + Share-Alike. Must credit the creator and share derivatives under the same license.',
    'cc-by-nc':
      'Attribution + Non-Commercial. Must credit the creator. Cannot be used for commercial purposes.',
    'royalty-free':
      'Paid license with no ongoing fees. Typically purchased from stock music sites like AudioJungle.',
    purchased: 'Purchased for specific use. Check the original license terms for usage rights.',
    custom: 'Custom license terms apply. Add source URL for reference.',
  }

  // Computed: get description for selected upload license
  const uploadLicenseDescription = computed(() => licenseDescriptions[uploadForm.value.licenseType])

  // Computed: get description for selected edit license
  const editLicenseDescription = computed(() => licenseDescriptions[editForm.value.licenseType])

  // License badge colors
  const licenseBadgeClass = (type: LicenseType): string => {
    const classes: Record<LicenseType, string> = {
      free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      cc0: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'cc-by': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'cc-by-sa': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'cc-by-nc': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'royalty-free': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      purchased: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      custom: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
    }
    return classes[type]
  }

  // Computed: categories with tracks
  const categoriesWithTracks = computed(() => {
    return (MUSIC_CATEGORIES as readonly MusicCategory[]).filter(
      (cat) => (tracksByCategory.value[cat]?.length ?? 0) > 0
    )
  })

  // Computed: available replacement tracks (excluding the one being deleted)
  const replacementTracks = computed(() => {
    if (!showDeleteModal.value) return []
    return tracks.value.filter((t) => t.id !== showDeleteModal.value!.track.id)
  })

  // Handle ESC key to close modals
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showDeleteModal.value) {
        closeDeleteModal()
      } else if (showEditModal.value) {
        closeEditModal()
      } else if (showUploadModal.value) {
        closeUploadModal()
      }
    }
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle file selection
  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (file) {
      uploadForm.value.file = file
      // Extract title from filename
      uploadForm.value.title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

      // Create audio element to get duration
      if (audioPreviewUrl.value) {
        URL.revokeObjectURL(audioPreviewUrl.value)
      }
      audioPreviewUrl.value = URL.createObjectURL(file)

      const audio = new Audio(audioPreviewUrl.value)
      audio.addEventListener('loadedmetadata', () => {
        uploadForm.value.duration = Math.round(audio.duration)
      })
    }
  }

  // Handle upload submit
  const handleUploadSubmit = async () => {
    uploadFormError.value = ''

    if (!uploadForm.value.file) {
      uploadFormError.value = 'Please select an audio file'
      return
    }
    if (!uploadForm.value.title.trim()) {
      uploadFormError.value = 'Please enter a title'
      return
    }
    if (uploadForm.value.duration <= 0) {
      uploadFormError.value = 'Could not detect audio duration. Please wait a moment.'
      return
    }

    const artistValue = uploadForm.value.artist.trim()
    const sourceUrlValue = uploadForm.value.sourceUrl.trim()
    const customAttributionValue =
      uploadForm.value.licenseType === 'custom' ? uploadForm.value.customAttribution.trim() : ''

    const result = await uploadTrack(uploadForm.value.file, {
      title: uploadForm.value.title.trim(),
      duration: uploadForm.value.duration,
      category: uploadForm.value.category,
      licenseType: uploadForm.value.licenseType,
      ...(artistValue && { artist: artistValue }),
      ...(sourceUrlValue && { sourceUrl: sourceUrlValue }),
      ...(customAttributionValue && { customAttribution: customAttributionValue }),
    })

    if (result.success) {
      closeUploadModal()
    } else {
      uploadFormError.value = result.error ?? 'Failed to upload track'
    }
  }

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!showEditModal.value) return
    editFormError.value = ''

    if (!editForm.value.title.trim()) {
      editFormError.value = 'Title is required'
      return
    }

    const result = await updateTrack(showEditModal.value.id, {
      title: editForm.value.title.trim(),
      artist: editForm.value.artist.trim() || undefined,
      category: editForm.value.category,
      licenseType: editForm.value.licenseType,
      sourceUrl: editForm.value.sourceUrl.trim() || undefined,
      // For custom license, pass the attribution text directly
      attribution:
        editForm.value.licenseType === 'custom'
          ? editForm.value.customAttribution.trim() || undefined
          : undefined,
    })

    if (result.success) {
      closeEditModal()
    } else {
      editFormError.value = result.error ?? 'Failed to update track'
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!showDeleteModal.value) return

    const trackId = showDeleteModal.value.track.id
    const preview = showDeleteModal.value.preview

    // If track is in use, replacement is required
    if (preview?.requiresReplacement && !selectedReplacementId.value) {
      return // Button should be disabled but double-check
    }

    const result = await deleteTrack(
      trackId,
      preview?.requiresReplacement ? (selectedReplacementId.value ?? undefined) : undefined
    )

    if (result.success) {
      closeDeleteModal()
    }
  }

  // Modal helpers
  const openUploadModal = () => {
    showUploadModal.value = true
    nextTick(() => {
      uploadTitleInput.value?.focus()
    })
  }

  const closeUploadModal = () => {
    showUploadModal.value = false
    uploadForm.value = {
      file: null,
      title: '',
      artist: '',
      duration: 0,
      category: 'romantic',
      licenseType: 'free',
      sourceUrl: '',
      customAttribution: '',
    }
    uploadFormError.value = ''
    if (audioPreviewUrl.value) {
      URL.revokeObjectURL(audioPreviewUrl.value)
      audioPreviewUrl.value = null
    }
  }

  const openEditModal = (track: GlobalMusicTrack) => {
    showEditModal.value = track
    editForm.value = {
      title: track.title,
      artist: track.artist ?? '',
      category: track.category,
      licenseType: track.license?.type ?? 'free',
      sourceUrl: track.license?.sourceUrl ?? '',
      customAttribution: track.license?.attribution ?? '',
    }
    editFormError.value = ''
    nextTick(() => {
      editTitleInput.value?.focus()
    })
  }

  const closeEditModal = () => {
    showEditModal.value = null
    editForm.value = {
      title: '',
      artist: '',
      category: 'romantic',
      licenseType: 'free',
      sourceUrl: '',
      customAttribution: '',
    }
    editFormError.value = ''
  }

  const openDeleteModal = async (track: GlobalMusicTrack) => {
    showDeleteModal.value = {
      track,
      preview: null,
      loadingPreview: true,
    }
    selectedReplacementId.value = null

    // Fetch preview
    const result = await getDeletePreview(track.id)
    if (showDeleteModal.value && showDeleteModal.value.track.id === track.id) {
      showDeleteModal.value.loadingPreview = false
      if (result.success && result.preview) {
        showDeleteModal.value.preview = result.preview
      }
    }
  }

  const closeDeleteModal = () => {
    showDeleteModal.value = null
    selectedReplacementId.value = null
  }

  // Handle backdrop click
  const handleBackdropClick = (event: MouseEvent, closeHandler: () => void) => {
    if (event.target === event.currentTarget) {
      closeHandler()
    }
  }

  onMounted(() => {
    fetchTracks()
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    if (audioPreviewUrl.value) {
      URL.revokeObjectURL(audioPreviewUrl.value)
    }
  })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-bold text-charcoal dark:text-dark-text">
          {{ adminT.musicLibrary?.title ?? 'Music Library' }}
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.musicLibrary?.description ?? 'Manage global music tracks for all weddings' }}
        </p>
      </div>
      <button
        type="button"
        class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        @click="openUploadModal"
      >
        + {{ adminT.musicLibrary?.addTrack ?? 'Add Track' }}
      </button>
    </div>

    <!-- Messages -->
    <div
      v-if="actionSuccess"
      class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <p class="font-body text-sm text-green-700 dark:text-green-300">{{ actionSuccess }}</p>
      <button
        type="button"
        class="text-green-600 underline text-sm mt-1 cursor-pointer"
        @click="clearMessages"
      >
        Dismiss
      </button>
    </div>
    <div
      v-if="actionError"
      class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <p class="font-body text-sm text-red-700 dark:text-red-300">{{ actionError }}</p>
      <button
        type="button"
        class="text-red-600 underline text-sm mt-1 cursor-pointer"
        @click="clearMessages"
      >
        Dismiss
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-red-500 mb-4">{{ loadError }}</p>
      <button
        type="button"
        class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
        @click="fetchTracks()"
      >
        Retry
      </button>
    </div>

    <!-- Track List -->
    <div v-else>
      <!-- Empty State -->
      <div
        v-if="totalTracks === 0"
        class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border p-8 text-center"
      >
        <div class="text-4xl mb-4">🎵</div>
        <p class="font-body text-charcoal-light dark:text-dark-text-secondary mb-2">
          {{ adminT.musicLibrary?.noTracksYet ?? 'No tracks in the library yet' }}
        </p>
        <p class="font-body text-sm text-charcoal-light/70 dark:text-dark-text-secondary/70 mb-4">
          {{ adminT.musicLibrary?.uploadFirst ?? 'Upload your first track to get started' }}
        </p>
        <button
          type="button"
          class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
          @click="openUploadModal"
        >
          + {{ adminT.musicLibrary?.addTrack ?? 'Add Track' }}
        </button>
      </div>

      <!-- Tracks by Category -->
      <div v-else class="space-y-6">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{
            interpolate(adminT.musicLibrary?.tracksCount ?? '{count} tracks total', {
              count: totalTracks.toString(),
            })
          }}
        </p>

        <div
          v-for="category in categoriesWithTracks"
          :key="category"
          class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden"
        >
          <!-- Category Header -->
          <div
            class="px-4 py-3 bg-sand/50 dark:bg-dark-bg border-b border-sand-dark dark:border-dark-border"
          >
            <h3 class="font-heading font-medium text-charcoal dark:text-dark-text">
              {{ categoryLabels[category] }}
              <span
                class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary ml-2"
              >
                ({{ tracksByCategory[category]?.length ?? 0 }})
              </span>
            </h3>
          </div>

          <!-- Tracks -->
          <div class="divide-y divide-sand-dark dark:divide-dark-border">
            <div
              v-for="track in tracksByCategory[category]"
              :key="track.id"
              class="p-4 hover:bg-sand/30 dark:hover:bg-dark-bg/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-lg">🎵</span>
                    <h4 class="font-heading font-medium text-charcoal dark:text-dark-text truncate">
                      {{ track.title }}
                    </h4>
                    <!-- License Badge -->
                    <span
                      v-if="track.license?.type"
                      class="px-2 py-0.5 text-xs font-medium rounded-full"
                      :class="licenseBadgeClass(track.license.type)"
                    >
                      {{ licenseLabels[track.license.type] }}
                    </span>
                  </div>
                  <p
                    v-if="track.artist"
                    class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-0.5"
                  >
                    {{ track.artist }}
                  </p>
                  <div
                    class="flex items-center gap-3 mt-1 text-xs text-charcoal-light/70 dark:text-dark-text-secondary/70 font-body"
                  >
                    <span>{{ formatDuration(track.duration) }}</span>
                    <span>•</span>
                    <span>{{ formatFileSize(track.fileSize) }}</span>
                    <span v-if="track.license?.sourceUrl">•</span>
                    <a
                      v-if="track.license?.sourceUrl"
                      :href="track.license.sourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sage hover:underline"
                    >
                      Source
                    </a>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <!-- Audio Preview -->
                  <audio :src="track.url" controls class="h-8 w-32 hidden sm:block"></audio>
                  <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-body text-sage hover:bg-sage/10 rounded-lg transition-colors cursor-pointer"
                    @click="openEditModal(track)"
                  >
                    {{ adminT.common.edit }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-body text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    @click="openDeleteModal(track)"
                  >
                    {{ adminT.common.delete }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showUploadModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick($event, closeUploadModal)"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div
            class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div
              class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between sticky top-0 bg-white dark:bg-dark-bg-secondary"
            >
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ adminT.musicLibrary?.uploadTrack ?? 'Upload Track' }}
              </h3>
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                title="Close (ESC)"
                @click="closeUploadModal"
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
            <form @submit.prevent="handleUploadSubmit" class="p-6 space-y-4">
              <!-- File Input -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  Audio File *
                </label>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg"
                  @change="handleFileSelect"
                />
                <p
                  v-if="uploadForm.file"
                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1"
                >
                  {{ uploadForm.file.name }} ({{ formatFileSize(uploadForm.file.size) }})
                  <span v-if="uploadForm.duration > 0">
                    • {{ formatDuration(uploadForm.duration) }}</span
                  >
                </p>
              </div>

              <!-- Title -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.trackTitle ?? 'Title' }} *
                </label>
                <input
                  ref="uploadTitleInput"
                  v-model="uploadForm.title"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., Perfect"
                />
              </div>

              <!-- Artist -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.artist ?? 'Artist' }}
                </label>
                <input
                  v-model="uploadForm.artist"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., Ed Sheeran"
                />
              </div>

              <!-- Category -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.category ?? 'Category' }} *
                </label>
                <select
                  v-model="uploadForm.category"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                >
                  <option v-for="cat in MUSIC_CATEGORIES" :key="cat" :value="cat">
                    {{ categoryLabels[cat] }}
                  </option>
                </select>
              </div>

              <!-- License Type -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.licenseType ?? 'License Type' }}
                </label>
                <select
                  v-model="uploadForm.licenseType"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                >
                  <option v-for="license in LICENSE_TYPES" :key="license" :value="license">
                    {{ licenseLabels[license] }}
                  </option>
                </select>
                <p
                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1.5 flex items-start gap-1.5"
                >
                  <svg
                    class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-sage"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{{ uploadLicenseDescription }}</span>
                </p>
              </div>

              <!-- Source URL -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.sourceUrl ?? 'Source URL' }}
                </label>
                <input
                  v-model="uploadForm.sourceUrl"
                  type="url"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., https://pixabay.com/music/..."
                />
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
                  {{
                    adminT.musicLibrary?.sourceUrlHint ?? 'Where did you get this track? (optional)'
                  }}
                </p>
              </div>

              <!-- Custom Attribution (only for custom license) -->
              <div v-if="uploadForm.licenseType === 'custom'">
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  Custom Attribution
                </label>
                <input
                  v-model="uploadForm.customAttribution"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., Music by Artist Name"
                />
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
                  This text will be shown on the public wedding page when this track plays.
                </p>
              </div>

              <!-- Upload Progress -->
              <div v-if="isUploading" class="space-y-2">
                <div
                  class="flex justify-between text-sm font-body text-charcoal-light dark:text-dark-text-secondary"
                >
                  <span>Uploading...</span>
                  <span>{{ uploadProgress }}%</span>
                </div>
                <div class="w-full bg-sand dark:bg-dark-bg rounded-full h-2">
                  <div
                    class="bg-sage h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${uploadProgress}%` }"
                  ></div>
                </div>
              </div>

              <!-- Error -->
              <p v-if="uploadFormError" class="font-body text-sm text-red-500">
                {{ uploadFormError }}
              </p>

              <!-- Buttons -->
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                  :disabled="isUploading"
                  @click="closeUploadModal"
                >
                  {{ adminT.common.cancel }}
                </button>
                <button
                  type="submit"
                  :disabled="isUploading || !uploadForm.file"
                  class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{
                    isUploading
                      ? 'Uploading...'
                      : (adminT.musicLibrary?.uploadTrack ?? 'Upload Track')
                  }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Edit Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick($event, closeEditModal)"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div
            class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div
              class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between sticky top-0 bg-white dark:bg-dark-bg-secondary"
            >
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ adminT.musicLibrary?.editTrack ?? 'Edit Track' }}
              </h3>
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                title="Close (ESC)"
                @click="closeEditModal"
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
            <form @submit.prevent="handleEditSubmit" class="p-6 space-y-4">
              <!-- Title -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.trackTitle ?? 'Title' }} *
                </label>
                <input
                  ref="editTitleInput"
                  v-model="editForm.title"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                />
              </div>

              <!-- Artist -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.artist ?? 'Artist' }}
                </label>
                <input
                  v-model="editForm.artist"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                />
              </div>

              <!-- Category -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.category ?? 'Category' }} *
                </label>
                <select
                  v-model="editForm.category"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                >
                  <option v-for="cat in MUSIC_CATEGORIES" :key="cat" :value="cat">
                    {{ categoryLabels[cat] }}
                  </option>
                </select>
              </div>

              <!-- License Type -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.licenseType ?? 'License Type' }}
                </label>
                <select
                  v-model="editForm.licenseType"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                >
                  <option v-for="license in LICENSE_TYPES" :key="license" :value="license">
                    {{ licenseLabels[license] }}
                  </option>
                </select>
                <p
                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1.5 flex items-start gap-1.5"
                >
                  <svg
                    class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-sage"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{{ editLicenseDescription }}</span>
                </p>
              </div>

              <!-- Source URL -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.musicLibrary?.sourceUrl ?? 'Source URL' }}
                </label>
                <input
                  v-model="editForm.sourceUrl"
                  type="url"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., https://pixabay.com/music/..."
                />
              </div>

              <!-- Custom Attribution (only for custom license) -->
              <div v-if="editForm.licenseType === 'custom'">
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  Custom Attribution
                </label>
                <input
                  v-model="editForm.customAttribution"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., Music by Artist Name"
                />
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
                  This text will be shown on the public wedding page when this track plays.
                </p>
              </div>

              <!-- Error -->
              <p v-if="editFormError" class="font-body text-sm text-red-500">
                {{ editFormError }}
              </p>

              <!-- Buttons -->
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                  @click="closeEditModal"
                >
                  {{ adminT.common.cancel }}
                </button>
                <button
                  type="submit"
                  :disabled="isUpdating"
                  class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ isUpdating ? adminT.common.saving : adminT.common.save }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Delete Confirm Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick($event, closeDeleteModal)"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-start gap-4 mb-4">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                  {{ adminT.musicLibrary?.deleteTrack ?? 'Delete Track' }}
                </h3>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
                  "{{ showDeleteModal.track.title }}"
                </p>
              </div>
            </div>

            <!-- Loading preview -->
            <div v-if="showDeleteModal.loadingPreview" class="py-4 text-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sage mx-auto"></div>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-2">
                Checking usage...
              </p>
            </div>

            <!-- Preview loaded -->
            <div v-else-if="showDeleteModal.preview">
              <!-- Not in use -->
              <div v-if="!showDeleteModal.preview.requiresReplacement" class="mb-4">
                <p class="font-body text-sm text-charcoal dark:text-dark-text">
                  {{
                    adminT.musicLibrary?.deleteConfirm ??
                    'Are you sure you want to delete this track?'
                  }}
                </p>
              </div>

              <!-- In use - requires replacement -->
              <div v-else>
                <div
                  class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4"
                >
                  <p class="font-body text-sm text-amber-700 dark:text-amber-300">
                    ⚠️
                    {{
                      interpolate(
                        adminT.musicLibrary?.usedByWeddings ??
                          'This track is used by {count} wedding(s)',
                        { count: showDeleteModal.preview.usageCount.toString() }
                      )
                    }}
                  </p>
                </div>

                <p class="font-body text-sm text-charcoal dark:text-dark-text mb-3">
                  {{ adminT.musicLibrary?.selectReplacement ?? 'Select a replacement track:' }}
                </p>

                <!-- Replacement selector -->
                <select
                  v-model="selectedReplacementId"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage mb-4"
                >
                  <option :value="null" disabled>
                    {{
                      adminT.musicLibrary?.replacementRequired ?? 'Select a replacement track...'
                    }}
                  </option>
                  <option v-for="track in replacementTracks" :key="track.id" :value="track.id">
                    {{ track.title }}{{ track.artist ? ` - ${track.artist}` : '' }} ({{
                      categoryLabels[track.category]
                    }})
                  </option>
                </select>

                <p
                  v-if="replacementTracks.length === 0"
                  class="font-body text-sm text-red-500 mb-4"
                >
                  No other tracks available. Please upload another track first before deleting this
                  one.
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="closeDeleteModal"
              >
                {{ adminT.common.cancel }}
              </button>
              <button
                type="button"
                :disabled="
                  isDeleting ||
                  showDeleteModal.loadingPreview ||
                  (showDeleteModal.preview?.requiresReplacement && !selectedReplacementId) ||
                  (showDeleteModal.preview?.requiresReplacement && replacementTracks.length === 0)
                "
                class="px-4 py-2 bg-red-600 text-white font-body text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                @click="handleDelete"
              >
                {{ isDeleting ? 'Deleting...' : adminT.common.delete }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
