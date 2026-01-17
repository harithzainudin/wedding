<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { ParkingStep, ParkingImage } from '@/types/venue'
  import ParkingDirections from './ParkingDirections.vue'

  interface Props {
    parkingInfo?: string | null
    parkingSteps?: ParkingStep[]
    parkingImages?: ParkingImage[]
    parkingVideoUrl?: string | null
    // Visibility settings from admin
    showParkingImages?: boolean
    showParkingDirections?: boolean
    showParkingVideo?: boolean
    translations: {
      parkingGuide: string
      tapToExpand: string
      directions: string
      videoGuide: string
    }
  }

  const props = withDefaults(defineProps<Props>(), {
    parkingInfo: null,
    parkingSteps: () => [],
    parkingImages: () => [],
    parkingVideoUrl: null,
    showParkingImages: true,
    showParkingDirections: true,
    showParkingVideo: true,
  })

  // Computed visibility checks
  const shouldShowImages = computed(() => {
    return props.showParkingImages && props.parkingImages && props.parkingImages.length > 0
  })

  const shouldShowDirections = computed(() => {
    return props.showParkingDirections && props.parkingSteps && props.parkingSteps.length > 0
  })

  const shouldShowVideo = computed(() => {
    return props.showParkingVideo && props.parkingVideoUrl
  })

  const isExpanded = ref(false)

  // Check if there's any parking content to show (respecting visibility settings)
  const hasParkingContent = computed(() => {
    return (
      props.parkingInfo ||
      shouldShowDirections.value ||
      shouldShowImages.value ||
      shouldShowVideo.value
    )
  })

  // Check if we have content beyond just the basic info (to show expandable)
  const hasExpandableContent = computed(() => {
    return shouldShowDirections.value || shouldShowImages.value || shouldShowVideo.value
  })

  // Extract YouTube video ID from URL
  const youtubeVideoId = computed(() => {
    if (!props.parkingVideoUrl) return null
    const match = props.parkingVideoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    return match ? match[1] : null
  })

  // Current image index for carousel
  const currentImageIndex = ref(0)

  const nextImage = () => {
    if (props.parkingImages && props.parkingImages.length > 0) {
      currentImageIndex.value = (currentImageIndex.value + 1) % props.parkingImages.length
    }
  }

  const prevImage = () => {
    if (props.parkingImages && props.parkingImages.length > 0) {
      currentImageIndex.value =
        (currentImageIndex.value - 1 + props.parkingImages.length) % props.parkingImages.length
    }
  }

  const toggleExpanded = () => {
    if (hasExpandableContent.value) {
      isExpanded.value = !isExpanded.value
    }
  }
</script>

<template>
  <!-- Simple layout when only parking info text (no expandable content) -->
  <div
    v-if="hasParkingContent && !hasExpandableContent && parkingInfo"
    class="mt-2 bg-white/50 dark:bg-dark-bg-elevated/50 rounded-lg p-3 sm:p-4"
  >
    <div class="flex items-start gap-2 sm:gap-3">
      <!-- Parking Icon -->
      <svg
        class="w-4 h-4 sm:w-5 sm:h-5 text-sage flex-shrink-0 mt-0.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"
        />
      </svg>
      <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ parkingInfo }}
      </p>
    </div>
  </div>

  <!-- Expandable layout when there's more content -->
  <div
    v-else-if="hasParkingContent && hasExpandableContent"
    class="mt-2 bg-white/50 dark:bg-dark-bg-elevated/50 rounded-lg overflow-hidden"
  >
    <!-- Header (clickable to expand) -->
    <button
      type="button"
      class="w-full p-3 sm:p-4 flex items-center justify-between gap-2 text-left cursor-pointer"
      @click="toggleExpanded"
    >
      <div class="flex items-center gap-2">
        <!-- Parking Icon -->
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5 text-sage flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"
          />
        </svg>
        <span
          class="font-heading text-sm sm:text-base font-medium text-charcoal dark:text-dark-text"
        >
          {{ translations.parkingGuide }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="!isExpanded"
          class="text-xs text-charcoal-light dark:text-dark-text-secondary hidden sm:inline"
        >
          {{ translations.tapToExpand }}
        </span>
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
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
      </div>
    </button>

    <!-- Expandable content -->
    <div
      class="overflow-hidden transition-all duration-300"
      :class="isExpanded ? 'max-h-[2000px]' : 'max-h-0'"
    >
      <div class="px-3 sm:px-4 pb-3 sm:pb-4 space-y-4">
        <!-- Parking Images Carousel -->
        <div v-if="shouldShowImages" class="relative rounded-lg overflow-hidden">
          <div class="aspect-video bg-sand/30 dark:bg-dark-bg-secondary">
            <img
              :src="parkingImages[currentImageIndex].url"
              :alt="parkingImages[currentImageIndex].caption || 'Parking guide image'"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Navigation arrows (if multiple images) -->
          <template v-if="parkingImages.length > 1">
            <button
              type="button"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              @click.stop="prevImage"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              @click.stop="nextImage"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <!-- Dots indicator -->
            <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              <button
                v-for="(_, index) in parkingImages"
                :key="index"
                type="button"
                class="w-2 h-2 rounded-full transition-colors"
                :class="index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'"
                @click.stop="currentImageIndex = index"
              />
            </div>
          </template>

          <!-- Caption -->
          <p
            v-if="parkingImages[currentImageIndex].caption"
            class="mt-2 font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-center"
          >
            {{ parkingImages[currentImageIndex].caption }}
          </p>
        </div>

        <!-- Step-by-step directions -->
        <ParkingDirections
          v-if="shouldShowDirections"
          :steps="parkingSteps"
          :title="translations.directions"
        />

        <!-- Video embed -->
        <div v-if="shouldShowVideo && youtubeVideoId">
          <p
            class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-2"
          >
            {{ translations.videoGuide }}
          </p>
          <div class="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              :src="`https://www.youtube.com/embed/${youtubeVideoId}`"
              class="w-full h-full"
              frameborder="0"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
              "
              allowfullscreen
            />
          </div>
        </div>

        <!-- Parking text info (shown at bottom when expanded) -->
        <div v-if="parkingInfo">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ parkingInfo }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
