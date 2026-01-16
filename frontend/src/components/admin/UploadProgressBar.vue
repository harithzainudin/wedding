<script setup lang="ts">
import { computed } from "vue";
import type { UploadProgress } from "@/types/upload";

const props = defineProps<{
  uploads: UploadProgress[];
  type?: "image" | "music";
}>();

const emit = defineEmits<{
  cancel: [id: string];
  dismiss: [id: string];
}>();

const activeUploads = computed(() =>
  props.uploads.filter((u) => u.status === "uploading"),
);

const getProgressLabel = (progress: number): string => {
  if (progress <= 10) return "Preparing...";
  if (progress <= 30) return "Getting upload URL...";
  if (progress <= 70) return "Uploading to storage...";
  if (progress < 100) return "Confirming...";
  return "Complete!";
};

const getStatusLabel = (upload: UploadProgress): string => {
  switch (upload.status) {
    case "uploading":
      return getProgressLabel(upload.progress);
    case "completed":
      return "Upload complete";
    case "error":
      return upload.error ?? "Upload failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "";
  }
};
</script>

<template>
  <div v-if="uploads.length > 0" class="space-y-2">
    <!-- Section Header -->
    <div class="flex items-center justify-between">
      <h4
        class="font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
      >
        {{ activeUploads.length > 0 ? "Uploading" : "Upload Complete" }}
        <span v-if="activeUploads.length > 0"
          >({{ activeUploads.length }})</span
        >
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
              <!-- Spinner for uploading -->
              <div
                v-if="upload.status === 'uploading'"
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
              <p
                class="font-body text-sm text-charcoal dark:text-dark-text truncate"
              >
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
            </div>

            <!-- Progress Percentage / Action Buttons -->
            <div class="flex-shrink-0 flex items-center gap-2">
              <!-- Progress percentage for uploading -->
              <span
                v-if="upload.status === 'uploading'"
                class="font-body text-sm font-medium text-sage"
              >
                {{ upload.progress }}%
              </span>
              <!-- Cancel button for uploading -->
              <button
                v-if="upload.status === 'uploading'"
                type="button"
                class="p-1 text-charcoal-light hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Cancel upload"
                @click="emit('cancel', upload.id)"
              >
                <svg
                  class="w-4 h-4"
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
              </button>
              <!-- Dismiss button for completed/error/cancelled -->
              <button
                v-else
                type="button"
                class="p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer"
                title="Dismiss"
                @click="emit('dismiss', upload.id)"
              >
                <svg
                  class="w-4 h-4"
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
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div
            v-if="upload.status === 'uploading'"
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
