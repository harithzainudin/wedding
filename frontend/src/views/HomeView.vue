<script setup lang="ts">
  import { watch, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import LayoutWrapper from '@/components/layouts/LayoutWrapper.vue'
  import WeddingUnavailable from '@/components/ui/WeddingUnavailable.vue'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { useDesign } from '@/composables/useDesign'
  import type { DesignSettings } from '@/types/design'

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

  // Design/layout settings
  const { designSettings, loadDesign } = useDesign()

  // Fetch data when wedding slug is available
  // Always force refresh to ensure we get the latest wedding status
  // This handles cases where status changed (draft/archived) since last visit
  watch(
    weddingSlug,
    async (slug) => {
      if (slug) {
        // Load both wedding data and design settings
        await Promise.all([
          fetchPublicData(slug, true), // Force refresh to get latest status
          loadDesign(slug, true),
        ])
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

  <!-- Layout-driven wedding page -->
  <LayoutWrapper
    v-else
    :design-settings="designSettings as DesignSettings"
    :show-rsvp-section="showRsvpSection()"
    :is-accepting-rsvps="isAcceptingRsvps()"
    v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
  />
</template>
