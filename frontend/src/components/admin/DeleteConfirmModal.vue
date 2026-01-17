<script setup lang="ts">
  import type { GalleryImage } from '@/types/gallery'

  defineProps<{
    image?: GalleryImage | undefined
    isDeleting: boolean
  }>()

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('cancel')"></div>

    <!-- Modal -->
    <div
      class="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4"
    >
      <h3 class="font-heading text-lg font-semibold text-charcoal dark:text-dark-text">
        Delete Image?
      </h3>

      <!-- Image Preview -->
      <div v-if="image" class="flex items-center gap-4">
        <img :src="image.url" :alt="image.filename" class="w-20 h-20 object-cover rounded-lg" />
        <div class="flex-1 min-w-0">
          <p class="font-body text-sm text-charcoal dark:text-dark-text truncate">
            {{ image.filename }}
          </p>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
            Uploaded {{ new Date(image.uploadedAt).toLocaleDateString() }}
          </p>
        </div>
      </div>

      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        This action cannot be undone. The image will be permanently deleted from the gallery.
      </p>

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          :disabled="isDeleting"
          class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer disabled:opacity-50"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          class="px-4 py-2 font-body text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
          @click="emit('confirm')"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
