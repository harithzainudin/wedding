<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { usePasswordChange } from '@/composables/usePasswordChange'
  import { useProfile } from '@/composables/useProfile'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import AdminLoginForm from '@/components/admin/AdminLoginForm.vue'
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
  import SettingsTab from '@/components/admin/SettingsTab.vue'
  import MusicTab from '@/components/admin/MusicTab.vue'
  import ThemeTab from '@/components/admin/ThemeTab.vue'
  import GiftsTab from '@/components/admin/GiftsTab.vue'
  import QRCodeHubTab from '@/components/admin/QRCodeHubTab.vue'

  useDocumentTitle({ text: 'CMS Admin', position: 'prefix' })

  const {
    isAuthenticated,
    isCheckingAuth,
    username,
    password,
    showLoginPassword,
    loginError,
    isLoggingIn,
    currentUser,
    isMasterUser,
    mustChangePassword,
    newPasswordForChange,
    confirmNewPasswordForChange,
    showNewPasswordForChange,
    showConfirmNewPasswordForChange,
    forcedPasswordChangeError,
    isSettingNewPassword,
    checkExistingAuth,
    handleLogin,
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
    | 'settings'
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
    'settings',
  ]

  const getTabFromHash = (): TabType => {
    const hash = window.location.hash.slice(1)
    return validTabs.includes(hash as TabType) ? (hash as TabType) : 'dashboard'
  }

  const activeTab = ref<TabType>(getTabFromHash())

  interface TabConfig {
    key: TabType
    label: string
    icon: string
  }

  const tabs: TabConfig[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
    },
    {
      key: 'wedding',
      label: 'Wedding',
      icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    },
    {
      key: 'venue',
      label: 'Venue',
      icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
    },
    {
      key: 'gallery',
      label: 'Gallery',
      icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    },
    {
      key: 'music',
      label: 'Music',
      icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    },
    {
      key: 'gifts',
      label: 'Gifts',
      icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
    },
    {
      key: 'theme',
      label: 'Theme',
      icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    },
    {
      key: 'contacts',
      label: 'Contacts',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    },
    {
      key: 'rsvps',
      label: 'RSVPs',
      icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    },
    {
      key: 'qrcodehub',
      label: 'QR Hub',
      icon: 'M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm8-12v8h8V3h-8zm6 6h-4V5h4v4zm-6 4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2zm2-2h2v2h-2z',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    },
  ]

  const switchTab = (tab: TabType): void => {
    activeTab.value = tab
    window.history.replaceState(null, '', `#${tab}`)
  }

  const onLogin = async (): Promise<void> => {
    await handleLogin()
  }

  const onLogout = (): void => {
    handleLogout()
    activeTab.value = 'dashboard'
    window.history.replaceState(null, '', '#dashboard')
  }

  const handleOpenPasswordChangeFromProfile = (): void => {
    closeProfileModal()
    openPasswordChangeModal()
  }

  onMounted(async () => {
    await checkExistingAuth()

    // Handle browser back/forward navigation
    window.addEventListener('hashchange', () => {
      activeTab.value = getTabFromHash()
    })
  })
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
    <!-- Loading state while checking auth -->
    <div v-if="isCheckingAuth" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        <span class="text-charcoal-light dark:text-dark-text-secondary text-sm font-body"
          >Loading...</span
        >
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
        @close="closeMobileMenu"
        @open-profile="openProfileModal"
        @change-password="openPasswordChangeModal"
        @logout="onLogout"
      />

      <AdminLoginForm
        v-if="!isAuthenticated"
        :username="username"
        :password="password"
        :show-password="showLoginPassword"
        :login-error="loginError"
        :is-logging-in="isLoggingIn"
        @update:username="username = $event"
        @update:password="password = $event"
        @update:show-password="showLoginPassword = $event"
        @submit="onLogin"
      />

      <div v-else class="max-w-6xl mx-auto px-4 py-8">
        <AdminHeader
          :current-user="currentUser"
          :is-master-user="isMasterUser"
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
        <WeddingDetailsTab v-if="activeTab === 'wedding'" />
        <LocationTab v-if="activeTab === 'venue'" />
        <ScheduleTab v-if="activeTab === 'schedule'" />
        <GalleryTab v-if="activeTab === 'gallery'" />
        <MusicTab v-if="activeTab === 'music'" />
        <GiftsTab v-if="activeTab === 'gifts'" />
        <ThemeTab v-if="activeTab === 'theme'" />
        <ContactsTab v-if="activeTab === 'contacts'" />
        <RsvpsTab v-if="activeTab === 'rsvps'" />
        <QRCodeHubTab v-if="activeTab === 'qrcodehub'" />
        <SettingsTab
          v-if="activeTab === 'settings'"
          :is-master-user="isMasterUser"
          :current-user="currentUser"
        />
      </div>
    </template>
  </div>
</template>
