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
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
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
