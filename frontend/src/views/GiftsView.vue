<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink, useRoute } from 'vue-router'
  import GiftsPageContent from '@/components/sections/GiftsPageContent.vue'
  import LanguageToggle from '@/components/ui/LanguageToggle.vue'
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { useNameOrder } from '@/composables/useNameOrder'

  const route = useRoute()
  const { t } = useLanguage()
  const { orderedCouple } = useNameOrder()

  // Get wedding slug from route params (not from useWeddingContext which is for admin pages)
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })

  useDocumentTitle({ text: t.value.wishlist?.pageTitle || 'Gift Registry', position: 'prefix' })

  // Get initial category from query params
  const initialCategory = computed(() => {
    const cat = route.query.category
    return typeof cat === 'string' ? cat : 'all'
  })

  // Back link path - always use the wedding slug from route
  const backPath = computed(() => {
    return weddingSlug.value ? `/${weddingSlug.value}` : '/'
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

    <!-- Gifts Content -->
    <GiftsPageContent :initial-category="initialCategory" />

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
