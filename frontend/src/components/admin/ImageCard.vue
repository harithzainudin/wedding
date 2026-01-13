<script setup lang="ts">
import type { GalleryImage } from "@/types/gallery";

defineProps<{
  image: GalleryImage;
}>();

const emit = defineEmits<{
  delete: [];
}>();

const handleDelete = (event: Event): void => {
  event.stopPropagation();
  emit("delete");
};
</script>

<template>
  <div class="group relative w-full h-full rounded-lg overflow-hidden bg-sand dark:bg-dark-bg-secondary">
    <img
      :src="image.url"
      :alt="image.filename"
      class="w-full h-full object-cover"
      loading="lazy"
    />

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
      <!-- Delete button -->
      <button
        type="button"
        class="absolute top-2 right-2 p-2 sm:p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Delete image"
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

      <!-- Drag handle indicator -->
      <div class="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  </div>
</template>
