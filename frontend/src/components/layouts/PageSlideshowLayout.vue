<script setup lang="ts">
  /**
   * Page Slideshow Layout
   *
   * Horizontal slides, one section per page.
   * User swipes or uses arrows to navigate between sections.
   */
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import type { DesignSettings, SectionConfig } from '@/types/design'
  import SectionRenderer from './SectionRenderer.vue'
  import FloatingActionMenu from '@/components/ui/FloatingActionMenu.vue'
  import { useLayoutNavigation } from '@/composables/useLayoutNavigation'
  import { useMusicHint } from '@/composables/useMusicHint'

  const { registerGoToFirstSection, notifySectionChange } = useLayoutNavigation()
  const { markUserEngaged } = useMusicHint()

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
  const touchStartedOnInteractive = ref(false)

  // Check if an element or its parents are interactive (should not trigger swipe)
  const isInteractiveElement = (element: HTMLElement | null): boolean => {
    if (!element) return false

    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']
    const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'slider', 'switch', 'tab']

    let current: HTMLElement | null = element
    while (current && current !== document.body) {
      // Check tag name
      if (interactiveTags.includes(current.tagName)) return true

      // Check role attribute
      const role = current.getAttribute('role')
      if (role && interactiveRoles.includes(role)) return true

      // Check if it has click handlers or is explicitly interactive
      if (current.onclick || current.hasAttribute('data-interactive')) return true

      // Check for common interactive class patterns
      if (
        current.classList.contains('cursor-pointer') ||
        current.classList.contains('btn') ||
        current.classList.contains('clickable')
      )
        return true

      current = current.parentElement
    }
    return false
  }

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
    // Check if touch started on an interactive element
    touchStartedOnInteractive.value = isInteractiveElement(e.target as HTMLElement)

    // Still record position for non-interactive swipes
    touchStartX.value = e.touches[0]?.clientX ?? 0
    touchEndX.value = touchStartX.value // Reset end position
  }

  const handleTouchMove = (e: TouchEvent) => {
    // Skip if touch started on interactive element
    if (touchStartedOnInteractive.value) return
    touchEndX.value = e.touches[0]?.clientX ?? 0
  }

  const handleTouchEnd = () => {
    // Skip swipe detection if touch started on interactive element
    if (touchStartedOnInteractive.value) {
      touchStartedOnInteractive.value = false
      return
    }

    const diff = touchStartX.value - touchEndX.value
    const threshold = 80 // Increased threshold to reduce accidental swipes

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    touchStartedOnInteractive.value = false
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

  // Watch for slide changes and notify layout navigation
  watch(
    currentIndex,
    (newIndex) => {
      notifySectionChange(newIndex)
      // Mark user as engaged when they navigate past the first slide
      if (newIndex > 0) {
        markUserEngaged()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    // Register navigation function for MusicHint and other components
    registerGoToFirstSection(() => goToSlide(0))

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

    <!-- Floating Action Menu -->
    <FloatingActionMenu :show-rsvp-button="showRsvpSection" />
  </main>
</template>
