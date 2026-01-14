<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAdminAuth } from "@/composables/useAdminAuth";
import { usePasswordChange } from "@/composables/usePasswordChange";
import { useProfile } from "@/composables/useProfile";
import { useDocumentTitle } from "@/composables/useDocumentTitle";
import AdminLoginForm from "@/components/admin/AdminLoginForm.vue";
import AdminHeader from "@/components/admin/AdminHeader.vue";
import PasswordChangeModal from "@/components/admin/PasswordChangeModal.vue";
import ProfileSettingsModal from "@/components/admin/ProfileSettingsModal.vue";
import MobileAdminMenu from "@/components/admin/MobileAdminMenu.vue";
import ForcedPasswordChangeModal from "@/components/admin/ForcedPasswordChangeModal.vue";
import DashboardTab from "@/components/admin/DashboardTab.vue";
import WeddingDetailsTab from "@/components/admin/WeddingDetailsTab.vue";
import LocationTab from "@/components/admin/LocationTab.vue";
import ScheduleTab from "@/components/admin/ScheduleTab.vue";
import GalleryTab from "@/components/admin/GalleryTab.vue";
import ContactsTab from "@/components/admin/ContactsTab.vue";
import RsvpsTab from "@/components/admin/RsvpsTab.vue";
import SettingsTab from "@/components/admin/SettingsTab.vue";

useDocumentTitle({ text: "CMS Admin", position: "prefix" });

const {
  isAuthenticated,
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
} = useAdminAuth();

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
} = usePasswordChange(() => currentUser.value);

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
} = useProfile(() => currentUser.value);

// Mobile menu state
const showMobileMenu = ref(false);

const openMobileMenu = (): void => {
  showMobileMenu.value = true;
};

const closeMobileMenu = (): void => {
  showMobileMenu.value = false;
};

// Tab configuration with icons
type TabType = "dashboard" | "wedding" | "venue" | "schedule" | "gallery" | "contacts" | "rsvps" | "settings";
const activeTab = ref<TabType>("dashboard");

interface TabConfig {
  key: TabType;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { key: "dashboard", label: "Dashboard", icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" },
  { key: "wedding", label: "Wedding", icon: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { key: "venue", label: "Venue", icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" },
  { key: "schedule", label: "Schedule", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" },
  { key: "gallery", label: "Gallery", icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" },
  { key: "contacts", label: "Contacts", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
  { key: "rsvps", label: "RSVPs", icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
  { key: "settings", label: "Settings", icon: "M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" },
];

const switchTab = (tab: TabType): void => {
  activeTab.value = tab;
};

const onLogin = async (): Promise<void> => {
  await handleLogin();
};

const onLogout = (): void => {
  handleLogout();
  activeTab.value = "dashboard";
};

const handleOpenPasswordChangeFromProfile = (): void => {
  closeProfileModal();
  openPasswordChangeModal();
};

onMounted(async () => {
  await checkExistingAuth();
});
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
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
        <div class="flex border-b border-sand-dark dark:border-dark-border mb-6 min-w-max sm:min-w-0">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex items-center gap-1.5 px-2 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === tab.key ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
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
      <ContactsTab v-if="activeTab === 'contacts'" />
      <RsvpsTab v-if="activeTab === 'rsvps'" />
      <SettingsTab
        v-if="activeTab === 'settings'"
        :is-master-user="isMasterUser"
        :current-user="currentUser"
      />
    </div>
  </div>
</template>
