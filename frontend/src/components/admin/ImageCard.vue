<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import type { GalleryImage } from '@/types/gallery'

  const props = defineProps<{
    image: GalleryImage
  }>()

  const emit = defineEmits<{
    delete: []
    view: []
  }>()

  const isVideo = computed(() => props.image.mediaType === 'video')
  const videoRef = ref<HTMLVideoElement | null>(null)
  const thumbnailLoaded = ref(false)

  // For videos, we let the browser show the first frame via preload="metadata"
  onMounted(() => {
    if (isVideo.value && videoRef.value) {
      videoRef.value.addEventListener('loadeddata', () => {
        thumbnailLoaded.value = true
      })
    }
  })

  const handleDelete = (event: Event): void => {
    event.stopPropagation()
    emit('delete')
  }

  const handleView = (event: Event): void => {
    event.stopPropagation()
    emit('view')
  }
</script>

<template>
  <div
    class="group relative w-full h-full rounded-lg overflow-hidden bg-sand dark:bg-dark-bg-secondary"
  >
    <!-- Image display -->
    <img
      v-if="!isVideo"
      :src="image.url"
      :alt="image.filename"
      class="w-full h-full object-cover"
      loading="lazy"
    />

    <!-- Video display (shows first frame as thumbnail) -->
    <video
      v-else
      ref="videoRef"
      :src="image.url"
      class="w-full h-full object-cover"
      preload="metadata"
      muted
      playsinline
    />

    <!-- Video indicator badge -->
    <div
      v-if="isVideo"
      class="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs flex items-center gap-1 pointer-events-none"
    >
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.14v14l11-7-11-7z" />
      </svg>
      <span class="uppercase font-medium">Video</span>
    </div>

    <!-- Overlay with controls - always visible on mobile, hover on desktop -->
    <div
      class="absolute inset-0 bg-black/0 sm:group-hover:bg-black/30 transition-colors duration-200"
    >
      <!-- Delete button - always visible on mobile, hover on desktop -->
      <button
        type="button"
        class="absolute top-2 right-2 p-2 sm:p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
        :title="isVideo ? 'Delete video' : 'Delete image'"
        @click="handleDelete"
      >
        <svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      <!-- View/Play button - only visible on desktop hover -->
      <button
        type="button"
        class="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-sage text-white rounded-full transition-colors hidden sm:opacity-0 sm:group-hover:opacity-100 sm:block cursor-pointer"
        :title="isVideo ? 'Play video' : 'View full image'"
        @click="handleView"
      >
        <svg v-if="isVideo" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v14l11-7-11-7z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>

      <!-- Drag handle indicator - only visible on desktop (drag disabled on mobile) -->
      <div
        class="drag-handle absolute bottom-2 left-2 p-1.5 bg-black/50 text-white rounded hidden sm:opacity-0 sm:group-hover:opacity-100 sm:block transition-opacity cursor-grab active:cursor-grabbing"
      >
        <svg
          class="w-4 h-4 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
