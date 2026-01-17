<script setup lang="ts">
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
  import UserProfileDropdown from '@/components/admin/UserProfileDropdown.vue'
  import AdminLanguageToggle from '@/components/admin/AdminLanguageToggle.vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  defineProps<{
    currentUser: string
    isMasterUser: boolean
  }>()

  const emit = defineEmits<{
    openProfile: []
    changePassword: []
    logout: []
    openMobileMenu: []
  }>()

  const { adminT } = useAdminLanguage()
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">
        {{ adminT.header.title }}
      </h1>
      <p
        class="hidden sm:block font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1"
      >
        {{ adminT.header.subtitle }}
      </p>
    </div>

    <!-- Desktop actions -->
    <div class="hidden sm:flex items-center gap-3">
      <a
        href="/wedding/"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-3 py-2 text-sm font-body text-white bg-sage hover:bg-sage-dark rounded-lg transition-colors"
        title="View Live Site"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15,3 21,3 21,9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        {{ adminT.common.viewSite }}
      </a>
      <AdminLanguageToggle />
      <DarkModeToggle variant="light" />
      <UserProfileDropdown
        :username="currentUser"
        :is-master-user="isMasterUser"
        @open-profile="emit('openProfile')"
        @change-password="emit('changePassword')"
        @logout="emit('logout')"
      />
    </div>

    <!-- Mobile hamburger menu button -->
    <button
      type="button"
      class="sm:hidden p-2 text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated rounded-lg transition-colors cursor-pointer"
      aria-label="Open menu"
      @click="emit('openMobileMenu')"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  </div>
</template>
