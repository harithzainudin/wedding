<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAdminAuth } from "@/composables/useAdminAuth";
import { usePasswordChange } from "@/composables/usePasswordChange";
import { useDocumentTitle } from "@/composables/useDocumentTitle";
import AdminLoginForm from "@/components/admin/AdminLoginForm.vue";
import AdminHeader from "@/components/admin/AdminHeader.vue";
import PasswordChangeModal from "@/components/admin/PasswordChangeModal.vue";
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
  checkExistingAuth,
  handleLogin,
  handleLogout,
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

type TabType = "dashboard" | "wedding" | "venue" | "schedule" | "gallery" | "contacts" | "rsvps" | "settings";
const activeTab = ref<TabType>("dashboard");

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

onMounted(() => {
  checkExistingAuth();
});
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
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
        @change-password="openPasswordChangeModal"
        @logout="onLogout"
      />

      <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div class="flex border-b border-sand-dark dark:border-dark-border mb-6 min-w-max sm:min-w-0">
          <button
            v-for="tab in [
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'wedding', label: 'Wedding' },
              { key: 'venue', label: 'Venue' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'gallery', label: 'Gallery' },
              { key: 'contacts', label: 'Contacts' },
              { key: 'rsvps', label: 'RSVPs' },
              { key: 'settings', label: 'Settings' },
            ]"
            :key="tab.key"
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === tab.key ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab(tab.key as TabType)"
          >
            {{ tab.label }}
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
