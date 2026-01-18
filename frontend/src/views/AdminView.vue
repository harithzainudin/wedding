<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { usePasswordChange } from '@/composables/usePasswordChange'
  import { useProfile } from '@/composables/useProfile'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { resolveWeddingSlug } from '@/services/api'
  import { setStoredPrimaryWeddingId, getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import AdminHeader from '@/components/admin/AdminHeader.vue'
  import PasswordChangeModal from '@/components/admin/PasswordChangeModal.vue'
  import ProfileSettingsModal from '@/components/admin/ProfileSettingsModal.vue'
  import MobileAdminMenu from '@/components/admin/MobileAdminMenu.vue'
  import ForcedPasswordChangeModal from '@/components/admin/ForcedPasswordChangeModal.vue'
  import DashboardTab from '@/components/admin/DashboardTab.vue'
  import WeddingDetailsTab from '@/components/admin/WeddingDetailsTab.vue'
  import LocationTab from '@/components/admin/LocationTab.vue'
  import ScheduleTab from '@/components/admin/ScheduleTab.vue'
  import GalleryTab from '@/components/admin/GalleryTab.vue'
  import ContactsTab from '@/components/admin/ContactsTab.vue'
  import RsvpsTab from '@/components/admin/RsvpsTab.vue'
  import MusicTab from '@/components/admin/MusicTab.vue'
  import ThemeTab from '@/components/admin/ThemeTab.vue'
  import GiftsTab from '@/components/admin/GiftsTab.vue'
  import QRCodeHubTab from '@/components/admin/QRCodeHubTab.vue'

  const { adminT } = useAdminLanguage()
  const route = useRoute()
  const router = useRouter()

  // Get wedding slug from route params (for multi-tenant routes like /:weddingSlug/admin)
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : undefined
  })

  useDocumentTitle({ text: 'CMS Admin', position: 'prefix' })

  const {
    isAuthenticated,
    isCheckingAuth,
    currentUser,
    isMasterUser,
    userType,
    mustChangePassword,
    newPasswordForChange,
    confirmNewPasswordForChange,
    showNewPasswordForChange,
    showConfirmNewPasswordForChange,
    forcedPasswordChangeError,
    isSettingNewPassword,
    checkExistingAuth,
    handleLogout,
    handleSetNewPassword,
  } = useAdminAuth()

  const {
    showPasswordChangeModal,
    currentPasswordInput,
    newPasswordInput,
    confirmNewPasswordInput,
    showCurrentPassword,
    showNewPassword,
    showConfirmNewPassword,
    passwordChangeError,
    passwordChangeSuccess,
    isChangingPassword,
    handleChangePassword,
    openPasswordChangeModal,
    closePasswordChangeModal,
  } = usePasswordChange(() => currentUser.value)

  const {
    showProfileModal,
    email,
    isLoadingProfile,
    isSavingProfile,
    profileError,
    profileSuccess,
    updateEmail,
    openProfileModal,
    closeProfileModal,
  } = useProfile(() => currentUser.value)

  // Mobile menu state
  const showMobileMenu = ref(false)

  // Slug resolution state
  const isResolvingSlug = ref(false)
  const slugResolutionError = ref<string | null>(null)

  const openMobileMenu = (): void => {
    showMobileMenu.value = true
  }

  const closeMobileMenu = (): void => {
    showMobileMenu.value = false
  }

  // Tab configuration with icons
  type TabType =
    | 'dashboard'
    | 'wedding'
    | 'venue'
    | 'schedule'
    | 'gallery'
    | 'music'
    | 'gifts'
    | 'theme'
    | 'contacts'
    | 'rsvps'
    | 'qrcodehub'
  const validTabs: TabType[] = [
    'dashboard',
    'wedding',
    'venue',
    'schedule',
    'gallery',
    'music',
    'gifts',
    'theme',
    'contacts',
    'rsvps',
    'qrcodehub',
  ]

  // Get tab from route params
  const getTabFromRoute = (): TabType => {
    const tab = route.params.tab
    if (typeof tab === 'string' && validTabs.includes(tab as TabType)) {
      return tab as TabType
    }
    return 'dashboard'
  }

  const activeTab = ref<TabType>(getTabFromRoute())

  // Watch for route changes (browser back/forward)
  watch(
    () => route.params.tab,
    () => {
      activeTab.value = getTabFromRoute()
    }
  )

  // Resolve wedding slug when user becomes authenticated (e.g., after login)
  watch(isAuthenticated, async (authenticated) => {
    if (authenticated && weddingSlug.value) {
      const currentWeddingId = getStoredPrimaryWeddingId()
      if (!currentWeddingId) {
        isResolvingSlug.value = true
        slugResolutionError.value = null

        try {
          const resolved = await resolveWeddingSlug(weddingSlug.value)
          setStoredPrimaryWeddingId(resolved.weddingId)
        } catch (err) {
          slugResolutionError.value = err instanceof Error ? err.message : 'Failed to load wedding'
        } finally {
          isResolvingSlug.value = false
        }
      }
    }
  })

  interface TabConfig {
    key: TabType
    label: string
    icon: string
  }

  // Tab icons (static)
  const tabIcons: Record<TabType, string> = {
    dashboard: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
    wedding:
      'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    venue:
      'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
    schedule:
      'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
    gallery:
      'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    gifts:
      'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
    theme:
      'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    contacts:
      'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    rsvps:
      'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    qrcodehub:
      'M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm8-12v8h8V3h-8zm6 6h-4V5h4v4zm-6 4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2zm2-2h2v2h-2z',
  }

  // Computed tabs with translated labels
  const tabs = computed<TabConfig[]>(() => [
    { key: 'dashboard', label: adminT.value.nav.dashboard, icon: tabIcons.dashboard },
    { key: 'wedding', label: adminT.value.nav.wedding, icon: tabIcons.wedding },
    { key: 'venue', label: adminT.value.nav.venue, icon: tabIcons.venue },
    { key: 'schedule', label: adminT.value.nav.schedule, icon: tabIcons.schedule },
    { key: 'gallery', label: adminT.value.nav.gallery, icon: tabIcons.gallery },
    { key: 'music', label: adminT.value.nav.music, icon: tabIcons.music },
    { key: 'gifts', label: adminT.value.nav.gifts, icon: tabIcons.gifts },
    { key: 'theme', label: adminT.value.nav.theme, icon: tabIcons.theme },
    { key: 'contacts', label: adminT.value.nav.contacts, icon: tabIcons.contacts },
    { key: 'rsvps', label: adminT.value.nav.rsvps, icon: tabIcons.rsvps },
    { key: 'qrcodehub', label: adminT.value.nav.qrHub, icon: tabIcons.qrcodehub },
  ])

  const switchTab = (tab: TabType): void => {
    activeTab.value = tab
    // Build the correct path based on whether we're in multi-tenant or legacy route
    const basePath = weddingSlug.value ? `/${weddingSlug.value}/admin` : '/admin'
    const newPath = tab === 'dashboard' ? basePath : `${basePath}/${tab}`
    router.push(newPath)
  }

  const onLogout = (): void => {
    handleLogout()
    activeTab.value = 'dashboard'
    // Navigate to login page
    router.push('/login')
  }

  const handleOpenPasswordChangeFromProfile = (): void => {
    closeProfileModal()
    openPasswordChangeModal()
  }

  onMounted(async () => {
    await checkExistingAuth()

    // If not authenticated, router guards should redirect to login
    // but we also check here as a fallback
    if (!isAuthenticated.value) {
      router.push('/login')
      return
    }

    // If we have a wedding slug in the URL, resolve it to get the weddingId
    // This handles the case where user directly navigates to /{slug}/admin
    if (weddingSlug.value) {
      const currentWeddingId = getStoredPrimaryWeddingId()

      // Only resolve if we don't have a weddingId stored, or need to verify it matches the slug
      if (!currentWeddingId) {
        isResolvingSlug.value = true
        slugResolutionError.value = null

        try {
          const resolved = await resolveWeddingSlug(weddingSlug.value)
          setStoredPrimaryWeddingId(resolved.weddingId)
        } catch (err) {
          slugResolutionError.value = err instanceof Error ? err.message : 'Failed to load wedding'
        } finally {
          isResolvingSlug.value = false
        }
      }
    }
  })

  // Watch for auth changes to handle logout scenarios
  watch(
    [isAuthenticated, isCheckingAuth],
    ([authenticated, checking]) => {
      if (checking) return // Still checking, wait
      if (!authenticated) {
        router.push('/login')
      }
    },
    { immediate: false }
  )
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
    <!-- Loading state while checking auth or resolving slug -->
    <div
      v-if="isCheckingAuth || isResolvingSlug"
      class="min-h-screen flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        <span class="text-charcoal-light dark:text-dark-text-secondary text-sm font-body">{{
          adminT.common.loading
        }}</span>
      </div>
    </div>

    <!-- Error state if slug resolution failed -->
    <div v-else-if="slugResolutionError" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-center px-4">
        <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p class="text-charcoal dark:text-dark-text font-body font-medium">
          {{ slugResolutionError }}
        </p>
        <button
          type="button"
          class="mt-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
          @click="router.push('/superadmin')"
        >
          {{ adminT.common.backToSuperAdmin || 'Back to Super Admin' }}
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Modals -->
      <PasswordChangeModal
        :show="showPasswordChangeModal"
        :current-password="currentPasswordInput"
        :new-password="newPasswordInput"
        :confirm-new-password="confirmNewPasswordInput"
        :show-current-password="showCurrentPassword"
        :show-new-password="showNewPassword"
        :show-confirm-new-password="showConfirmNewPassword"
        :password-change-error="passwordChangeError"
        :password-change-success="passwordChangeSuccess"
        :is-changing-password="isChangingPassword"
        @update:current-password="currentPasswordInput = $event"
        @update:new-password="newPasswordInput = $event"
        @update:confirm-new-password="confirmNewPasswordInput = $event"
        @update:show-current-password="showCurrentPassword = $event"
        @update:show-new-password="showNewPassword = $event"
        @update:show-confirm-new-password="showConfirmNewPassword = $event"
        @close="closePasswordChangeModal"
        @submit="handleChangePassword"
      />

      <ProfileSettingsModal
        :show="showProfileModal"
        :username="currentUser"
        :email="email"
        :is-master-user="isMasterUser"
        :is-loading="isLoadingProfile"
        :is-saving="isSavingProfile"
        :error="profileError"
        :success="profileSuccess"
        @update:email="email = $event"
        @close="closeProfileModal"
        @save="updateEmail"
        @open-password-change="handleOpenPasswordChangeFromProfile"
      />

      <ForcedPasswordChangeModal
        :show="mustChangePassword"
        :new-password="newPasswordForChange"
        :confirm-new-password="confirmNewPasswordForChange"
        :show-new-password="showNewPasswordForChange"
        :show-confirm-new-password="showConfirmNewPasswordForChange"
        :error="forcedPasswordChangeError"
        :is-submitting="isSettingNewPassword"
        @update:new-password="newPasswordForChange = $event"
        @update:confirm-new-password="confirmNewPasswordForChange = $event"
        @update:show-new-password="showNewPasswordForChange = $event"
        @update:show-confirm-new-password="showConfirmNewPasswordForChange = $event"
        @submit="handleSetNewPassword"
      />

      <!-- Mobile Menu -->
      <MobileAdminMenu
        :is-open="showMobileMenu"
        :username="currentUser"
        :is-master-user="isMasterUser"
        :user-type="userType"
        @close="closeMobileMenu"
        @open-profile="openProfileModal"
        @change-password="openPasswordChangeModal"
        @logout="onLogout"
      />

      <div class="max-w-6xl mx-auto px-4 py-8">
        <AdminHeader
          :current-user="currentUser"
          :is-master-user="isMasterUser"
          :user-type="userType"
          @open-profile="openProfileModal"
          @change-password="openPasswordChangeModal"
          @logout="onLogout"
          @open-mobile-menu="openMobileMenu"
        />

        <!-- Tab Navigation with Icons -->
        <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            class="flex border-b border-sand-dark dark:border-dark-border mb-6 min-w-max sm:min-w-0"
          >
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="flex items-center gap-1.5 px-2 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
              :class="
                activeTab === tab.key
                  ? 'text-sage border-sage'
                  : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="switchTab(tab.key)"
            >
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path :d="tab.icon" />
              </svg>
              <span class="hidden sm:inline">{{ tab.label }}</span>
              <span v-if="activeTab === tab.key" class="sm:hidden">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <DashboardTab v-if="activeTab === 'dashboard'" @switch-tab="switchTab" />
        <WeddingDetailsTab
          v-if="activeTab === 'wedding'"
          v-bind="weddingSlug ? { weddingSlug } : {}"
        />
        <LocationTab v-if="activeTab === 'venue'" />
        <ScheduleTab v-if="activeTab === 'schedule'" />
        <GalleryTab v-if="activeTab === 'gallery'" />
        <MusicTab v-if="activeTab === 'music'" />
        <GiftsTab v-if="activeTab === 'gifts'" />
        <ThemeTab v-if="activeTab === 'theme'" />
        <ContactsTab v-if="activeTab === 'contacts'" />
        <RsvpsTab v-if="activeTab === 'rsvps'" />
        <QRCodeHubTab v-if="activeTab === 'qrcodehub'" />
      </div>
    </template>
  </div>
</template>
