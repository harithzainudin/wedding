<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import StaffManagement from '@/components/admin/StaffManagement.vue'
  import MusicLibraryTab from '@/components/admin/MusicLibraryTab.vue'
  import SuperAdminSettingsTab from '@/components/admin/SuperAdminSettingsTab.vue'
  import SuperAdminWeddingsTab from '@/components/admin/SuperAdminWeddingsTab.vue'

  // Tab state from route
  type TabType = 'weddings' | 'staff' | 'music-library' | 'settings'
  const route = useRoute()
  const router = useRouter()

  // Compute active tab from route params
  const activeTab = computed<TabType>(() => {
    const tab = route.params.tab as string | undefined
    if (tab === 'staff') return 'staff'
    if (tab === 'music-library') return 'music-library'
    if (tab === 'settings') return 'settings'
    return 'weddings' // default
  })

  // Navigate to tab via router
  const navigateToTab = (tab: TabType) => {
    if (tab === 'weddings') {
      router.push('/superadmin')
    } else {
      router.push(`/superadmin/${tab}`)
    }
  }

  const { adminT } = useAdminLanguage()

  // Use reactive auth state
  const {
    isAuthenticated,
    isCheckingAuth,
    currentUser: username,
    userType,
    adminUserType,
    checkExistingAuth,
  } = useAdminAuth()

  // Check if user can access super admin (super admin or staff)
  const canAccessSuperAdmin = computed(
    () => userType.value === 'super' || adminUserType.value === 'staff'
  )

  // Check auth when mounted
  onMounted(async () => {
    await checkExistingAuth()
  })

  // Watch for auth changes to handle redirect
  watch(
    [isAuthenticated, isCheckingAuth],
    ([authenticated, checking]) => {
      if (checking) return // Still checking, wait

      if (!authenticated) {
        // Not logged in, redirect to login page
        router.push('/login')
      }
    },
    { immediate: false }
  )
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg">
    <!-- Loading state while checking auth -->
    <div v-if="isCheckingAuth" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        <span class="text-charcoal-light dark:text-dark-text-secondary text-sm font-body">
          Loading...
        </span>
      </div>
    </div>

    <!-- Main content when authenticated as super admin or staff -->
    <template v-else-if="isAuthenticated && canAccessSuperAdmin">
      <!-- Header -->
      <header
        class="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-sand-dark dark:border-dark-border"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">
                Super Admin Dashboard
              </h1>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                Welcome, {{ username }}
              </p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 mt-4 -mb-4">
            <button
              type="button"
              class="px-4 py-2 font-body text-sm font-medium rounded-t-lg transition-colors cursor-pointer"
              :class="
                activeTab === 'weddings'
                  ? 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text border-t border-l border-r border-sand-dark dark:border-dark-border'
                  : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="navigateToTab('weddings')"
            >
              Weddings
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm font-medium rounded-t-lg transition-colors cursor-pointer"
              :class="
                activeTab === 'staff'
                  ? 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text border-t border-l border-r border-sand-dark dark:border-dark-border'
                  : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="navigateToTab('staff')"
            >
              Staff
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm font-medium rounded-t-lg transition-colors cursor-pointer"
              :class="
                activeTab === 'music-library'
                  ? 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text border-t border-l border-r border-sand-dark dark:border-dark-border'
                  : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="navigateToTab('music-library')"
            >
              Music Library
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5"
              :class="
                activeTab === 'settings'
                  ? 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text border-t border-l border-r border-sand-dark dark:border-dark-border'
                  : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="navigateToTab('settings')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {{ adminT.superAdminSettings.settingsTab }}
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <!-- Weddings Tab -->
          <SuperAdminWeddingsTab v-if="activeTab === 'weddings'" key="weddings" />

          <!-- Staff Tab -->
          <StaffManagement v-else-if="activeTab === 'staff'" key="staff" />

          <!-- Music Library Tab -->
          <MusicLibraryTab v-else-if="activeTab === 'music-library'" key="music-library" />

          <!-- Settings Tab -->
          <SuperAdminSettingsTab v-else-if="activeTab === 'settings'" key="settings" />
        </Transition>
      </main>
    </template>
  </div>
</template>
