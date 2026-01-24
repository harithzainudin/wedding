<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { usePasswordChange } from '@/composables/usePasswordChange'
  import { useProfile } from '@/composables/useProfile'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { resolveWeddingSlug } from '@/services/api'
  import { setStoredPrimaryWeddingId, getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import { clearCache } from '@/utils/apiCache'
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
  import DesignTab from '@/components/admin/DesignTab.vue'
  import GiftsTab from '@/components/admin/GiftsTab.vue'
  import QRCodeHubTab from '@/components/admin/QRCodeHubTab.vue'
  import WeddingContextBar from '@/components/admin/WeddingContextBar.vue'
  import { useWeddingMetadata } from '@/composables/useWeddingMetadata'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { useUnsavedChanges, useBeforeUnloadWarning } from '@/composables/useUnsavedChanges'
  import type { DirtyTabInfo, DirtyStateChangePayload } from '@/composables/useUnsavedChanges'
  import UnsavedChangesModal from '@/components/admin/UnsavedChangesModal.vue'
  import { useToast } from '@/composables/useToast'

  const { adminT } = useAdminLanguage()
  const route = useRoute()
  const router = useRouter()

  // Wedding metadata for context bar
  const { fetchWeddings } = useWeddingMetadata()

  // Public wedding data for document title
  const { fetchPublicData } = usePublicWeddingData()

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

  // Unsaved changes detection
  const {
    hasDirtyTabs,
    currentDirtyTabLabel,
    showModal: showUnsavedChangesModal,
    isSaving: isUnsavedChangesSaving,
    saveError: unsavedChangesSaveError,
    registerTab,
    unregisterTab,
    clearAllDirtyTabs,
    beforeNavigate,
    handleSaveAndContinue,
    handleDiscard,
    handleStay,
  } = useUnsavedChanges()

  // Setup browser beforeunload warning
  useBeforeUnloadWarning()

  // Toast notifications
  const { success: showSuccessToast } = useToast()

  // Mobile menu state
  const showMobileMenu = ref(false)

  // Slug resolution state
  const isResolvingSlug = ref(false)
  const slugResolutionError = ref<string | null>(null)
  const hasResolvedSlug = ref(false)

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
    | 'design'
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
    'design',
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
  // Skip if already resolved to prevent duplicate API calls
  watch(isAuthenticated, async (authenticated) => {
    if (authenticated && weddingSlug.value && !hasResolvedSlug.value) {
      hasResolvedSlug.value = true
      isResolvingSlug.value = true
      slugResolutionError.value = null

      try {
        const resolved = await resolveWeddingSlug(weddingSlug.value)
        const storedWeddingId = getStoredPrimaryWeddingId()

        // Update stored weddingId if it doesn't match the current slug
        if (storedWeddingId !== resolved.weddingId) {
          setStoredPrimaryWeddingId(resolved.weddingId)
        }

        // Fetch public data for document title
        fetchPublicData(weddingSlug.value)
      } catch (err) {
        slugResolutionError.value = err instanceof Error ? err.message : 'Failed to load wedding'
        hasResolvedSlug.value = false // Reset on error to allow retry
      } finally {
        isResolvingSlug.value = false
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
    design:
      'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
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
    { key: 'design', label: adminT.value.nav.design ?? 'Design', icon: tabIcons.design },
    { key: 'contacts', label: adminT.value.nav.contacts, icon: tabIcons.contacts },
    { key: 'rsvps', label: adminT.value.nav.rsvps, icon: tabIcons.rsvps },
    { key: 'qrcodehub', label: adminT.value.nav.qrHub, icon: tabIcons.qrcodehub },
  ])

  // Helper to perform actual tab navigation
  const performTabNavigation = (tab: TabType): void => {
    activeTab.value = tab
    // Build the correct path based on whether we're in multi-tenant or legacy route
    const basePath = weddingSlug.value ? `/${weddingSlug.value}/admin` : '/admin'
    const newPath = tab === 'dashboard' ? basePath : `${basePath}/${tab}`
    router.push(newPath)
  }

  const switchTab = (tab: TabType): void => {
    // Check for unsaved changes before navigating
    if (!beforeNavigate({ type: 'tab', destination: tab })) {
      return // Navigation blocked, modal will show
    }
    performTabNavigation(tab)
  }

  // Handle unsaved changes modal actions
  const onSaveAndContinue = async (): Promise<void> => {
    const result = await handleSaveAndContinue()
    if (result.success && result.proceedWithNavigation) {
      showSuccessToast(adminT.value.unsavedChanges.changesSaved)
      if (result.proceedWithNavigation.type === 'tab' && result.proceedWithNavigation.destination) {
        performTabNavigation(result.proceedWithNavigation.destination as TabType)
      } else if (
        result.proceedWithNavigation.type === 'route' &&
        result.proceedWithNavigation.routeLocation
      ) {
        router.push(result.proceedWithNavigation.routeLocation)
      }
    }
  }

  const onDiscard = (): void => {
    const nav = handleDiscard()
    if (nav) {
      if (nav.type === 'tab' && nav.destination) {
        performTabNavigation(nav.destination as TabType)
      } else if (nav.type === 'route' && nav.routeLocation) {
        router.push(nav.routeLocation)
      }
    }
  }

  // Handle dirty state changes from tab components
  const handleTabDirtyChange = (tabKey: TabType, payload: DirtyStateChangePayload): void => {
    if (payload.isDirty) {
      const tabConfig = tabs.value.find((t) => t.key === tabKey)
      const info: DirtyTabInfo = {
        tabKey,
        tabLabel: tabConfig?.label ?? tabKey,
        save: payload.save,
        discard: payload.discard,
      }
      registerTab(info)
    } else {
      unregisterTab(tabKey)
    }
  }

  // Individual handlers for each tab to avoid implicit any in template
  const onWeddingDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('wedding', payload)
  const onVenueDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('venue', payload)
  const onScheduleDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('schedule', payload)
  const onThemeDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('theme', payload)
  const onDesignDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('design', payload)
  const onContactsDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('contacts', payload)
  const onQRCodeHubDirtyChange = (payload: DirtyStateChangePayload): void =>
    handleTabDirtyChange('qrcodehub', payload)

  // Navigation guard for browser back/forward
  onBeforeRouteLeave((to, _from, next) => {
    if (hasDirtyTabs.value) {
      // Block navigation and show modal
      beforeNavigate({ type: 'route', routeLocation: to })
      next(false)
    } else {
      next()
    }
  })

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

    // Fetch wedding metadata for context bar
    fetchWeddings()

    // If we have a wedding slug in the URL, resolve it to get the weddingId
    // This handles the case where user directly navigates to /{slug}/admin
    // Skip if already resolved by the isAuthenticated watch to prevent duplicate API calls
    if (weddingSlug.value && !hasResolvedSlug.value) {
      hasResolvedSlug.value = true
      isResolvingSlug.value = true
      slugResolutionError.value = null

      try {
        const resolved = await resolveWeddingSlug(weddingSlug.value)
        const storedWeddingId = getStoredPrimaryWeddingId()

        // Update stored weddingId if it doesn't match the current slug
        if (storedWeddingId !== resolved.weddingId) {
          setStoredPrimaryWeddingId(resolved.weddingId)
        }

        // Fetch public data for document title
        fetchPublicData(weddingSlug.value)
      } catch (err) {
        slugResolutionError.value = err instanceof Error ? err.message : 'Failed to load wedding'
        hasResolvedSlug.value = false // Reset on error to allow retry
      } finally {
        isResolvingSlug.value = false
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

  // Watch for wedding slug changes (user switching between weddings)
  // Clear cache and update weddingId to ensure fresh data is loaded
  watch(
    () => route.params.weddingSlug,
    async (newSlug, oldSlug) => {
      // Only handle actual changes, not initial mount (handled by onMounted)
      if (!newSlug || newSlug === oldSlug || typeof newSlug !== 'string') return

      // Clear all cached data from previous wedding
      clearCache()

      // Clear any unsaved changes from previous wedding
      clearAllDirtyTabs()

      // Reset the flag to allow resolution for the new slug
      hasResolvedSlug.value = true

      // Resolve the new slug and update stored weddingId
      isResolvingSlug.value = true
      slugResolutionError.value = null

      try {
        const resolved = await resolveWeddingSlug(newSlug)
        setStoredPrimaryWeddingId(resolved.weddingId)
        fetchPublicData(newSlug)
      } catch (err) {
        slugResolutionError.value = err instanceof Error ? err.message : 'Failed to load wedding'
        hasResolvedSlug.value = false // Reset on error to allow retry
      } finally {
        isResolvingSlug.value = false
      }
    }
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

      <UnsavedChangesModal
        :show="showUnsavedChangesModal"
        :tab-label="currentDirtyTabLabel"
        :is-saving="isUnsavedChangesSaving"
        :save-error="unsavedChangesSaveError"
        @save-and-continue="onSaveAndContinue"
        @discard="onDiscard"
        @stay="handleStay"
      />

      <!-- Mobile Menu -->
      <MobileAdminMenu
        :is-open="showMobileMenu"
        :username="currentUser"
        :is-master-user="isMasterUser"
        :user-type="userType"
        v-bind="weddingSlug ? { weddingSlug } : {}"
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
          v-bind="weddingSlug ? { weddingSlug } : {}"
          @open-profile="openProfileModal"
          @change-password="openPasswordChangeModal"
          @logout="onLogout"
          @open-mobile-menu="openMobileMenu"
        />

        <!-- Wedding Context Bar (desktop only) -->
        <WeddingContextBar />

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

        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div :key="activeTab">
            <DashboardTab v-if="activeTab === 'dashboard'" @switch-tab="switchTab" />
            <WeddingDetailsTab
              v-else-if="activeTab === 'wedding'"
              v-bind="weddingSlug ? { weddingSlug } : {}"
              @dirty-state-change="onWeddingDirtyChange"
            />
            <LocationTab
              v-else-if="activeTab === 'venue'"
              @dirty-state-change="onVenueDirtyChange"
            />
            <ScheduleTab
              v-else-if="activeTab === 'schedule'"
              @dirty-state-change="onScheduleDirtyChange"
            />
            <GalleryTab v-else-if="activeTab === 'gallery'" />
            <MusicTab v-else-if="activeTab === 'music'" />
            <GiftsTab v-else-if="activeTab === 'gifts'" />
            <ThemeTab v-else-if="activeTab === 'theme'" @dirty-state-change="onThemeDirtyChange" />
            <DesignTab
              v-else-if="activeTab === 'design'"
              @dirty-state-change="onDesignDirtyChange"
            />
            <ContactsTab
              v-else-if="activeTab === 'contacts'"
              @dirty-state-change="onContactsDirtyChange"
            />
            <RsvpsTab v-else-if="activeTab === 'rsvps'" />
            <QRCodeHubTab
              v-else-if="activeTab === 'qrcodehub'"
              @dirty-state-change="onQRCodeHubDirtyChange"
            />
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>
