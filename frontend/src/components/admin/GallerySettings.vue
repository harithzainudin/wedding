<script setup lang="ts">
import { ref, watch } from "vue";
import type { GallerySettings } from "@/types/gallery";

const props = defineProps<{
  settings: GallerySettings;
  formatFileSize: (bytes: number) => string;
}>();

const emit = defineEmits<{
  update: [settings: { maxFileSize?: number; maxImages?: number }];
}>();

const localMaxFileSize = ref(props.settings.maxFileSize);
const localMaxImages = ref(props.settings.maxImages);
const isSaving = ref(false);

// Sync with props when they change
watch(
  () => props.settings,
  (newSettings) => {
    localMaxFileSize.value = newSettings.maxFileSize;
    localMaxImages.value = newSettings.maxImages;
  }
);

// File size options in bytes
const fileSizeOptions = [
  { label: "1 MB", value: 1 * 1024 * 1024 },
  { label: "2 MB", value: 2 * 1024 * 1024 },
  { label: "5 MB", value: 5 * 1024 * 1024 },
  { label: "10 MB", value: 10 * 1024 * 1024 },
  { label: "20 MB", value: 20 * 1024 * 1024 },
  { label: "50 MB", value: 50 * 1024 * 1024 },
];

// Max images options
const maxImagesOptions = [10, 20, 30, 50, 100, 200];

const hasChanges = (): boolean => {
  return (
    localMaxFileSize.value !== props.settings.maxFileSize ||
    localMaxImages.value !== props.settings.maxImages
  );
};

const handleSave = async (): Promise<void> => {
  if (!hasChanges()) return;

  isSaving.value = true;

  const updates: { maxFileSize?: number; maxImages?: number } = {};
  if (localMaxFileSize.value !== props.settings.maxFileSize) {
    updates.maxFileSize = localMaxFileSize.value;
  }
  if (localMaxImages.value !== props.settings.maxImages) {
    updates.maxImages = localMaxImages.value;
  }

  emit("update", updates);

  // Reset saving state after a delay (parent will update settings)
  setTimeout(() => {
    isSaving.value = false;
  }, 500);
};

const formatLabels: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
};
</script>

<template>
  <div class="p-4 bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-xl space-y-4">
    <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
      Gallery Settings
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Max File Size -->
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          Max File Size
        </label>
        <select
          v-model="localMaxFileSize"
          class="w-full px-3 py-2.5 font-body text-base bg-white dark:bg-dark-bg border border-sand-dark dark:border-dark-border rounded-lg focus:ring-2 focus:ring-sage focus:border-sage text-charcoal dark:text-dark-text"
        >
          <option v-for="option in fileSizeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Max Images -->
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          Max Number of Images
        </label>
        <select
          v-model="localMaxImages"
          class="w-full px-3 py-2.5 font-body text-base bg-white dark:bg-dark-bg border border-sand-dark dark:border-dark-border rounded-lg focus:ring-2 focus:ring-sage focus:border-sage text-charcoal dark:text-dark-text"
        >
          <option v-for="option in maxImagesOptions" :key="option" :value="option">
            {{ option }} images
          </option>
        </select>
      </div>
    </div>

    <!-- Allowed Formats (read-only) -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
        Allowed Formats
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
    <div v-if="settings.updatedAt" class="text-xs font-body text-charcoal-light dark:text-dark-text-secondary">
      Last updated: {{ new Date(settings.updatedAt).toLocaleString() }}
      <span v-if="settings.updatedBy"> by {{ settings.updatedBy }}</span>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        type="button"
        :disabled="!hasChanges() || isSaving"
        class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSave"
      >
        {{ isSaving ? "Saving..." : "Save Settings" }}
      </button>
    </div>
  </div>
</template>
