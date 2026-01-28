<script setup lang="ts">
  /**
   * Invitation Card Layout
   *
   * Opens like a physical invitation card with a cover page.
   * User clicks/taps to "open" the card and reveal content.
   */
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import type { DesignSettings, SectionConfig } from '@/types/design'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { useNameOrder } from '@/composables/useNameOrder'
  import { useLanguage } from '@/composables/useLanguage'
  import SectionRenderer from './SectionRenderer.vue'
  import StickyNavigation from '@/components/ui/StickyNavigation.vue'

  const props = defineProps<{
    designSettings: DesignSettings
    visibleSections: SectionConfig[]
    showRsvpSection: boolean
    isAcceptingRsvps: boolean
    rsvpDeadline?: string
  }>()

  const { weddingDetails } = usePublicWeddingData()
  const { orderedCouple } = useNameOrder()
  const { t } = useLanguage()

  const isCardOpen = ref(false)
  const isAnimating = ref(false)

  // Get card settings with defaults
  const cardSettings = computed(() => ({
    showCoverText: props.designSettings.invitationCard?.showCoverText ?? true,
    showCoverDate: props.designSettings.invitationCard?.showCoverDate ?? true,
    autoOpenDelay: props.designSettings.invitationCard?.autoOpenDelay ?? 0,
  }))

  // Format wedding date for cover
  const formattedDate = computed(() => {
    if (!weddingDetails.value?.eventDate) return ''
    try {
      return new Date(weddingDetails.value.eventDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  })

  // Helper to split name by newlines for multi-line display
  const splitNameLines = (name: string | undefined): string[] => {
    if (!name) return []
    return name
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  // Get first person's name lines (respects display order)
  const firstNameLines = computed(() => {
    const fullName =
      orderedCouple.value.first?.fullName || orderedCouple.value.first?.nickname || ''
    return splitNameLines(fullName)
  })

  // Get second person's name lines (respects display order)
  const secondNameLines = computed(() => {
    const fullName =
      orderedCouple.value.second?.fullName || orderedCouple.value.second?.nickname || ''
    return splitNameLines(fullName)
  })

  // Check if we have any names to display
  const hasNames = computed(
    () => firstNameLines.value.length > 0 || secondNameLines.value.length > 0
  )

  const openCard = () => {
    if (isAnimating.value) return
    isAnimating.value = true
    isCardOpen.value = true

    // Scroll to top when opening
    window.scrollTo(0, 0)

    // Unlock body scroll
    document.body.style.overflow = ''

    // Allow animation to complete
    setTimeout(() => {
      isAnimating.value = false
    }, 800)
  }

  // Lock scroll when cover is showing, auto-open functionality
  onMounted(() => {
    // Lock scroll when cover is showing
    if (!isCardOpen.value) {
      document.body.style.overflow = 'hidden'
    }

    // Auto-open after delay if configured
    if (cardSettings.value.autoOpenDelay > 0) {
      setTimeout(() => {
        openCard()
      }, cardSettings.value.autoOpenDelay * 1000)
    }
  })

  // Cleanup: restore scroll if component unmounts while cover is showing
  onUnmounted(() => {
    document.body.style.overflow = ''
  })
</script>

<template>
  <!-- Cover Page -->
  <Transition name="fade-scale">
    <div
      v-if="!isCardOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sand via-sand to-sand-dark dark:from-dark-bg dark:via-dark-bg-secondary dark:to-dark-bg"
    >
      <div class="text-center px-6 max-w-lg">
        <!-- Decorative Top -->
        <div class="mb-8">
          <svg
            class="w-16 h-16 mx-auto text-sage opacity-60"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>

        <!-- Couple Names - Multi-line Support -->
        <div v-if="cardSettings.showCoverText && hasNames" class="mb-4">
          <!-- First Person's Name (multi-line) -->
          <div class="mb-2">
            <p
              v-for="(line, index) in firstNameLines"
              :key="`first-${index}`"
              class="font-heading text-3xl sm:text-4xl md:text-5xl text-charcoal dark:text-dark-text leading-tight"
            >
              {{ line }}
            </p>
          </div>

          <!-- Ampersand Separator -->
          <p
            class="font-heading text-2xl sm:text-3xl text-charcoal-light dark:text-dark-text-secondary my-3"
          >
            &amp;
          </p>

          <!-- Second Person's Name (multi-line) -->
          <div class="mt-2">
            <p
              v-for="(line, index) in secondNameLines"
              :key="`second-${index}`"
              class="font-heading text-3xl sm:text-4xl md:text-5xl text-charcoal dark:text-dark-text leading-tight"
            >
              {{ line }}
            </p>
          </div>
        </div>

        <!-- Wedding Date -->
        <p
          v-if="cardSettings.showCoverDate && formattedDate"
          class="font-body text-lg sm:text-xl text-charcoal-light dark:text-dark-text-secondary mb-8"
        >
          {{ formattedDate }}
        </p>

        <!-- Open Button -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-8 py-4 bg-sage text-white font-body font-medium text-lg rounded-full shadow-lg hover:bg-sage-dark transition-all duration-300 hover:scale-105 cursor-pointer"
          @click="openCard"
        >
          <span>{{ t.rsvp?.openInvitation ?? 'Open Invitation' }}</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- Tap hint -->
        <p
          class="mt-6 font-body text-sm text-charcoal-light dark:text-dark-text-secondary opacity-60"
        >
          {{ t.common?.tapToOpen ?? 'Tap to open' }}
        </p>
      </div>
    </div>
  </Transition>

  <!-- Main Content -->
  <main
    :class="[
      'min-h-screen pb-20 transition-opacity duration-500',
      isCardOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
    ]"
  >
    <SectionRenderer
      v-for="section in visibleSections"
      :key="section.id"
      :section-id="section.id"
      :show-rsvp-section="showRsvpSection"
      :is-accepting-rsvps="isAcceptingRsvps"
      v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
    />
    <StickyNavigation :show-rsvp-button="showRsvpSection" />
  </main>
</template>

<style scoped>
  .fade-scale-enter-active {
    transition: all 0.5s ease;
  }

  .fade-scale-leave-active {
    transition: all 0.8s ease;
  }

  .fade-scale-enter-from {
    opacity: 0;
    transform: scale(0.95);
  }

  .fade-scale-leave-to {
    opacity: 0;
    transform: scale(1.1);
  }
</style>
