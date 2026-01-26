<script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue'
  import type { MusicTrack, PlayMode } from '@/types/music'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    tracks: MusicTrack[]
    mode: PlayMode
    selectedTrackId?: string | undefined
    formatDuration: (seconds: number) => string
  }>()

  const emit = defineEmits<{
    reorder: [newOrder: string[]]
    delete: [trackId: string]
    select: [trackId: string]
  }>()

  const draggedIndex = ref<number | null>(null)
  const dragOverIndex = ref<number | null>(null)
  const previewingId = ref<string | null>(null)
  const audioElement = ref<HTMLAudioElement | null>(null)
  const youtubePreviewId = ref<string | null>(null)

  const sortedTracks = computed(() => [...props.tracks].sort((a, b) => a.order - b.order))

  // Check if track is from YouTube
  const isYouTubeTrack = (track: MusicTrack): boolean => {
    return track.source === 'youtube' && !!track.externalId
  }

  const handleDragStart = (index: number): void => {
    draggedIndex.value = index
  }

  const handleDragOver = (e: DragEvent, index: number): void => {
    e.preventDefault()
    if (draggedIndex.value === null || draggedIndex.value === index) return
    dragOverIndex.value = index
  }

  const handleDragLeave = (): void => {
    dragOverIndex.value = null
  }

  const handleDrop = (index: number): void => {
    if (draggedIndex.value === null || draggedIndex.value === index) return

    const newTracks = [...sortedTracks.value]
    const draggedItems = newTracks.splice(draggedIndex.value, 1)
    const draggedItem = draggedItems[0]
    if (!draggedItem) return
    newTracks.splice(index, 0, draggedItem)

    emit(
      'reorder',
      newTracks.map((t) => t.id)
    )
  }

  const handleDragEnd = (): void => {
    draggedIndex.value = null
    dragOverIndex.value = null
  }

  const togglePreview = (track: MusicTrack): void => {
    // For YouTube tracks, open preview modal
    if (isYouTubeTrack(track)) {
      if (youtubePreviewId.value === track.id) {
        youtubePreviewId.value = null
      } else {
        // Stop any audio preview first
        audioElement.value?.pause()
        previewingId.value = null
        youtubePreviewId.value = track.id
      }
      return
    }

    // For uploaded tracks, use audio preview
    if (previewingId.value === track.id) {
      // Stop preview
      audioElement.value?.pause()
      previewingId.value = null
    } else {
      // Start preview
      if (audioElement.value) {
        audioElement.value.pause()
      }
      // Close any YouTube preview
      youtubePreviewId.value = null

      audioElement.value = new Audio(track.url)
      audioElement.value.volume = 0.5
      audioElement.value.play()
      audioElement.value.onended = () => {
        previewingId.value = null
      }
      previewingId.value = track.id
    }
  }

  const stopPreview = (): void => {
    audioElement.value?.pause()
    previewingId.value = null
    youtubePreviewId.value = null
  }

  const closeYouTubePreview = (): void => {
    youtubePreviewId.value = null
  }

  onUnmounted(() => {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }
    previewingId.value = null
    youtubePreviewId.value = null
  })
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-heading text-sm font-medium text-charcoal dark:text-dark-text">
        {{ mode === 'single' ? adminT.music.selectTrack : adminT.music.playlistDragToReorder }}
      </h3>
      <button
        v-if="previewingId"
        type="button"
        class="text-xs text-sage hover:text-sage-dark cursor-pointer"
        @click="stopPreview"
      >
        {{ adminT.music.stopPreview }}
      </button>
    </div>

    <div class="space-y-0">
      <div
        v-for="(track, index) in sortedTracks"
        :key="track.id"
        class="relative"
        @dragover="(e) => handleDragOver(e, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(index)"
      >
        <!-- Drop indicator line - shows above target item -->
        <div
          v-if="dragOverIndex === index && draggedIndex !== null && draggedIndex !== index"
          class="absolute -top-1 left-0 right-0 z-20 flex items-center gap-2 pointer-events-none"
        >
          <div
            class="w-3 h-3 rounded-full bg-sage border-2 border-white dark:border-dark-bg-secondary shadow-sm"
          ></div>
          <div class="flex-1 h-0.5 bg-sage rounded-full shadow-sm"></div>
          <div
            class="w-3 h-3 rounded-full bg-sage border-2 border-white dark:border-dark-bg-secondary shadow-sm"
          ></div>
        </div>

        <div
          class="flex items-center gap-3 p-3 mb-2 bg-white dark:bg-dark-bg-secondary rounded-lg border transition-all duration-200"
          :class="[
            selectedTrackId === track.id
              ? 'border-sage ring-1 ring-sage'
              : 'border-sand-dark dark:border-dark-border hover:border-sage/50',
            draggedIndex === index ? 'opacity-40 scale-[0.98]' : '',
          ]"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragend="handleDragEnd"
        >
          <!-- Drag Handle -->
          <div class="cursor-grab text-charcoal-light dark:text-dark-text-secondary">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>

          <!-- Select Radio (Single Mode) -->
          <button
            v-if="mode === 'single'"
            type="button"
            class="w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors"
            :class="[
              selectedTrackId === track.id
                ? 'border-sage bg-sage'
                : 'border-charcoal-light dark:border-dark-text-secondary hover:border-sage',
            ]"
            @click="emit('select', track.id)"
          >
            <svg
              v-if="selectedTrackId === track.id"
              class="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </button>

          <!-- Play/Pause Preview - Different display for YouTube vs Audio -->
          <button
            type="button"
            class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative overflow-hidden"
            :class="[
              isYouTubeTrack(track)
                ? 'bg-red-100 dark:bg-red-900/30'
                : previewingId === track.id
                  ? 'bg-sage text-white'
                  : 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text hover:bg-sage hover:text-white',
            ]"
            @click="togglePreview(track)"
          >
            <!-- YouTube Thumbnail or Icon -->
            <template v-if="isYouTubeTrack(track)">
              <img
                v-if="track.thumbnailUrl"
                :src="track.thumbnailUrl"
                :alt="track.title"
                class="w-full h-full object-cover"
              />
              <svg
                v-else
                class="w-5 h-5 text-red-600 dark:text-red-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
              </svg>
              <!-- YouTube play overlay -->
              <div
                class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </template>
            <!-- Audio Preview Icon -->
            <template v-else>
              <svg
                v-if="previewingId === track.id"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
              <svg v-else class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </template>
          </button>

          <!-- Track Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text truncate">
                {{ track.title }}
              </p>
              <!-- YouTube Badge -->
              <span
                v-if="isYouTubeTrack(track)"
                class="flex-shrink-0 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-medium rounded"
              >
                YouTube
              </span>
              <!-- Library Badge -->
              <span
                v-else-if="track.source === 'library'"
                class="flex-shrink-0 px-1.5 py-0.5 bg-sage/10 text-sage text-[10px] font-medium rounded"
              >
                {{ adminT.music.library ?? 'Library' }}
              </span>
            </div>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary truncate">
              {{ track.artist || adminT.music.unknownArtist }}
              <template v-if="track.duration > 0">· {{ formatDuration(track.duration) }}</template>
            </p>
          </div>

          <!-- Delete Button -->
          <button
            type="button"
            class="p-2 text-charcoal-light hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 cursor-pointer"
            @click="emit('delete', track.id)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- YouTube Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="youtubePreviewId"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          @click.self="closeYouTubePreview"
        >
          <div class="relative w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl">
            <!-- Close Button -->
            <button
              type="button"
              class="absolute top-3 right-3 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 cursor-pointer"
              @click="closeYouTubePreview"
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

            <!-- YouTube Embed -->
            <div class="aspect-video">
              <iframe
                :src="`https://www.youtube.com/embed/${sortedTracks.find((t) => t.id === youtubePreviewId)?.externalId}?autoplay=1`"
                class="w-full h-full"
                allow="
                  accelerometer;
                  autoplay;
                  clipboard-write;
                  encrypted-media;
                  gyroscope;
                  picture-in-picture;
                "
                allowfullscreen
              ></iframe>
            </div>

            <!-- Track Info -->
            <div class="p-4 bg-charcoal">
              <p class="font-body text-white font-medium truncate">
                {{ sortedTracks.find((t) => t.id === youtubePreviewId)?.title }}
              </p>
              <p class="font-body text-sm text-white/70 truncate">
                {{ sortedTracks.find((t) => t.id === youtubePreviewId)?.artist }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
</style>
