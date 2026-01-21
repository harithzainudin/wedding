<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { weddingConfig } from '@/config/wedding'
  import { generateGoogleCalendarUrl } from '@/composables/useCalendar'
  import { useLanguage } from '@/composables/useLanguage'
  import { useVenueConfig } from '@/composables/useVenueConfig'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'

  withDefaults(
    defineProps<{
      showRsvpButton?: boolean
      showGiftsButton?: boolean
    }>(),
    {
      showRsvpButton: true,
      showGiftsButton: true,
    }
  )

  const router = useRouter()
  const { t } = useLanguage()
  const { venue } = useVenueConfig()
  const { getDisplayNameOrder, currentWeddingSlug } = usePublicWeddingData()

  // Navigation popup state
  const showNavPopup = ref(false)

  // Drag gesture state
  const isDragging = ref(false)
  const dragStartY = ref(0)
  const dragCurrentY = ref(0)
  const dragOffset = ref(0)

  // Threshold to close (in pixels)
  const CLOSE_THRESHOLD = 100

  // Computed drag transform
  const dragTransform = computed(() => {
    if (!isDragging.value || dragOffset.value <= 0) return ''
    return `translateY(${dragOffset.value}px)`
  })

  // Touch/Mouse event handlers for drag gesture
  const handleDragStart = (e: TouchEvent | MouseEvent): void => {
    isDragging.value = true
    dragStartY.value = 'touches' in e ? e.touches[0]!.clientY : e.clientY
    dragCurrentY.value = dragStartY.value
    dragOffset.value = 0
  }

  const handleDragMove = (e: TouchEvent | MouseEvent): void => {
    if (!isDragging.value) return

    dragCurrentY.value = 'touches' in e ? e.touches[0]!.clientY : e.clientY
    const diff = dragCurrentY.value - dragStartY.value

    // Only allow dragging down (positive diff)
    dragOffset.value = Math.max(0, diff)
  }

  const handleDragEnd = (): void => {
    if (!isDragging.value) return

    isDragging.value = false

    // If dragged past threshold, close the sheet
    if (dragOffset.value > CLOSE_THRESHOLD) {
      closeNavPopup()
    }

    // Reset drag offset (will animate back if not closing)
    dragOffset.value = 0
  }

  // Reset drag state when popup closes
  watch(showNavPopup, (newVal) => {
    if (!newVal) {
      isDragging.value = false
      dragOffset.value = 0
    }
  })

  const openGoogleMaps = (): void => {
    window.open(venue.value.googleMapsUrl, '_blank')
    showNavPopup.value = false
  }

  const openWaze = (): void => {
    window.open(venue.value.wazeUrl, '_blank')
    showNavPopup.value = false
  }

  // Generate Apple Maps URL from coordinates
  const appleMapsUrl = computed(() => {
    const { lat, lng } = venue.value.coordinates
    const venueName = encodeURIComponent(venue.value.venueName)
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${venueName}`
  })

  const openAppleMaps = (): void => {
    window.open(appleMapsUrl.value, '_blank')
    showNavPopup.value = false
  }

  const toggleNavPopup = (): void => {
    showNavPopup.value = !showNavPopup.value
  }

  const closeNavPopup = (): void => {
    showNavPopup.value = false
  }

  const addToCalendar = (): void => {
    const url = generateGoogleCalendarUrl(weddingConfig, getDisplayNameOrder())
    window.open(url, '_blank')
  }

  const goToGifts = (): void => {
    const path = currentWeddingSlug.value ? `/${currentWeddingSlug.value}/gifts` : '/gifts'
    router.push(path)
  }

  const scrollToRsvp = (): void => {
    const rsvpSection = document.getElementById('rsvp')
    if (rsvpSection) {
      rsvpSection.scrollIntoView({ behavior: 'smooth' })
    }
  }
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary border-t border-sand-dark dark:border-dark-border p-3 z-50 shadow-[0_-4px_6px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_rgba(0,0,0,0.3)] transition-colors duration-300"
  >
    <div class="flex justify-around items-center max-w-md mx-auto">
      <!-- Navigate (Combined Maps/Waze) -->
      <button
        type="button"
        class="flex flex-col items-center gap-1 p-2 bg-transparent border-none text-charcoal dark:text-dark-text cursor-pointer font-body text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-sage dark:hover:text-sage-light"
        aria-label="Get Directions"
        @click="toggleNavPopup"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"
          />
        </svg>
        <span>{{ t.nav.navigate || 'Navigate' }}</span>
      </button>

      <!-- Calendar -->
      <button
        type="button"
        class="flex flex-col items-center gap-1 p-2 bg-transparent border-none text-charcoal dark:text-dark-text cursor-pointer font-body text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-sage dark:hover:text-sage-light"
        aria-label="Add to Calendar"
        @click="addToCalendar"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
          />
        </svg>
        <span>{{ t.nav.calendar }}</span>
      </button>

      <!-- Gifts -->
      <button
        v-if="showGiftsButton"
        type="button"
        class="flex flex-col items-center gap-1 p-2 bg-transparent border-none text-charcoal dark:text-dark-text cursor-pointer font-body text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-sage dark:hover:text-sage-light"
        aria-label="View Gift Registry"
        @click="goToGifts"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"
          />
        </svg>
        <span>{{ t.nav.gifts || 'Gifts' }}</span>
      </button>

      <!-- RSVP Button -->
      <button
        v-if="showRsvpButton"
        type="button"
        class="flex items-center gap-1 px-4 py-2 bg-sage text-white rounded-full font-body text-xs font-medium uppercase tracking-wider transition-colors hover:bg-sage-dark cursor-pointer"
        @click="scrollToRsvp"
      >
        RSVP
      </button>
    </div>

    <!-- Navigation Popup (Bottom Sheet) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showNavPopup" class="fixed inset-0 bg-black/50 z-[60]" @click="closeNavPopup" />
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="showNavPopup"
          class="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary rounded-t-2xl z-[61] shadow-xl"
          :class="{ 'transition-transform duration-200': !isDragging }"
          :style="{ transform: dragTransform }"
        >
          <!-- Drag Handle Area -->
          <div
            class="touch-none select-none cursor-grab active:cursor-grabbing"
            @touchstart.passive="handleDragStart"
            @touchmove.passive="handleDragMove"
            @touchend="handleDragEnd"
            @mousedown="handleDragStart"
            @mousemove="handleDragMove"
            @mouseup="handleDragEnd"
            @mouseleave="handleDragEnd"
          >
            <!-- Handle bar visual indicator -->
            <button
              type="button"
              class="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing group"
              @click="closeNavPopup"
              aria-label="Drag down or tap to close"
            >
              <div
                class="w-10 h-1 bg-sand-dark dark:bg-gray-600 rounded-full group-hover:bg-charcoal-light dark:group-hover:bg-gray-500 transition-colors"
                :class="{ 'bg-charcoal-light dark:bg-gray-500': isDragging }"
              />
            </button>

            <!-- Header (also draggable) -->
            <div class="px-6 pb-4 border-b border-sand-dark dark:border-dark-border">
              <h3 class="font-heading text-lg text-charcoal dark:text-dark-text text-center">
                {{ t.nav.getDirections || 'Get Directions' }}
              </h3>
            </div>
          </div>

          <!-- Options -->
          <div class="p-4 space-y-2">
            <!-- Google Maps -->
            <button
              type="button"
              class="w-full flex items-center gap-4 p-4 rounded-xl bg-sand dark:bg-dark-bg hover:bg-sand-dark dark:hover:bg-dark-border transition-colors cursor-pointer"
              @click="openGoogleMaps"
            >
              <div
                class="w-12 h-12 rounded-full bg-white dark:bg-dark-bg-secondary flex items-center justify-center shadow-sm"
              >
                <svg class="w-7 h-7 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <p class="font-body font-medium text-charcoal dark:text-dark-text">
                  {{ t.nav.googleMaps || 'Google Maps' }}
                </p>
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                  {{ t.nav.openInApp || 'Open in app or browser' }}
                </p>
              </div>
              <svg
                class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <!-- Waze -->
            <button
              type="button"
              class="w-full flex items-center gap-4 p-4 rounded-xl bg-sand dark:bg-dark-bg hover:bg-sand-dark dark:hover:bg-dark-border transition-colors cursor-pointer"
              @click="openWaze"
            >
              <div
                class="w-12 h-12 rounded-full bg-white dark:bg-dark-bg-secondary flex items-center justify-center shadow-sm"
              >
                <svg class="w-7 h-7 text-[#33CCFF]" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C6.5 2 2 6.5 2 12c0 2.6 1 5 2.7 6.8-.2.7-.6 1.8-1.3 3.2 2.1-.5 3.7-1.1 4.7-1.5.9.3 2 .5 3.1.5h.8c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-.9 0-1.8-.1-2.6-.4l-.5-.2-.5.2c-.6.2-1.5.5-2.7.9.4-.8.7-1.5.8-2l.2-.6-.4-.5C5 15.8 4 13.9 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"
                  />
                  <circle cx="8.5" cy="11" r="1.5" />
                  <circle cx="15.5" cy="11" r="1.5" />
                  <path d="M12 17c2 0 3.7-1.2 4.5-3h-9c.8 1.8 2.5 3 4.5 3z" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <p class="font-body font-medium text-charcoal dark:text-dark-text">Waze</p>
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                  {{ t.nav.openInApp || 'Open in app or browser' }}
                </p>
              </div>
              <svg
                class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <!-- Apple Maps -->
            <button
              type="button"
              class="w-full flex items-center gap-4 p-4 rounded-xl bg-sand dark:bg-dark-bg hover:bg-sand-dark dark:hover:bg-dark-border transition-colors cursor-pointer"
              @click="openAppleMaps"
            >
              <div
                class="w-12 h-12 rounded-full bg-white dark:bg-dark-bg-secondary flex items-center justify-center shadow-sm"
              >
                <svg
                  class="w-7 h-7 text-[#000000] dark:text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 3.17 1.86 5.91 4.55 7.2L12 22l2.45-5.8C17.14 14.91 19 12.17 19 9c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <p class="font-body font-medium text-charcoal dark:text-dark-text">
                  {{ t.nav.appleMaps || 'Apple Maps' }}
                </p>
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                  {{ t.nav.bestForIphone || 'Best for iPhone users' }}
                </p>
              </div>
              <svg
                class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <!-- Cancel button -->
          <div class="p-4 pt-0">
            <button
              type="button"
              class="w-full py-3 font-body font-medium text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
              @click="closeNavPopup"
            >
              {{ t.common?.cancel || 'Cancel' }}
            </button>
          </div>

          <!-- Safe area padding for iOS -->
          <div class="h-safe-bottom" />
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

<style scoped>
  /* Fade transition for backdrop */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* Slide up transition for bottom sheet */
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: transform 0.3s ease;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(100%);
  }

  /* iOS safe area */
  .h-safe-bottom {
    height: env(safe-area-inset-bottom, 0px);
  }
</style>
