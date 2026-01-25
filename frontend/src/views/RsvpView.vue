<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { RouterLink, useRoute } from 'vue-router'
  import RsvpSection from '@/components/sections/RsvpSection.vue'
  import LanguageToggle from '@/components/ui/LanguageToggle.vue'
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { useNameOrder } from '@/composables/useNameOrder'
  import { getRsvpSettings } from '@/services/api'
  import type { RsvpSettingsResponse } from '@/types/rsvp'

  const route = useRoute()
  const { t } = useLanguage()
  const { orderedCouple } = useNameOrder()

  // Get wedding slug from route params (not from useWeddingContext which is for admin pages)
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })

  // Back link path - always use the wedding slug from route
  const backPath = computed(() => {
    return weddingSlug.value ? `/${weddingSlug.value}` : '/'
  })

  useDocumentTitle({ text: 'RSVP', position: 'prefix' })

  // RSVP settings state
  const rsvpSettings = ref<RsvpSettingsResponse | null>(null)
  const isLoadingSettings = ref(true)
  const settingsError = ref<string | null>(null)

  onMounted(async () => {
    try {
      isLoadingSettings.value = true
      rsvpSettings.value = await getRsvpSettings(weddingSlug.value ?? undefined)
    } catch (error) {
      console.error('Failed to fetch RSVP settings:', error)
      settingsError.value = error instanceof Error ? error.message : 'Failed to load RSVP settings'
    } finally {
      isLoadingSettings.value = false
    }
  })
</script>

<template>
  <main class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
    <!-- Header -->
    <header class="relative pt-16 sm:pt-8 pb-8 px-6 text-center">
      <!-- Controls -->
      <div class="absolute top-4 right-4 z-10 flex gap-2">
        <LanguageToggle variant="light" />
        <DarkModeToggle variant="light" />
      </div>

      <RouterLink
        :to="backPath"
        class="inline-block text-sage hover:text-sage-dark dark:hover:text-sage-light transition-colors cursor-pointer"
      >
        <p class="font-body text-sm uppercase tracking-wider mb-2">
          {{ t.nav.weddingInvitation }}
        </p>
        <h1 class="font-heading text-2xl sm:text-3xl">
          {{ orderedCouple.first.nickname }} &
          {{ orderedCouple.second.nickname }}
        </h1>
      </RouterLink>
    </header>

    <!-- Loading State -->
    <div
      v-if="isLoadingSettings"
      class="py-16 bg-white dark:bg-dark-bg-secondary transition-colors duration-300"
    >
      <div class="text-center">
        <div
          class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    </div>

    <!-- RSVP Form (visibility is controlled by Design Tab) -->
    <RsvpSection
      v-else
      :is-accepting-rsvps="rsvpSettings?.isAcceptingRsvps ?? true"
      v-bind="
        rsvpSettings?.settings.rsvpDeadline
          ? { rsvpDeadline: rsvpSettings.settings.rsvpDeadline }
          : {}
      "
    />

    <!-- Back Link -->
    <div class="text-center pb-8 bg-white dark:bg-dark-bg-secondary transition-colors duration-300">
      <RouterLink
        :to="backPath"
        class="inline-flex items-center gap-2 font-body text-sage hover:text-sage-dark dark:hover:text-sage-light transition-colors"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {{ t.nav.backToInvitation }}
      </RouterLink>
    </div>
  </main>
</template>
