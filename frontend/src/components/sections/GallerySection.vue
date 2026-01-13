<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { weddingConfig } from "@/config/wedding";
import { useLanguage } from "@/composables/useLanguage";

const { t } = useLanguage();

const photos = weddingConfig.gallery ?? [];
const selectedIndex = ref<number | null>(null);
const slideDirection = ref<"left" | "right">("left");

// Resolve image path with base URL for GitHub Pages
const getImageUrl = (src: string): string => {
  if (src.startsWith("/")) {
    let base = import.meta.env.BASE_URL;
    if (!base.endsWith("/")) {
      base += "/";
    }
    return base + src.slice(1);
  }
  return src;
};

const isLightboxOpen = computed(() => selectedIndex.value !== null);

const currentPhoto = computed(() => {
  if (selectedIndex.value === null) return null;
  return photos[selectedIndex.value] ?? null;
});

const photoCounter = computed(() => {
  if (selectedIndex.value === null) return "";
  return t.value.gallery.photoOf
    .replace("{current}", String(selectedIndex.value + 1))
    .replace("{total}", String(photos.length));
});

const openLightbox = (index: number): void => {
  selectedIndex.value = index;
  document.body.style.overflow = "hidden";
};

const closeLightbox = (): void => {
  selectedIndex.value = null;
  document.body.style.overflow = "";
};

const goToPrevious = (): void => {
  if (selectedIndex.value === null) return;
  slideDirection.value = "right";
  selectedIndex.value = selectedIndex.value === 0
    ? photos.length - 1
    : selectedIndex.value - 1;
};

const goToNext = (): void => {
  if (selectedIndex.value === null) return;
  slideDirection.value = "left";
  selectedIndex.value = selectedIndex.value === photos.length - 1
    ? 0
    : selectedIndex.value + 1;
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (!isLightboxOpen.value) return;

  switch (event.key) {
    case "Escape":
      closeLightbox();
      break;
    case "ArrowLeft":
      goToPrevious();
      break;
    case "ArrowRight":
      goToNext();
      break;
  }
};

// Touch/swipe handling
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e: TouchEvent): void => {
  touchStartX.value = e.touches[0]?.clientX ?? 0;
};

const handleTouchMove = (e: TouchEvent): void => {
  touchEndX.value = e.touches[0]?.clientX ?? 0;
};

const handleTouchEnd = (): void => {
  const diff = touchStartX.value - touchEndX.value;
  const threshold = 50;

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  }

  touchStartX.value = 0;
  touchEndX.value = 0;
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <section v-if="photos.length > 0" class="py-12 sm:py-16 px-4 sm:px-6 bg-sand dark:bg-dark-bg transition-colors duration-300">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark dark:text-sage-light mb-2">
        {{ t.gallery.title }}
      </h2>
      <p class="font-body text-sm sm:text-base text-center text-charcoal-light dark:text-dark-text-secondary mb-6 sm:mb-8">
        {{ t.gallery.subtitle }}
      </p>

      <!-- Photo Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <button
          v-for="(photo, index) in photos"
          :key="index"
          type="button"
          class="aspect-square overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
          @click="openLightbox(index)"
        >
          <img
            :src="getImageUrl(photo.src)"
            :alt="photo.alt ?? `Photo ${index + 1}`"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </button>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isLightboxOpen"
          class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          @click.self="closeLightbox"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <!-- Close Button -->
          <button
            type="button"
            class="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
            :aria-label="t.gallery.close"
            @click="closeLightbox"
          >
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <!-- Previous Button -->
          <button
            type="button"
            class="absolute left-2 sm:left-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
            :aria-label="t.gallery.previous"
            @click="goToPrevious"
          >
            <svg class="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <!-- Next Button -->
          <button
            type="button"
            class="absolute right-2 sm:right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
            :aria-label="t.gallery.next"
            @click="goToNext"
          >
            <svg class="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <!-- Image with slide transition -->
          <div class="max-w-[90vw] max-h-[80vh] flex flex-col items-center overflow-hidden">
            <Transition :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">
              <img
                v-if="currentPhoto"
                :key="selectedIndex ?? 0"
                :src="getImageUrl(currentPhoto.src)"
                :alt="currentPhoto.alt ?? 'Gallery photo'"
                class="max-w-full max-h-[75vh] object-contain select-none"
                draggable="false"
              />
            </Transition>

            <!-- Photo Counter -->
            <p class="mt-4 font-body text-sm text-white/80">
              {{ photoCounter }}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
/* Fade transition for lightbox open/close */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide left transition (for next) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-left-enter-from {
  transform: translateX(100px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100px);
  opacity: 0;
}

/* Slide right transition (for previous) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-right-enter-from {
  transform: translateX(-100px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100px);
  opacity: 0;
}
</style>
