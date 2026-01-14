<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useGallery } from "@/composables/useGallery";
import type { GalleryImage } from "@/types/gallery";
import ImageUploader from "./ImageUploader.vue";
import ImageGrid from "./ImageGrid.vue";
import GallerySettings from "./GallerySettings.vue";
import DeleteConfirmModal from "./DeleteConfirmModal.vue";
import HelpTooltip from "./HelpTooltip.vue";
import GalleryHelpContent from "./GalleryHelpContent.vue";

const {
  images,
  settings,
  isLoading,
  loadError,
  canUploadMore,
  remainingSlots,
  fetchImages,
  uploadImage,
  removeImage,
  updateOrder,
  updateSettings,
  formatFileSize,
} = useGallery();

const showSettings = ref(false);
const deleteConfirmId = ref<string | null>(null);
const isDeleting = ref(false);
const uploadErrors = ref<{ file: string; error: string }[]>([]);

onMounted(() => {
  fetchImages();
});

const handleFilesSelected = async (files: File[]): Promise<void> => {
  uploadErrors.value = [];

  for (const file of files) {
    const result = await uploadImage(file);
    if (!result.success) {
      uploadErrors.value.push({ file: file.name, error: result.error ?? "Upload failed" });
    }
  }
};

const handleReorder = async (newOrder: string[]): Promise<void> => {
  const result = await updateOrder(newOrder);
  if (!result.success) {
    // Show error toast or message
    console.error("Reorder failed:", result.error);
  }
};

const handleDeleteClick = (imageId: string): void => {
  deleteConfirmId.value = imageId;
};

const handleDeleteConfirm = async (): Promise<void> => {
  if (!deleteConfirmId.value) return;

  isDeleting.value = true;
  const result = await removeImage(deleteConfirmId.value);
  isDeleting.value = false;

  if (!result.success) {
    console.error("Delete failed:", result.error);
  }

  deleteConfirmId.value = null;
};

const handleDeleteCancel = (): void => {
  deleteConfirmId.value = null;
};

const handleSettingsUpdate = async (newSettings: { maxFileSize?: number | undefined; maxImages?: number | undefined }): Promise<void> => {
  const result = await updateSettings(newSettings);
  if (!result.success) {
    console.error("Settings update failed:", result.error);
  }
};

const dismissError = (index: number): void => {
  uploadErrors.value.splice(index, 1);
};

const getImageToDelete = (): GalleryImage | undefined => {
  return images.value.find((img) => img.id === deleteConfirmId.value);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
            Gallery Management
          </h2>
          <HelpTooltip title="Gallery Help">
            <GalleryHelpContent
              :max-file-size="formatFileSize(settings.maxFileSize)"
              :allowed-formats="settings.allowedFormats"
              :max-images="settings.maxImages"
            />
          </HelpTooltip>
        </div>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          {{ images.length }} / {{ settings.maxImages }} images
          <span v-if="canUploadMore" class="text-sage">
            ({{ remainingSlots }} slots remaining)
          </span>
        </p>
      </div>
      <button
        type="button"
        class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
        @click="showSettings = !showSettings"
      >
        {{ showSettings ? "Hide Settings" : "Settings" }}
      </button>
    </div>

    <!-- Settings Panel -->
    <GallerySettings
      v-if="showSettings"
      :settings="settings"
      :format-file-size="formatFileSize"
      @update="handleSettingsUpdate"
    />

    <!-- Upload Errors -->
    <div v-if="uploadErrors.length > 0" class="space-y-2">
      <div
        v-for="(error, index) in uploadErrors"
        :key="index"
        class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-body text-sm text-red-700 dark:text-red-300">
            <strong>{{ error.file }}:</strong> {{ error.error }}
          </span>
        </div>
        <button
          type="button"
          class="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
          @click="dismissError(index)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"></div>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading gallery...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="fetchImages"
      >
        Try Again
      </button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Upload Zone -->
      <ImageUploader
        v-if="canUploadMore"
        :max-file-size="settings.maxFileSize"
        :allowed-formats="settings.allowedFormats"
        :format-file-size="formatFileSize"
        @files-selected="handleFilesSelected"
      />

      <div v-else class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p class="font-body text-sm text-amber-700 dark:text-amber-300">
          Maximum number of images ({{ settings.maxImages }}) reached. Delete some images to upload more.
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="images.length === 0" class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border">
        <svg class="w-16 h-16 mx-auto text-charcoal-light/30 dark:text-dark-text-secondary/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          No images in gallery yet.
        </p>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2">
          Upload your first image to get started.
        </p>
      </div>

      <!-- Image Grid -->
      <ImageGrid
        v-else
        :images="images"
        @reorder="handleReorder"
        @delete="handleDeleteClick"
      />
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="deleteConfirmId"
      :image="getImageToDelete()"
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>
