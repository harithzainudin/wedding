<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { useLanguage } from '@/composables/useLanguage'
  import {
    hasValidTokens,
    getStoredIsMaster,
    getStoredUserType,
    getStoredAdminUserType,
    getStoredPrimaryWeddingSlug,
  } from '@/services/tokenManager'
  import LanguageToggle from '@/components/ui/LanguageToggle.vue'
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'

  const router = useRouter()
  const { t } = useLanguage()

  useDocumentTitle({ text: 'Page Not Found', position: 'prefix', static: true })

  // Check if user is logged in
  const isLoggedIn = computed(() => hasValidTokens())

  // Get the appropriate button text based on auth state
  const buttonText = computed(() => {
    if (!isLoggedIn.value) {
      return t.value.notFound?.goToLogin ?? 'Go to Login'
    }
    return t.value.notFound?.goToDashboard ?? 'Go to Dashboard'
  })

  // Handle redirect based on user type
  const handleRedirect = (): void => {
    if (!isLoggedIn.value) {
      router.push('/login')
      return
    }

    // Determine where to redirect based on user type
    const isMaster = getStoredIsMaster()
    const userType = getStoredUserType()
    const adminUserType = getStoredAdminUserType()

    // Super admin, master, or staff goes to superadmin dashboard
    if (isMaster || userType === 'super' || adminUserType === 'staff') {
      router.push('/superadmin')
      return
    }

    // Client goes to their wedding admin
    const slug = getStoredPrimaryWeddingSlug()
    if (slug) {
      router.push(`/${slug}/admin`)
    } else {
      // Fallback to login if no slug available
      router.push('/login')
    }
  }

  // Handle go home (for public visitors)
  const handleGoHome = (): void => {
    router.push('/')
  }
</script>

<template>
  <main
    class="min-h-screen bg-sand dark:bg-dark-bg flex items-center justify-center p-6 transition-colors duration-300"
  >
    <!-- Language and Dark Mode toggles -->
    <div class="absolute top-4 right-4 flex items-center gap-2">
      <LanguageToggle />
      <DarkModeToggle variant="light" />
    </div>

    <div class="text-center max-w-md">
      <!-- 404 Icon -->
      <div class="mb-6">
        <svg
          class="w-32 h-32 mx-auto text-sage dark:text-sage-light opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- Title -->
      <h1 class="font-heading text-6xl text-sage-dark dark:text-sage-light mb-4">
        {{ t.notFound?.title ?? '404' }}
      </h1>

      <!-- Subtitle -->
      <p class="font-body text-xl text-charcoal dark:text-dark-text mb-2">
        {{ t.notFound?.subtitle ?? 'Page Not Found' }}
      </p>

      <!-- Message -->
      <p class="font-body text-charcoal-light dark:text-dark-text-secondary mb-8">
        {{ t.notFound?.message ?? 'Sorry, the page you are looking for does not exist.' }}
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <!-- Primary action: Login/Dashboard based on auth state -->
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-lg font-body font-medium hover:bg-sage-dark transition-colors cursor-pointer"
          @click="handleRedirect"
        >
          <svg
            v-if="isLoggedIn"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          {{ buttonText }}
        </button>

        <!-- Secondary action: Go Home (for public visitors) -->
        <button
          v-if="!isLoggedIn"
          type="button"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-sage text-sage dark:text-sage-light dark:border-sage-light rounded-lg font-body font-medium hover:bg-sage/10 transition-colors cursor-pointer"
          @click="handleGoHome"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {{ t.notFound?.goHome ?? 'Back to Home' }}
        </button>
      </div>
    </div>
  </main>
</template>
