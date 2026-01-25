<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { listGalleryImagesCached } from '@/services/api'

  const { t } = useLanguage()
  const { currentWeddingSlug } = usePublicWeddingData()

  interface Photo {
    src: string
    alt?: string
  }

  const MAX_VISIBLE_PHOTOS = 6

  const photos = ref<Photo[]>([])
  const isLoadingPhotos = ref(true)
  const selectedIndex = ref<number | null>(null)
  const slideDirection = ref<'left' | 'right'>('left')
  const lightboxMode = ref<'single' | 'grid'>('single')
  const thumbnailStripRef = ref<HTMLDivElement | null>(null)

  const visiblePhotos = computed(() => photos.value.slice(0, MAX_VISIBLE_PHOTOS))
  const hasMorePhotos = computed(() => photos.value.length > MAX_VISIBLE_PHOTOS)
  const fetchPublicGallery = async (): Promise<void> => {
    try {
      const data = await listGalleryImagesCached(currentWeddingSlug.value ?? undefined)
      if (data.images?.length > 0) {
        photos.value = data.images.map((img) => ({
          src: img.url,
          alt: img.filename,
        }))
      }
    } catch {
      // Photos remain empty on error
    } finally {
      isLoadingPhotos.value = false
    }
  }

  const isLightboxOpen = computed(() => selectedIndex.value !== null)

  const currentPhoto = computed(() => {
    if (selectedIndex.value === null) return null
    return photos.value[selectedIndex.value] ?? null
  })

  const photoCounter = computed(() => {
    if (selectedIndex.value === null) return ''
    return t.value.gallery.photoOf
      .replace('{current}', String(selectedIndex.value + 1))
      .replace('{total}', String(photos.value.length))
  })

  const openLightbox = (index: number): void => {
    selectedIndex.value = index
    lightboxMode.value = 'single'
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = (): void => {
    selectedIndex.value = null
    lightboxMode.value = 'single'
    document.body.style.overflow = ''
  }

  const jumpToPhoto = (index: number): void => {
    if (selectedIndex.value !== null) {
      slideDirection.value = index > selectedIndex.value ? 'left' : 'right'
    }
    selectedIndex.value = index
    lightboxMode.value = 'single'
  }

  const toggleLightboxMode = (): void => {
    lightboxMode.value = lightboxMode.value === 'single' ? 'grid' : 'single'
  }

  const scrollToActiveThumbnail = (): void => {
    if (!thumbnailStripRef.value || selectedIndex.value === null) return

    const container = thumbnailStripRef.value
    const thumbnails = container.querySelectorAll('button')
    const activeThumbnail = thumbnails[selectedIndex.value]

    if (activeThumbnail) {
      const containerRect = container.getBoundingClientRect()
      const thumbnailRect = activeThumbnail.getBoundingClientRect()
      const isOutsideLeft = thumbnailRect.left < containerRect.left
      const isOutsideRight = thumbnailRect.right > containerRect.right

      if (isOutsideLeft || isOutsideRight) {
        activeThumbnail.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      }
    }
  }

  watch(selectedIndex, () => {
    nextTick(scrollToActiveThumbnail)
  })

  const goToPrevious = (): void => {
    if (selectedIndex.value === null) return
    slideDirection.value = 'right'
    selectedIndex.value =
      selectedIndex.value === 0 ? photos.value.length - 1 : selectedIndex.value - 1
  }

  const goToNext = (): void => {
    if (selectedIndex.value === null) return
    slideDirection.value = 'left'
    selectedIndex.value =
      selectedIndex.value === photos.value.length - 1 ? 0 : selectedIndex.value + 1
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (!isLightboxOpen.value) return

    switch (event.key) {
      case 'Escape':
        if (lightboxMode.value === 'grid') {
          lightboxMode.value = 'single'
        } else {
          closeLightbox()
        }
        break
      case 'ArrowLeft':
        if (lightboxMode.value === 'single') goToPrevious()
        break
      case 'ArrowRight':
        if (lightboxMode.value === 'single') goToNext()
        break
      case 'g':
      case 'G':
        toggleLightboxMode()
        break
    }
  }

  const touchStartX = ref(0)
  const touchEndX = ref(0)

  const handleTouchStart = (e: TouchEvent): void => {
    touchStartX.value = e.touches[0]?.clientX ?? 0
  }

  const handleTouchMove = (e: TouchEvent): void => {
    touchEndX.value = e.touches[0]?.clientX ?? 0
  }

  const handleTouchEnd = (): void => {
    const diff = touchStartX.value - touchEndX.value
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }

    touchStartX.value = 0
    touchEndX.value = 0
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    fetchPublicGallery()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  })
</script>

<template>
  <section
    class="py-12 sm:py-16 px-4 sm:px-6 bg-sand dark:bg-dark-bg transition-colors duration-300"
  >
    <div class="max-w-4xl mx-auto">
      <h2
        class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark dark:text-sage-light mb-2"
      >
        {{ t.gallery.title }}
      </h2>
      <p
        class="font-body text-sm sm:text-base text-center text-charcoal-light dark:text-dark-text-secondary mb-6 sm:mb-8"
      >
        {{ t.gallery.subtitle }}
      </p>

      <!-- Loading State -->
      <div v-if="isLoadingPhotos" class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div
          v-for="i in 6"
          :key="i"
          class="aspect-square bg-charcoal/10 dark:bg-dark-text/10 rounded-lg animate-pulse"
        ></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="photos.length === 0"
        class="py-6 px-4 rounded-lg bg-charcoal/5 dark:bg-dark-text/5 border border-dashed border-charcoal/20 dark:border-dark-text/20 text-center"
      >
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary italic">
          {{ t.placeholder?.galleryInfo ?? 'No photos in the gallery yet' }}
        </p>
      </div>

      <!-- Photos Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <button
          v-for="(photo, index) in visiblePhotos"
          :key="photo.src"
          type="button"
          class="aspect-square overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
          @click="openLightbox(index)"
        >
          <img
            :src="photo.src"
            :alt="photo.alt ?? `Photo ${index + 1}`"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </button>

        <div v-if="hasMorePhotos" class="col-span-full mt-4 text-center">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-6 py-3 font-body text-sm font-medium text-sage-dark dark:text-sage-light border-2 border-sage dark:border-sage-light rounded-full hover:bg-sage hover:text-white dark:hover:bg-sage-light dark:hover:text-dark-bg transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
            @click="openLightbox(0)"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            {{ t.gallery.viewAll }} ({{ photos.length }})
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isLightboxOpen"
          class="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          @click.self="lightboxMode === 'single' ? closeLightbox() : (lightboxMode = 'single')"
        >
          <div class="flex-shrink-0 flex items-center justify-between p-3 sm:p-4">
            <p class="font-body text-sm text-white/80">
              {{ photoCounter }}
            </p>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="p-2 text-white/80 hover:text-white transition-colors rounded-lg"
                :class="lightboxMode === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'"
                :aria-label="lightboxMode === 'grid' ? t.gallery.close : t.gallery.viewAll"
                @click="toggleLightboxMode"
              >
                <svg
                  class="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>

              <button
                type="button"
                class="p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
                :aria-label="t.gallery.close"
                @click="closeLightbox"
              >
                <svg
                  class="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div
            v-if="lightboxMode === 'single'"
            class="flex-1 flex items-center justify-center relative min-h-0"
          >
            <button
              type="button"
              class="absolute left-2 sm:left-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-full"
              :aria-label="t.gallery.previous"
              @click="goToPrevious"
            >
              <svg
                class="w-8 h-8 sm:w-10 sm:h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              class="absolute right-2 sm:right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-full"
              :aria-label="t.gallery.next"
              @click="goToNext"
            >
              <svg
                class="w-8 h-8 sm:w-10 sm:h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div
              class="max-w-[90vw] max-h-full flex items-center justify-center px-12 sm:px-16"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <Transition
                :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'"
                mode="out-in"
              >
                <img
                  v-if="currentPhoto"
                  :key="selectedIndex ?? 0"
                  :src="currentPhoto.src"
                  :alt="currentPhoto.alt ?? 'Gallery photo'"
                  class="max-w-full max-h-[60vh] sm:max-h-[65vh] object-contain select-none"
                  draggable="false"
                />
              </Transition>
            </div>
          </div>

          <div v-else class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              <button
                v-for="(photo, index) in photos"
                :key="photo.src"
                type="button"
                class="aspect-square overflow-hidden rounded-lg transition-all"
                :class="
                  index === selectedIndex
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                    : 'opacity-70 hover:opacity-100'
                "
                @click="jumpToPhoto(index)"
              >
                <img
                  :src="photo.src"
                  :alt="photo.alt ?? `Photo ${index + 1}`"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            </div>
          </div>

          <div
            v-if="lightboxMode === 'single' && photos.length > 1"
            class="flex-shrink-0 p-3 sm:p-4 bg-black/50"
          >
            <div ref="thumbnailStripRef" class="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                v-for="(photo, index) in photos"
                :key="photo.src"
                type="button"
                class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 overflow-hidden rounded-md transition-all"
                :class="
                  index === selectedIndex
                    ? 'ring-2 ring-white opacity-100'
                    : 'opacity-50 hover:opacity-80'
                "
                @click="jumpToPhoto(index)"
              >
                <img
                  :src="photo.src"
                  :alt="photo.alt ?? `Thumbnail ${index + 1}`"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .slide-left-enter-active,
  .slide-left-leave-active {
    transition:
      transform 0.25s ease,
      opacity 0.25s ease;
  }

  .slide-left-enter-from {
    transform: translateX(100px);
    opacity: 0;
  }

  .slide-left-leave-to {
    transform: translateX(-100px);
    opacity: 0;
  }

  .slide-right-enter-active,
  .slide-right-leave-active {
    transition:
      transform 0.25s ease,
      opacity 0.25s ease;
  }

  .slide-right-enter-from {
    transform: translateX(-100px);
    opacity: 0;
  }

  .slide-right-leave-to {
    transform: translateX(100px);
    opacity: 0;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
