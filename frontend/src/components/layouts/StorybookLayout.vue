<script setup lang="ts">
  /**
   * Storybook Layout
   *
   * Vertical page-by-page layout with scroll-snap.
   * Each section is a "page" that snaps into view.
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

  const containerRef = ref<HTMLElement | null>(null)
  const currentPageIndex = ref(0)

  // Get storybook settings with defaults
  const storybookSettings = computed(() => ({
    showPageNumbers: props.designSettings.storybook?.showPageNumbers ?? true,
  }))

  const totalPages = computed(() => props.visibleSections.length)

  // Update current page based on scroll position
  const handleScroll = () => {
    if (!containerRef.value) return

    const scrollTop = containerRef.value.scrollTop
    const pageHeight = containerRef.value.clientHeight
    const newIndex = Math.round(scrollTop / pageHeight)

    if (newIndex !== currentPageIndex.value && newIndex >= 0 && newIndex < totalPages.value) {
      currentPageIndex.value = newIndex
    }
  }

  // Navigate to a specific page
  const goToPage = (index: number) => {
    if (!containerRef.value) return
    if (index < 0 || index >= totalPages.value) return

    const pageHeight = containerRef.value.clientHeight
    containerRef.value.scrollTo({
      top: index * pageHeight,
      behavior: 'smooth',
    })
  }

  // Watch for page changes and notify layout navigation
  watch(
    currentPageIndex,
    (newIndex) => {
      notifySectionChange(newIndex)
      // Mark user as engaged when they navigate past the first page
      if (newIndex > 0) {
        markUserEngaged()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    // Register navigation function for MusicHint and other components
    registerGoToFirstSection(() => goToPage(0))

    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })
</script>

<template>
  <main ref="containerRef" class="h-screen overflow-y-auto snap-y snap-mandatory">
    <!-- Pages -->
    <div
      v-for="(section, index) in visibleSections"
      :key="section.id"
      class="min-h-screen snap-start snap-always overflow-y-auto relative"
    >
      <SectionRenderer
        :section-id="section.id"
        :show-rsvp-section="showRsvpSection"
        :is-accepting-rsvps="isAcceptingRsvps"
        v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
      />

      <!-- Scroll indicator for first page -->
      <div
        v-if="index === 0"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-charcoal-light dark:text-dark-text-secondary animate-bounce"
      >
        <span class="text-sm font-body">Scroll</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>

    <!-- Page Indicator (Right Side) -->
    <div
      v-if="storybookSettings.showPageNumbers"
      class="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10"
    >
      <button
        v-for="(_, index) in visibleSections"
        :key="index"
        type="button"
        class="group flex items-center gap-2 cursor-pointer"
        @click="goToPage(index)"
      >
        <span
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="
            index === currentPageIndex
              ? 'bg-sage w-3 h-3'
              : 'bg-charcoal-light/30 dark:bg-dark-text-secondary/30 group-hover:bg-charcoal-light/50'
          "
        />
        <span
          class="text-xs font-body opacity-0 group-hover:opacity-100 transition-opacity text-charcoal dark:text-dark-text"
        >
          {{ index + 1 }}
        </span>
      </button>
    </div>

    <!-- Current Page Number (Bottom Right) -->
    <div
      v-if="storybookSettings.showPageNumbers"
      class="fixed bottom-6 right-6 bg-white/80 dark:bg-dark-bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-10"
    >
      <span class="font-body text-sm text-charcoal dark:text-dark-text">
        {{ currentPageIndex + 1 }} / {{ totalPages }}
      </span>
    </div>

    <!-- Floating Action Menu -->
    <FloatingActionMenu :show-rsvp-button="showRsvpSection" />
  </main>
</template>

<style scoped>
  /* Hide scrollbar but keep functionality */
  main {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  main::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
</style>
