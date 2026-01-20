<script setup lang="ts">
  import { ref, computed, onUnmounted, watch } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { listMusicLibrary, addMusicFromLibrary } from '@/services/api'
  import type { GlobalMusicTrack, MusicCategory, MusicTrack } from '@/types/music'
  import { MUSIC_CATEGORIES } from '@/types/music'

  const props = defineProps<{
    modelValue: boolean
    existingTracks: MusicTrack[]
    weddingId?: string
    canAddMore: boolean
    maxTracks: number
    currentCount: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'trackAdded', track: MusicTrack): void
  }>()

  const { adminT } = useAdminLanguage()

  // State
  const libraryTracks = ref<GlobalMusicTrack[]>([])
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)
  const isAdding = ref<string | null>(null) // track ID being added
  const addError = ref<string | null>(null)
  const addSuccess = ref<string | null>(null)
  const selectedCategory = ref<MusicCategory | 'all'>('all')
  const playingTrackId = ref<string | null>(null)
  const audioRef = ref<HTMLAudioElement | null>(null)

  // Category labels
  const categoryLabels: Record<MusicCategory | 'all', string> = {
    all: 'All Categories',
    romantic: 'Romantic',
    celebration: 'Celebration',
    classical: 'Classical',
    traditional: 'Traditional',
    modern: 'Modern',
    instrumental: 'Instrumental',
    other: 'Other',
  }

  // License labels
  const licenseLabels: Record<string, string> = {
    free: 'Free',
    cc0: 'CC0',
    'cc-by': 'CC-BY',
    'cc-by-sa': 'CC-BY-SA',
    'cc-by-nc': 'CC-BY-NC',
    'royalty-free': 'Royalty Free',
    purchased: 'Purchased',
    custom: 'Custom',
  }

  // Computed: already added track IDs
  const addedTrackIds = computed(() => {
    return new Set(props.existingTracks.filter((t) => t.globalMusicId).map((t) => t.globalMusicId))
  })

  // Computed: filtered tracks by category
  const filteredTracks = computed(() => {
    if (selectedCategory.value === 'all') {
      return libraryTracks.value
    }
    return libraryTracks.value.filter((t) => t.category === selectedCategory.value)
  })

  // Computed: tracks grouped by category
  const tracksByCategory = computed(() => {
    const grouped: Partial<Record<MusicCategory, GlobalMusicTrack[]>> = {}
    for (const track of filteredTracks.value) {
      if (!grouped[track.category]) {
        grouped[track.category] = []
      }
      grouped[track.category]!.push(track)
    }
    return grouped
  })

  // Computed: categories with tracks
  const categoriesWithTracks = computed(() => {
    return (MUSIC_CATEGORIES as readonly MusicCategory[]).filter(
      (cat) => (tracksByCategory.value[cat]?.length ?? 0) > 0
    )
  })

  // Check if a track is already added
  const isTrackAdded = (trackId: string): boolean => {
    return addedTrackIds.value.has(trackId)
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Fetch library tracks
  const fetchLibrary = async () => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await listMusicLibrary()
      libraryTracks.value = response.tracks
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load music library'
    } finally {
      isLoading.value = false
    }
  }

  // Add track from library
  const handleAddTrack = async (track: GlobalMusicTrack) => {
    if (isTrackAdded(track.id) || !props.canAddMore) return

    isAdding.value = track.id
    addError.value = null
    addSuccess.value = null

    try {
      const response = await addMusicFromLibrary(track.id, props.weddingId)

      // Emit the newly added track
      const newTrack: MusicTrack = {
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
        globalMusicId: response.globalMusicId,
        license: response.license,
        attribution: response.attribution,
        uploadedAt: response.uploadedAt,
        uploadedBy: response.uploadedBy,
      }

      emit('trackAdded', newTrack)
      addSuccess.value = `"${track.title}" added to your wedding!`

      // Clear success message after 3 seconds
      setTimeout(() => {
        addSuccess.value = null
      }, 3000)
    } catch (err) {
      addError.value = err instanceof Error ? err.message : 'Failed to add track'
    } finally {
      isAdding.value = null
    }
  }

  // Toggle audio preview
  const togglePreview = (track: GlobalMusicTrack) => {
    if (playingTrackId.value === track.id) {
      // Stop playing
      if (audioRef.value) {
        audioRef.value.pause()
        audioRef.value.currentTime = 0
      }
      playingTrackId.value = null
    } else {
      // Start playing
      if (audioRef.value) {
        audioRef.value.src = track.url
        audioRef.value.play()
      }
      playingTrackId.value = track.id
    }
  }

  // Handle audio ended
  const handleAudioEnded = () => {
    playingTrackId.value = null
  }

  // Close modal
  const close = () => {
    // Stop audio
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.currentTime = 0
    }
    playingTrackId.value = null
    emit('update:modelValue', false)
  }

  // Handle backdrop click
  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  // Handle ESC key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue) {
      close()
    }
  }

  // Watch for modal open/close
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        fetchLibrary()
        document.addEventListener('keydown', handleKeyDown)
      } else {
        document.removeEventListener('keydown', handleKeyDown)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick"
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
            class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
          >
            <!-- Header -->
            <div
              class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between flex-shrink-0"
            >
              <div>
                <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                  {{ adminT.music?.browseLibrary ?? 'Browse Music Library' }}
                </h3>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                  {{ currentCount }}/{{ maxTracks }} tracks
                  <span v-if="!canAddMore" class="text-amber-600 dark:text-amber-400 ml-2">
                    (Limit reached)
                  </span>
                </p>
              </div>
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                title="Close (ESC)"
                @click="close"
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

            <!-- Category Filter -->
            <div class="px-6 py-3 border-b border-sand-dark dark:border-dark-border flex-shrink-0">
              <div class="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  v-for="cat in ['all', ...MUSIC_CATEGORIES] as const"
                  :key="cat"
                  type="button"
                  class="px-3 py-1.5 font-body text-xs font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  :class="
                    selectedCategory === cat
                      ? 'bg-sage text-white'
                      : 'bg-sand dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-sand-dark dark:hover:bg-dark-border'
                  "
                  @click="selectedCategory = cat"
                >
                  {{ categoryLabels[cat] }}
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div v-if="addSuccess" class="px-6 py-2 bg-green-50 dark:bg-green-900/20 flex-shrink-0">
              <p class="font-body text-sm text-green-700 dark:text-green-300">{{ addSuccess }}</p>
            </div>
            <div v-if="addError" class="px-6 py-2 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
              <p class="font-body text-sm text-red-700 dark:text-red-300">{{ addError }}</p>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto">
              <!-- Loading -->
              <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
              </div>

              <!-- Error -->
              <div v-else-if="loadError" class="text-center py-12 px-6">
                <p class="font-body text-red-500 mb-4">{{ loadError }}</p>
                <button
                  type="button"
                  class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
                  @click="fetchLibrary"
                >
                  Retry
                </button>
              </div>

              <!-- Empty State -->
              <div v-else-if="libraryTracks.length === 0" class="text-center py-12 px-6">
                <div class="text-4xl mb-4">🎵</div>
                <p class="font-body text-charcoal-light dark:text-dark-text-secondary">
                  {{ adminT.music?.libraryEmpty ?? 'No tracks available in the library yet' }}
                </p>
              </div>

              <!-- Empty filtered results -->
              <div v-else-if="filteredTracks.length === 0" class="text-center py-12 px-6">
                <p class="font-body text-charcoal-light dark:text-dark-text-secondary">
                  No tracks in this category
                </p>
              </div>

              <!-- Track List -->
              <div v-else class="divide-y divide-sand-dark dark:divide-dark-border">
                <div v-for="category in categoriesWithTracks" :key="category">
                  <!-- Category Header (only show when viewing all) -->
                  <div
                    v-if="selectedCategory === 'all'"
                    class="px-6 py-2 bg-sand/50 dark:bg-dark-bg text-xs font-medium font-body text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wide"
                  >
                    {{ categoryLabels[category] }}
                  </div>

                  <!-- Tracks in Category -->
                  <div
                    v-for="track in tracksByCategory[category]"
                    :key="track.id"
                    class="px-6 py-3 hover:bg-sand/30 dark:hover:bg-dark-bg/50 transition-colors"
                  >
                    <div class="flex items-center gap-4">
                      <!-- Play/Pause Button -->
                      <button
                        type="button"
                        class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-sage/10 text-sage hover:bg-sage hover:text-white transition-colors cursor-pointer"
                        @click="togglePreview(track)"
                      >
                        <svg
                          v-if="playingTrackId === track.id"
                          class="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>

                      <!-- Track Info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4
                            class="font-body font-medium text-charcoal dark:text-dark-text truncate"
                          >
                            {{ track.title }}
                          </h4>
                          <span
                            v-if="isTrackAdded(track.id)"
                            class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          >
                            {{ adminT.music?.alreadyAdded ?? 'Added' }}
                          </span>
                          <span
                            v-if="track.license?.type"
                            class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          >
                            {{ licenseLabels[track.license.type] ?? track.license.type }}
                          </span>
                        </div>
                        <p
                          class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                        >
                          <span v-if="track.artist">{{ track.artist }} • </span>
                          {{ formatDuration(track.duration) }}
                        </p>
                      </div>

                      <!-- Add Button -->
                      <button
                        type="button"
                        :disabled="isTrackAdded(track.id) || !canAddMore || isAdding === track.id"
                        class="flex-shrink-0 px-4 py-2 font-body text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="
                          isTrackAdded(track.id)
                            ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-sage text-white hover:bg-sage-dark'
                        "
                        @click="handleAddTrack(track)"
                      >
                        <span v-if="isAdding === track.id">Adding...</span>
                        <span v-else-if="isTrackAdded(track.id)">{{
                          adminT.music?.alreadyAdded ?? 'Added'
                        }}</span>
                        <span v-else>{{ adminT.music?.addFromLibrary ?? 'Add' }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="px-6 py-4 border-t border-sand-dark dark:border-dark-border flex justify-end flex-shrink-0"
            >
              <button
                type="button"
                class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="close"
              >
                {{ adminT.common.close ?? 'Close' }}
              </button>
            </div>

            <!-- Hidden audio element for preview -->
            <audio ref="audioRef" @ended="handleAudioEnded" />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
