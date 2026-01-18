<script setup lang="ts">
  import { RouterView, useRoute } from 'vue-router'
  import { watch, computed } from 'vue'
  import { useVenueConfig } from '@/composables/useVenueConfig'
  import { useTheme } from '@/composables/useTheme'
  import LoadingOverlay from '@/components/ui/LoadingOverlay.vue'

  const route = useRoute()
  const { loadVenue } = useVenueConfig()
  const { loadTheme, applyStoredTheme } = useTheme()

  // Get the wedding slug from route params
  // Only return valid slugs - reject 'undefined', 'superadmin', and other invalid values
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    if (typeof slug !== 'string') return null
    // Reject the literal string "undefined" (can happen from accidental coercion)
    // Reject "superadmin" as it's a reserved route, not a wedding slug
    if (slug === 'undefined' || slug === 'superadmin') return null
    return slug
  })

  // Apply stored theme immediately to prevent flash
  applyStoredTheme()

  // Load venue and theme data when wedding slug is available or changes
  watch(
    weddingSlug,
    (slug) => {
      if (slug) {
        loadVenue(slug)
        loadTheme(slug)
      }
    },
    { immediate: true }
  )
</script>

<template>
  <RouterView />
  <LoadingOverlay />
</template>
