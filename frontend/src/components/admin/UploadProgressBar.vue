<script setup lang="ts">
  import { computed } from 'vue'
  import type { UploadProgress } from '@/types/upload'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    uploads: UploadProgress[]
    type?: 'image' | 'music'
  }>()

  const emit = defineEmits<{
    cancel: [id: string]
    dismiss: [id: string]
  }>()

  const { adminT } = useAdminLanguage()

  const activeUploads = computed(() =>
    props.uploads.filter(
      (u) =>
        u.status === 'preparing' ||
        u.status === 'compressing' ||
        u.status === 'optimizing' ||
        u.status === 'uploading' ||
        u.status === 'confirming'
    )
  )

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getProgressLabel = (progress: number): string => {
    if (progress <= 10) return 'Preparing...'
    if (progress <= 15) return 'Getting upload URL...'
    if (progress < 90) return 'Uploading...'
    if (progress < 100) return 'Confirming...'
    return 'Complete!'
  }

  const getStatusLabel = (upload: UploadProgress): string => {
    switch (upload.status) {
      case 'preparing':
        return 'Preparing...'
      case 'compressing':
        return adminT.value.common.compressing
      case 'optimizing':
        return adminT.value.gallery.optimizingVideo
      case 'uploading':
        return getProgressLabel(upload.progress)
      case 'confirming':
        return 'Confirming...'
      case 'completed':
        return 'Upload complete'
      case 'error':
        return upload.error ?? 'Upload failed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return ''
    }
  }

  const getCompressionLabel = (upload: UploadProgress): string | null => {
    if (!upload.compression || upload.compression.savedPercent <= 0) return null
    const { originalSize, compressedSize, savedPercent } = upload.compression
    return `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${savedPercent}% saved)`
  }
</script>

<template>
  <div v-if="uploads.length > 0" class="space-y-2">
    <!-- Section Header -->
    <div class="flex items-center justify-between">
      <h4
        class="font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
      >
        {{ activeUploads.length > 0 ? 'Uploading' : 'Upload Complete' }}
        <span v-if="activeUploads.length > 0">({{ activeUploads.length }})</span>
      </h4>
    </div>

    <!-- Upload Items -->
    <div class="space-y-2">
      <div
        v-for="upload in uploads"
        :key="upload.id"
        class="relative overflow-hidden rounded-lg border transition-all duration-300"
        :class="[
          upload.status === 'error' || upload.status === 'cancelled'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : upload.status === 'completed'
              ? 'bg-sage/10 dark:bg-sage/20 border-sage/30'
              : 'bg-white dark:bg-dark-bg-secondary border-sand-dark dark:border-dark-border',
        ]"
      >
        <div class="p-3">
          <div class="flex items-center gap-3">
            <!-- Icon -->
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              :class="[
                upload.status === 'error' || upload.status === 'cancelled'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : upload.status === 'completed'
                    ? 'bg-sage/20'
                    : 'bg-sand dark:bg-dark-bg',
              ]"
            >
              <!-- Spinner for preparing/compressing/optimizing/uploading/confirming -->
              <div
                v-if="
                  upload.status === 'preparing' ||
                  upload.status === 'compressing' ||
                  upload.status === 'optimizing' ||
                  upload.status === 'uploading' ||
                  upload.status === 'confirming'
                "
                class="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin"
              />
              <!-- Checkmark for completed -->
              <svg
                v-else-if="upload.status === 'completed'"
                class="w-4 h-4 text-sage"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <!-- X for error/cancelled -->
              <svg
                v-else
                class="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm text-charcoal dark:text-dark-text truncate">
                {{ upload.filename }}
              </p>
              <p
                class="font-body text-xs"
                :class="[
                  upload.status === 'error' || upload.status === 'cancelled'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-charcoal-light dark:text-dark-text-secondary',
                ]"
              >
                {{ getStatusLabel(upload) }}
              </p>
              <!-- Compression savings badge -->
              <p
                v-if="getCompressionLabel(upload)"
                class="font-body text-xs text-sage dark:text-sage-light mt-0.5"
              >
                {{ getCompressionLabel(upload) }}
              </p>
            </div>

            <!-- Progress Percentage / Action Buttons -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <!-- Progress percentage for preparing/uploading/confirming -->
              <span
                v-if="
                  upload.status === 'preparing' ||
                  upload.status === 'compressing' ||
                  upload.status === 'optimizing' ||
                  upload.status === 'uploading' ||
                  upload.status === 'confirming'
                "
                class="font-body text-sm font-medium text-sage"
              >
                {{ upload.progress }}%
              </span>
              <!-- Cancel button for preparing/compressing/optimizing/uploading (not for confirming) -->
              <button
                v-if="
                  upload.status === 'preparing' ||
                  upload.status === 'compressing' ||
                  upload.status === 'optimizing' ||
                  upload.status === 'uploading'
                "
                type="button"
                class="p-1 text-charcoal-light hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Cancel upload"
                @click="emit('cancel', upload.id)"
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
              <!-- Dismiss button for completed/error/cancelled -->
              <button
                v-else
                type="button"
                class="p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer"
                title="Dismiss"
                @click="emit('dismiss', upload.id)"
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

          <!-- Progress Bar -->
          <div
            v-if="
              upload.status === 'preparing' ||
              upload.status === 'compressing' ||
              upload.status === 'optimizing' ||
              upload.status === 'uploading' ||
              upload.status === 'confirming'
            "
            class="mt-2 h-1.5 bg-sand-dark dark:bg-dark-border rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-sage rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${upload.progress}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
