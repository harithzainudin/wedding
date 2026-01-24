<script setup lang="ts">
  /**
   * Page Slideshow Layout
   *
   * Horizontal slides, one section per page.
   * User swipes or uses arrows to navigate between sections.
   */
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import type { DesignSettings, SectionConfig } from '@/types/design'
  import SectionRenderer from './SectionRenderer.vue'

  const props = defineProps<{
    designSettings: DesignSettings
    visibleSections: SectionConfig[]
    showRsvpSection: boolean
    isAcceptingRsvps: boolean
    rsvpDeadline?: string
  }>()

  const currentIndex = ref(0)
  const touchStartX = ref(0)
  const touchEndX = ref(0)
  const isAnimating = ref(false)

  // Get slideshow settings with defaults
  const slideshowSettings = computed(() => ({
    showDots: props.designSettings.pageSlideshow?.showDots ?? true,
    showArrows: props.designSettings.pageSlideshow?.showArrows ?? true,
    autoPlay: props.designSettings.pageSlideshow?.autoPlay ?? false,
    autoPlayInterval: props.designSettings.pageSlideshow?.autoPlayInterval ?? 5,
  }))

  const totalSlides = computed(() => props.visibleSections.length)

  const canGoNext = computed(() => currentIndex.value < totalSlides.value - 1)
  const canGoPrev = computed(() => currentIndex.value > 0)

  const goToSlide = (index: number) => {
    if (isAnimating.value) return
    if (index < 0 || index >= totalSlides.value) return

    isAnimating.value = true
    currentIndex.value = index

    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }

  const nextSlide = () => {
    if (canGoNext.value) {
      goToSlide(currentIndex.value + 1)
    }
  }

  const prevSlide = () => {
    if (canGoPrev.value) {
      goToSlide(currentIndex.value - 1)
    }
  }

  // Touch handlers for swipe
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0]?.clientX ?? 0
  }

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.value = e.touches[0]?.clientX ?? 0
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.value - touchEndX.value
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }
  }

  // Keyboard navigation
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      nextSlide()
    } else if (e.key === 'ArrowLeft') {
      prevSlide()
    }
  }

  // Auto-play
  let autoPlayInterval: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)

    if (slideshowSettings.value.autoPlay) {
      autoPlayInterval = setInterval(() => {
        if (canGoNext.value) {
          nextSlide()
        } else {
          currentIndex.value = 0
        }
      }, slideshowSettings.value.autoPlayInterval * 1000)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval)
    }
  })
</script>

<template>
  <main
    class="h-screen overflow-hidden relative"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Slides Container -->
    <div
      class="flex h-full transition-transform duration-500 ease-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="section in visibleSections"
        :key="section.id"
        class="min-w-full h-full overflow-y-auto"
      >
        <SectionRenderer
          :section-id="section.id"
          :show-rsvp-section="showRsvpSection"
          :is-accepting-rsvps="isAcceptingRsvps"
          v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
        />
      </div>
    </div>

    <!-- Navigation Arrows (Desktop) -->
    <template v-if="slideshowSettings.showArrows">
      <button
        v-if="canGoPrev"
        type="button"
        class="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-dark-bg-secondary/80 backdrop-blur-sm rounded-full items-center justify-center shadow-lg hover:bg-white dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer z-10"
        @click="prevSlide"
      >
        <svg
          class="w-6 h-6 text-charcoal dark:text-dark-text"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        v-if="canGoNext"
        type="button"
        class="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-dark-bg-secondary/80 backdrop-blur-sm rounded-full items-center justify-center shadow-lg hover:bg-white dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer z-10"
        @click="nextSlide"
      >
        <svg
          class="w-6 h-6 text-charcoal dark:text-dark-text"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </template>

    <!-- Dot Navigation -->
    <div
      v-if="slideshowSettings.showDots"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10"
    >
      <button
        v-for="(_, index) in visibleSections"
        :key="index"
        type="button"
        class="w-3 h-3 rounded-full transition-all duration-300 cursor-pointer"
        :class="
          index === currentIndex
            ? 'bg-sage scale-125'
            : 'bg-charcoal-light/30 dark:bg-dark-text-secondary/30 hover:bg-charcoal-light/50'
        "
        @click="goToSlide(index)"
      />
    </div>

    <!-- Swipe Hint (Mobile) -->
    <div
      v-if="currentIndex === 0"
      class="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-charcoal-light dark:text-dark-text-secondary text-sm animate-pulse"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Swipe to navigate</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </main>
</template>
