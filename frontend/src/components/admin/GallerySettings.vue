<script setup lang="ts">
  import type { GallerySettings } from '@/types/gallery'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'

  const { adminT } = useAdminLanguage()

  const props = withDefaults(
    defineProps<{
      settings: GallerySettings
      formatFileSize: (bytes: number) => string
      hideTitle?: boolean
      embedded?: boolean
    }>(),
    {
      hideTitle: false,
      embedded: false,
    }
  )

  const formatLabels: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  }
</script>

<template>
  <div
    class="space-y-4"
    :class="
      embedded
        ? ''
        : 'p-4 bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-xl'
    "
  >
    <h3
      v-if="!hideTitle"
      class="font-heading text-lg font-medium text-charcoal dark:text-dark-text"
    >
      {{ adminT.gallery.gallerySettings }}
    </h3>

    <!-- Current Limits (read-only) -->
    <div
      class="p-3 bg-sand/50 dark:bg-dark-bg rounded-lg border border-sand-dark/50 dark:border-dark-border/50"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Max File Size -->
        <div>
          <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
            {{ adminT.gallery.maxFileSize }}
          </p>
          <p class="font-body text-base text-charcoal-light dark:text-dark-text-secondary">
            {{ props.formatFileSize(settings.maxFileSize) }}
          </p>
        </div>

        <!-- Max Images -->
        <div>
          <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
            {{ adminT.gallery.maxImages }}
          </p>
          <p class="font-body text-base text-charcoal-light dark:text-dark-text-secondary">
            {{ interpolate(adminT.gallery.imagesLabel, { count: settings.maxImages }) }}
          </p>
        </div>
      </div>

      <!-- Super Admin Note -->
      <p
        class="mt-3 font-body text-xs text-charcoal-light/70 dark:text-dark-text-secondary/70 italic"
      >
        {{ adminT.gallery.limitsReadOnly ?? 'Limits are managed by Super Admin' }}
      </p>
    </div>

    <!-- Allowed Formats (read-only) -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
        {{ adminT.gallery.allowedFormats }}
      </label>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="format in settings.allowedFormats"
          :key="format"
          class="px-2 py-1 bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text text-xs font-body rounded"
        >
          {{ formatLabels[format] ?? format }}
        </span>
      </div>
    </div>

    <!-- Last Updated -->
    <div
      v-if="settings.updatedAt"
      class="text-xs font-body text-charcoal-light dark:text-dark-text-secondary"
    >
      {{
        interpolate(adminT.gallery.lastUpdatedBy, {
          date: new Date(settings.updatedAt).toLocaleString(),
          user: settings.updatedBy || '',
        })
      }}
    </div>
  </div>
</template>
