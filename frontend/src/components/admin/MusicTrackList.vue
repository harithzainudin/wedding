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

  const sortedTracks = computed(() => [...props.tracks].sort((a, b) => a.order - b.order))

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
    if (previewingId.value === track.id) {
      // Stop preview
      audioElement.value?.pause()
      previewingId.value = null
    } else {
      // Start preview
      if (audioElement.value) {
        audioElement.value.pause()
      }
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
  }

  onUnmounted(() => {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }
    previewingId.value = null
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

          <!-- Play/Pause Preview -->
          <button
            type="button"
            class="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            :class="[
              previewingId === track.id
                ? 'bg-sage text-white'
                : 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text hover:bg-sage hover:text-white',
            ]"
            @click="togglePreview(track)"
          >
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
          </button>

          <!-- Track Info -->
          <div class="flex-1 min-w-0">
            <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text truncate">
              {{ track.title }}
            </p>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary truncate">
              {{ track.artist || adminT.music.unknownArtist }} ·
              {{ formatDuration(track.duration) }}
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
  </div>
</template>
