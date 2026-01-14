<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { GalleryImage } from "@/types/gallery";

const props = defineProps<{
  image: GalleryImage;
  currentPosition: number;
  totalImages: number;
}>();

const emit = defineEmits<{
  move: [newPosition: number];
  cancel: [];
  viewLightbox: [image: GalleryImage];
}>();

const targetPosition = ref(props.currentPosition);
const inputRef = ref<HTMLInputElement | null>(null);

// Reset target position when modal opens with new image
watch(() => props.currentPosition, (newPos) => {
  targetPosition.value = newPos;
});

const isValidPosition = computed(() => {
  return targetPosition.value >= 1 &&
         targetPosition.value <= props.totalImages &&
         targetPosition.value !== props.currentPosition;
});

const handleMoveToTop = (): void => {
  emit("move", 1);
};

const handleMoveToBottom = (): void => {
  emit("move", props.totalImages);
};

const handleMove = (): void => {
  if (isValidPosition.value) {
    emit("move", targetPosition.value);
  }
};

const handleCancel = (): void => {
  emit("cancel");
};

const handleViewLightbox = (): void => {
  emit("viewLightbox", props.image);
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    handleCancel();
  } else if (event.key === "Enter" && isValidPosition.value) {
    handleMove();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
  // Focus input on mount
  setTimeout(() => inputRef.value?.select(), 100);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50"
      @click="handleCancel"
    />

    <!-- Modal -->
    <div class="relative w-full sm:w-auto sm:min-w-80 bg-white dark:bg-dark-bg-secondary rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 animate-slide-up sm:animate-none">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-4">
        <!-- Image thumbnail -->
        <div class="w-16 h-16 rounded-lg overflow-hidden bg-sand dark:bg-dark-bg flex-shrink-0">
          <img
            :src="image.url"
            :alt="image.filename"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1">
          <h3 class="font-heading text-lg font-semibold text-charcoal dark:text-dark-text">
            Image Options
          </h3>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            Position {{ currentPosition }} of {{ totalImages }}
          </p>
        </div>
      </div>

      <!-- View Image Options -->
      <div class="mb-5 p-3 bg-sand/50 dark:bg-dark-bg rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
          View full image
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 px-3 py-2 font-body text-sm bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-lg transition-colors hover:bg-sand dark:hover:bg-dark-bg-elevated text-charcoal dark:text-dark-text cursor-pointer inline-flex items-center justify-center gap-1.5"
            @click="handleViewLightbox"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Here
          </button>
          <a
            :href="image.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 px-3 py-2 font-body text-sm bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-lg transition-colors hover:bg-sand dark:hover:bg-dark-bg-elevated text-charcoal dark:text-dark-text cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            New Tab
          </a>
        </div>
      </div>

      <!-- Position input -->
      <div class="mb-4">
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2">
          Move to position
        </label>
        <div class="flex gap-2">
          <input
            ref="inputRef"
            v-model.number="targetPosition"
            type="number"
            min="1"
            :max="totalImages"
            class="flex-1 px-4 py-3 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-sage"
            @keydown.enter="handleMove"
          />
          <button
            type="button"
            :disabled="!isValidPosition"
            class="px-5 py-3 font-body text-sm font-medium bg-sage text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-dark cursor-pointer"
            @click="handleMove"
          >
            Move
          </button>
        </div>
        <p v-if="targetPosition === currentPosition" class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
          Already at this position
        </p>
      </div>

      <!-- Quick actions -->
      <div class="flex gap-2 mb-5">
        <button
          type="button"
          :disabled="currentPosition === 1"
          class="flex-1 px-4 py-2.5 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand dark:hover:bg-dark-bg text-charcoal dark:text-dark-text cursor-pointer"
          @click="handleMoveToTop"
        >
          Move to Top
        </button>
        <button
          type="button"
          :disabled="currentPosition === totalImages"
          class="flex-1 px-4 py-2.5 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand dark:hover:bg-dark-bg text-charcoal dark:text-dark-text cursor-pointer"
          @click="handleMoveToBottom"
        >
          Move to Bottom
        </button>
      </div>

      <!-- Cancel button -->
      <button
        type="button"
        class="w-full px-4 py-3 font-body text-sm text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}
</style>
