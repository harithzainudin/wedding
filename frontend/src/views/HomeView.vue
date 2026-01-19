<script setup lang="ts">
  import { watch, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import HeroSection from '@/components/sections/HeroSection.vue'
  import DetailsSection from '@/components/sections/DetailsSection.vue'
  import GallerySection from '@/components/sections/GallerySection.vue'
  import ScheduleSection from '@/components/sections/ScheduleSection.vue'
  import ContactSection from '@/components/sections/ContactSection.vue'
  import QRCodeHubSection from '@/components/sections/QRCodeHubSection.vue'
  import GuestbookSection from '@/components/sections/GuestbookSection.vue'
  import WishlistSection from '@/components/sections/WishlistSection.vue'
  import RsvpSection from '@/components/sections/RsvpSection.vue'
  import StickyNavigation from '@/components/ui/StickyNavigation.vue'
  import WeddingUnavailable from '@/components/ui/WeddingUnavailable.vue'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'

  useDocumentTitle({ text: 'Wedding Ceremony', position: 'suffix' })

  const route = useRoute()

  // Get the wedding slug from route params
  // Only return valid slugs - reject 'undefined' and other invalid values
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    if (typeof slug !== 'string') return null
    // Reject the literal string "undefined" (can happen from accidental coercion)
    if (slug === 'undefined') return null
    return slug
  })

  // Fetch all public wedding data once at the top level
  const {
    fetchPublicData,
    weddingError,
    isLoading,
    hasLoaded,
    showRsvpSection,
    isAcceptingRsvps,
    getRsvpDeadline,
  } = usePublicWeddingData()

  // Fetch data when wedding slug is available
  // Always force refresh to ensure we get the latest wedding status
  // This handles cases where status changed (draft/archived) since last visit
  watch(
    weddingSlug,
    (slug) => {
      if (slug) {
        fetchPublicData(slug, true) // Force refresh to get latest status
      }
    },
    { immediate: true }
  )

  // Show error page if wedding is unavailable
  const showErrorPage = computed(() => {
    return hasLoaded.value && weddingError.value !== null
  })

  // Computed property to capture rsvp deadline value once
  const rsvpDeadline = computed(() => getRsvpDeadline())
</script>

<template>
  <!-- Loading state -->
  <main
    v-if="isLoading && !hasLoaded"
    class="min-h-screen bg-sand flex items-center justify-center"
  >
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sage mx-auto mb-4"></div>
      <p class="font-body text-charcoal-light">Loading...</p>
    </div>
  </main>

  <!-- Error page for archived/draft/not found weddings -->
  <WeddingUnavailable v-else-if="showErrorPage" :error-type="weddingError" />

  <!-- Normal wedding page -->
  <main v-else class="min-h-screen">
    <HeroSection />
    <DetailsSection />
    <GallerySection />
    <ScheduleSection />
    <ContactSection />
    <QRCodeHubSection />
    <GuestbookSection />
    <WishlistSection />
    <RsvpSection
      v-if="showRsvpSection()"
      :show-rsvp="true"
      :is-accepting-rsvps="isAcceptingRsvps()"
      v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
    />
    <StickyNavigation :show-rsvp-button="showRsvpSection()" />
  </main>
</template>
