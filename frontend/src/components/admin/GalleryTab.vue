<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useGallery } from "@/composables/useGallery";
import type { GalleryImage } from "@/types/gallery";
import ImageUploader from "./ImageUploader.vue";
import ImageGrid from "./ImageGrid.vue";
import GallerySettings from "./GallerySettings.vue";
import DeleteConfirmModal from "./DeleteConfirmModal.vue";
import HelpTooltip from "./HelpTooltip.vue";
import GalleryHelpContent from "./GalleryHelpContent.vue";
import UploadProgressBar from "./UploadProgressBar.vue";

const {
  images,
  settings,
  isLoading,
  loadError,
  activeUploads,
  canUploadMore,
  remainingSlots,
  fetchImages,
  uploadImage,
  cancelUpload,
  dismissUpload,
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
      uploadErrors.value.push({
        file: file.name,
        error: result.error ?? "Upload failed",
      });
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

const handleSettingsUpdate = async (newSettings: {
  maxFileSize?: number | undefined;
  maxImages?: number | undefined;
}): Promise<void> => {
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

// Handle Escape key to close settings
const handleEscapeKey = (e: KeyboardEvent): void => {
  if (e.key === "Escape" && showSettings.value) {
    showSettings.value = false;
  }
};

watch(showSettings, (isOpen) => {
  if (isOpen) {
    document.addEventListener("keydown", handleEscapeKey);
    document.body.style.overflow = "hidden";
  } else {
    document.removeEventListener("keydown", handleEscapeKey);
    document.body.style.overflow = "";
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
  document.body.style.overflow = "";
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-2">
          <h2
            class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text"
          >
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
        <p
          class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1"
        >
          {{ images.length }} / {{ settings.maxImages }} images
          <span v-if="canUploadMore" class="text-sage">
            ({{ remainingSlots }} slots remaining)
          </span>
        </p>
      </div>
      <!-- Settings Button & Panel Container -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
          @click="showSettings = !showSettings"
        >
          <!-- Desktop: Gear icon -->
          <svg
            class="hidden sm:block w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Settings</span>
          <!-- Mobile: Chevron that rotates -->
          <svg
            class="sm:hidden w-4 h-4 transition-transform duration-200"
            :class="showSettings ? 'rotate-180' : ''"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <!-- Desktop: Popover | Mobile: Bottom Sheet -->
        <Teleport to="body">
          <Transition name="settings-panel">
            <div
              v-if="showSettings"
              class="settings-container"
              @click.self="showSettings = false"
            >
              <div class="settings-panel">
                <!-- Mobile Header with Close -->
                <div class="settings-mobile-header">
                  <h3
                    class="font-heading text-lg font-medium text-charcoal dark:text-dark-text"
                  >
                    Gallery Settings
                  </h3>
                  <button
                    type="button"
                    class="p-2 -m-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                    @click="showSettings = false"
                  >
                    <svg
                      class="w-5 h-5"
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
                <GallerySettings
                  :settings="settings"
                  :format-file-size="formatFileSize"
                  :hide-title="true"
                  :embedded="true"
                  @update="handleSettingsUpdate"
                />
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>
    </div>

    <!-- Upload Progress Bar -->
    <UploadProgressBar
      v-if="activeUploads.length > 0"
      :uploads="activeUploads"
      type="image"
      @cancel="cancelUpload"
      @dismiss="dismissUpload"
    />

    <!-- Upload Errors -->
    <div v-if="uploadErrors.length > 0" class="space-y-2">
      <div
        v-for="(error, index) in uploadErrors"
        :key="index"
        class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
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

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      ></div>
      <p
        class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3"
      >
        Loading gallery...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">
        {{ loadError }}
      </p>
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

      <div
        v-else
        class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <p class="font-body text-sm text-amber-700 dark:text-amber-300">
          Maximum number of images ({{ settings.maxImages }}) reached. Delete
          some images to upload more.
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-if="images.length === 0"
        class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border"
      >
        <svg
          class="w-16 h-16 mx-auto text-charcoal-light/30 dark:text-dark-text-secondary/30 mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p
          class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
        >
          No images in gallery yet.
        </p>
        <p
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2"
        >
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

<style scoped>
/* Settings Container - Backdrop for mobile */
.settings-container {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
}

/* Settings Panel - Mobile: Bottom Sheet */
.settings-panel {
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  background-color: white;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  padding: 1rem;
}

.settings-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

/* Dark mode */
:global(.dark) .settings-panel {
  background-color: #1f2937;
}

:global(.dark) .settings-mobile-header {
  border-bottom-color: #374151;
}

/* Desktop: Popover style */
@media (min-width: 640px) {
  .settings-container {
    position: fixed;
    inset: 0;
    background-color: transparent;
    display: block;
  }

  .settings-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    min-width: 400px;
    max-width: 500px;
    max-height: 80vh;
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
  }

  :global(.dark) .settings-panel {
    border-color: #374151;
  }

  .settings-mobile-header {
    display: flex;
  }
}

/* Transitions - Mobile: Slide up */
.settings-panel-enter-active,
.settings-panel-leave-active {
  transition: all 0.25s ease-out;
}

.settings-panel-enter-active .settings-panel,
.settings-panel-leave-active .settings-panel {
  transition: transform 0.25s ease-out;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
  background-color: rgba(0, 0, 0, 0);
}

.settings-panel-enter-from .settings-panel,
.settings-panel-leave-to .settings-panel {
  transform: translateY(100%);
}

/* Desktop transitions */
@media (min-width: 640px) {
  .settings-panel-enter-from .settings-panel,
  .settings-panel-leave-to .settings-panel {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0;
  }

  .settings-panel-enter-to .settings-panel,
  .settings-panel-leave-from .settings-panel {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
</style>
