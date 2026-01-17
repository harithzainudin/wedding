<script setup lang="ts">
  defineProps<{
    maxFileSize: string
    allowedFormats: string[]
    maxImages: number
  }>()

  const formatLabels: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  }
</script>

<template>
  <div class="space-y-4 font-body text-sm">
    <!-- Reorder Instructions -->
    <div class="flex gap-3">
      <div
        class="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 dark:bg-sage/30 flex items-center justify-center"
      >
        <svg
          class="w-3.5 h-3.5 text-sage-dark dark:text-sage-light"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>
      <div>
        <p class="font-medium text-charcoal dark:text-dark-text">Reorder Images</p>
        <p class="text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          <span class="hidden sm:inline">Drag and drop images to reorder.</span>
          <span class="sm:hidden">Touch, hold, and drag to reorder.</span>
        </p>
      </div>
    </div>

    <!-- Featured Image Info -->
    <div class="flex gap-3">
      <div
        class="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 dark:bg-sage/30 flex items-center justify-center"
      >
        <svg
          class="w-3.5 h-3.5 text-sage-dark dark:text-sage-light"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
      </div>
      <div>
        <p class="font-medium text-charcoal dark:text-dark-text">Featured Image</p>
        <p class="text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          Image #1 appears as the main/featured image on your site.
        </p>
      </div>
    </div>

    <!-- Upload Limits -->
    <div class="flex gap-3">
      <div
        class="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 dark:bg-sage/30 flex items-center justify-center"
      >
        <svg
          class="w-3.5 h-3.5 text-sage-dark dark:text-sage-light"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div>
        <p class="font-medium text-charcoal dark:text-dark-text">Upload Limits</p>
        <p class="text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          Max {{ maxFileSize }} per file. Up to {{ maxImages }} images total.
        </p>
        <p class="text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          Formats:
          {{ allowedFormats.map((f) => formatLabels[f] ?? f).join(', ') }}
        </p>
      </div>
    </div>

    <!-- Public Display Info -->
    <div class="flex gap-3">
      <div
        class="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 dark:bg-sage/30 flex items-center justify-center"
      >
        <svg
          class="w-3.5 h-3.5 text-sage-dark dark:text-sage-light"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <div>
        <p class="font-medium text-charcoal dark:text-dark-text">Public Display</p>
        <p class="text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          First 6 images show on the homepage. Visitors can view all in a lightbox gallery.
        </p>
      </div>
    </div>
  </div>
</template>
