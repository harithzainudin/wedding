<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { adminLogin, listRsvps, listAdminUsers, createAdminUser, deleteAdminUser, changeAdminPassword } from "@/services/api";
import type { RsvpSubmission } from "@/types/rsvp";
import type { AdminUser } from "@/types/admin";
import DarkModeToggle from "@/components/ui/DarkModeToggle.vue";
import GalleryTab from "@/components/admin/GalleryTab.vue";
import LocationTab from "@/components/admin/LocationTab.vue";
import DashboardTab from "@/components/admin/DashboardTab.vue";
import WeddingDetailsTab from "@/components/admin/WeddingDetailsTab.vue";
import ScheduleTab from "@/components/admin/ScheduleTab.vue";
import ContactsTab from "@/components/admin/ContactsTab.vue";

// Auth state
const isAuthenticated = ref(false);
const username = ref("");
const password = ref("");
const showLoginPassword = ref(false);
const loginError = ref("");
const isLoggingIn = ref(false);
const currentUser = ref("");
const isMasterUser = ref(false);

// Dashboard state
type TabType = "dashboard" | "wedding" | "venue" | "schedule" | "gallery" | "contacts" | "rsvps" | "settings";
const activeTab = ref<TabType>("dashboard");
const rsvps = ref<RsvpSubmission[]>([]);
const isLoading = ref(false);
const loadError = ref("");
const filter = ref<"all" | "attending" | "not_attending">("all");

// Admin users state
const adminUsers = ref<AdminUser[]>([]);
const isLoadingAdmins = ref(false);
const adminLoadError = ref("");
const showCreateForm = ref(false);
const newAdminUsername = ref("");
const newAdminPassword = ref("");
const newAdminEmail = ref("");
const showNewAdminPassword = ref(false);
const createError = ref("");
const isCreating = ref(false);
const deleteConfirm = ref<string | null>(null);
const isDeleting = ref(false);

// Popup state for email notifications
const showSuccessPopup = ref(false);
const showEmailWarningPopup = ref(false);
const emailWarningMessage = ref("");
const createdCredentials = ref({ username: "", password: "", email: "" });
const clipboardCopied = ref(false);

// Password change state
const showPasswordChangeModal = ref(false);
const currentPasswordInput = ref("");
const newPasswordInput = ref("");
const confirmNewPasswordInput = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmNewPassword = ref(false);
const passwordChangeError = ref("");
const passwordChangeSuccess = ref(false);
const isChangingPassword = ref(false);

// Summary stats
const summary = ref({
  total: 0,
  attending: 0,
  notAttending: 0,
  totalGuests: 0,
});

// Check if already authenticated
onMounted(() => {
  const token = sessionStorage.getItem("admin_token");
  const storedUsername = sessionStorage.getItem("admin_username");
  const storedIsMaster = sessionStorage.getItem("admin_is_master");
  if (token) {
    isAuthenticated.value = true;
    currentUser.value = storedUsername ?? "";
    isMasterUser.value = storedIsMaster === "true";
    fetchRsvps();
  }
});

// Filtered RSVPs
const filteredRsvps = computed(() => {
  if (filter.value === "all") return rsvps.value;
  if (filter.value === "attending") return rsvps.value.filter((r) => r.isAttending);
  return rsvps.value.filter((r) => !r.isAttending);
});

// Login handler
const handleLogin = async (): Promise<void> => {
  loginError.value = "";
  isLoggingIn.value = true;

  try {
    const response = await adminLogin({ username: username.value, password: password.value });
    if (response.success && response.token) {
      sessionStorage.setItem("admin_token", response.token);
      sessionStorage.setItem("admin_username", response.username ?? "");
      sessionStorage.setItem("admin_is_master", response.isMaster ? "true" : "false");
      isAuthenticated.value = true;
      currentUser.value = response.username ?? "";
      isMasterUser.value = response.isMaster ?? false;
      username.value = "";
      password.value = "";
      await fetchRsvps();
    } else {
      loginError.value = response.error ?? "Invalid username or password";
    }
  } catch {
    loginError.value = "Failed to login. Please try again.";
  } finally {
    isLoggingIn.value = false;
  }
};

// Fetch RSVPs
const fetchRsvps = async (): Promise<void> => {
  isLoading.value = true;
  loadError.value = "";

  try {
    const response = await listRsvps();
    if (response.success && response.data) {
      rsvps.value = response.data.rsvps;
      summary.value = response.data.summary;
    } else {
      loadError.value = response.error ?? "Failed to load RSVPs";
    }
  } catch {
    loadError.value = "Failed to load RSVPs. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Fetch Admin Users
const fetchAdminUsers = async (): Promise<void> => {
  isLoadingAdmins.value = true;
  adminLoadError.value = "";

  try {
    const response = await listAdminUsers();
    if (response.success && response.data) {
      adminUsers.value = response.data.admins;
    } else {
      adminLoadError.value = response.error ?? "Failed to load admin users";
    }
  } catch {
    adminLoadError.value = "Failed to load admin users. Please try again.";
  } finally {
    isLoadingAdmins.value = false;
  }
};

// Create Admin User
const handleCreateAdmin = async (): Promise<void> => {
  createError.value = "";
  isCreating.value = true;

  try {
    const request: { username: string; password: string; email?: string; createdBy: string } = {
      username: newAdminUsername.value,
      password: newAdminPassword.value,
      createdBy: currentUser.value,
    };
    if (newAdminEmail.value) {
      request.email = newAdminEmail.value;
    }
    const response = await createAdminUser(request);
    if (response.success) {
      // Store credentials for potential clipboard use
      createdCredentials.value = {
        username: newAdminUsername.value,
        password: newAdminPassword.value,
        email: newAdminEmail.value,
      };

      // Check email status and show appropriate popup
      if (newAdminEmail.value) {
        if (response.emailSent) {
          showSuccessPopup.value = true;
        } else {
          emailWarningMessage.value = response.emailError ?? "Failed to send welcome email";
          showEmailWarningPopup.value = true;
        }
      } else {
        // No email provided, just show success
        showSuccessPopup.value = true;
      }

      newAdminUsername.value = "";
      newAdminPassword.value = "";
      newAdminEmail.value = "";
      showCreateForm.value = false;
      await fetchAdminUsers();
    } else {
      createError.value = response.error ?? "Failed to create admin user";
    }
  } catch {
    createError.value = "Failed to create admin user. Please try again.";
  } finally {
    isCreating.value = false;
  }
};

// Close popups
const closePopups = (): void => {
  showSuccessPopup.value = false;
  showEmailWarningPopup.value = false;
  emailWarningMessage.value = "";
  clipboardCopied.value = false;
};

// Copy credentials to clipboard
const copyCredentialsToClipboard = async (): Promise<void> => {
  const subject = "Wedding Admin Portal - Your Login Credentials";
  const body = `Hi there!

Your admin account for the Wedding Admin Portal has been created.

LOGIN CREDENTIALS
-----------------
Username: ${createdCredentials.value.username}
Password: ${createdCredentials.value.password}

LOGIN URL
---------
https://harithzainudin.github.io/wedding/admin

Please keep your credentials secure and consider changing your password after your first login.

Best regards,
Wedding Admin Team`;

  try {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    clipboardCopied.value = true;
    setTimeout(() => {
      clipboardCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};

// Delete Admin User
const handleDeleteAdmin = async (adminUsername: string): Promise<void> => {
  isDeleting.value = true;

  try {
    const response = await deleteAdminUser(adminUsername);
    if (response.success) {
      deleteConfirm.value = null;
      await fetchAdminUsers();
    } else {
      alert(response.error ?? "Failed to delete admin user");
    }
  } catch {
    alert("Failed to delete admin user. Please try again.");
  } finally {
    isDeleting.value = false;
  }
};

// Change Password handler
const handleChangePassword = async (): Promise<void> => {
  passwordChangeError.value = "";

  // Client-side validation
  if (!currentPasswordInput.value || !newPasswordInput.value || !confirmNewPasswordInput.value) {
    passwordChangeError.value = "All fields are required";
    return;
  }

  if (newPasswordInput.value.length < 6) {
    passwordChangeError.value = "New password must be at least 6 characters";
    return;
  }

  if (newPasswordInput.value !== confirmNewPasswordInput.value) {
    passwordChangeError.value = "New passwords do not match";
    return;
  }

  if (currentPasswordInput.value === newPasswordInput.value) {
    passwordChangeError.value = "New password must be different from current password";
    return;
  }

  isChangingPassword.value = true;

  try {
    const response = await changeAdminPassword({
      username: currentUser.value,
      currentPassword: currentPasswordInput.value,
      newPassword: newPasswordInput.value,
    });

    if (response.success) {
      passwordChangeSuccess.value = true;
      // Clear form
      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmNewPasswordInput.value = "";
      // Close modal after delay
      setTimeout(() => {
        showPasswordChangeModal.value = false;
        passwordChangeSuccess.value = false;
      }, 2000);
    } else {
      passwordChangeError.value = response.error ?? "Failed to change password";
    }
  } catch {
    passwordChangeError.value = "Failed to change password. Please try again.";
  } finally {
    isChangingPassword.value = false;
  }
};

// Close password change modal and reset
const closePasswordChangeModal = (): void => {
  showPasswordChangeModal.value = false;
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  confirmNewPasswordInput.value = "";
  passwordChangeError.value = "";
  passwordChangeSuccess.value = false;
};

// Switch tab handler
const switchTab = (tab: TabType): void => {
  activeTab.value = tab;
  if (tab === "settings" && adminUsers.value.length === 0) {
    fetchAdminUsers();
  }
  if (tab === "rsvps" && rsvps.value.length === 0) {
    fetchRsvps();
  }
};

// Logout handler
const handleLogout = (): void => {
  sessionStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_username");
  sessionStorage.removeItem("admin_is_master");
  isAuthenticated.value = false;
  currentUser.value = "";
  isMasterUser.value = false;
  rsvps.value = [];
  adminUsers.value = [];
};

// Format date as DD/MM/YYYY HH:MM (24-hour)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Export to CSV
const exportToCsv = (): void => {
  const headers = ["Title", "Full Name", "Phone", "Attending", "Guests", "Message", "Submitted At"];
  const rows = rsvps.value.map((r) => [
    r.title,
    r.fullName,
    r.phoneNumber,
    r.isAttending ? "Yes" : "No",
    r.numberOfGuests.toString(),
    `"${r.message.replace(/"/g, '""')}"`,
    r.submittedAt,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `rsvp-list-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
    <!-- Success Popup -->
    <div v-if="showSuccessPopup" class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4">
      <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div class="text-center">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">Admin Created Successfully</h3>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-4">
            User "{{ createdCredentials.username }}" has been created
            <span v-if="createdCredentials.email"> and a welcome email has been sent.</span>
            <span v-else>.</span>
          </p>
          <button
            type="button"
            class="px-6 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            @click="closePopups"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Email Warning Popup -->
    <div v-if="showEmailWarningPopup" class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4">
      <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
        <div class="text-center">
          <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">Admin Created (Email Failed)</h3>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-2">
            User "{{ createdCredentials.username }}" has been created successfully, but the welcome email could not be sent.
          </p>
          <p class="font-body text-xs text-red-600 mb-4">
            {{ emailWarningMessage }}
          </p>

          <!-- Clipboard section -->
          <div class="bg-sand dark:bg-dark-bg-elevated rounded-lg p-3 mb-4 text-left">
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">Subject:</p>
            <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium mb-3">Wedding Admin Portal - Your Login Credentials</p>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">Click below to copy the full message with credentials:</p>
          </div>

          <div class="flex gap-3 justify-center">
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
              @click="copyCredentialsToClipboard"
            >
              <svg v-if="!clipboardCopied" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {{ clipboardCopied ? "Copied!" : "Copy Credentials" }}
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
              @click="closePopups"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    <div
      v-if="showPasswordChangeModal"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
      @click.self="closePasswordChangeModal"
    >
      <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
        <!-- Success State -->
        <div v-if="passwordChangeSuccess" class="text-center">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">Password Changed</h3>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Your password has been updated successfully.</p>
        </div>

        <!-- Form State -->
        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-lg text-charcoal">Change Password</h3>
            <button
              type="button"
              class="text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
              @click="closePasswordChangeModal"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <!-- Current Password -->
            <div>
              <label for="currentPassword" class="block font-body text-sm font-medium text-charcoal mb-1">
                Current Password
              </label>
              <div class="relative">
                <input
                  id="currentPassword"
                  v-model="currentPasswordInput"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <svg v-if="showCurrentPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label for="newPassword" class="block font-body text-sm font-medium text-charcoal mb-1">
                New Password
              </label>
              <div class="relative">
                <input
                  id="newPassword"
                  v-model="newPasswordInput"
                  :type="showNewPassword ? 'text' : 'password'"
                  class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                  placeholder="Enter new password"
                  required
                  minlength="6"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
                  @click="showNewPassword = !showNewPassword"
                >
                  <svg v-if="showNewPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirmNewPassword" class="block font-body text-sm font-medium text-charcoal mb-1">
                Confirm New Password
              </label>
              <div class="relative">
                <input
                  id="confirmNewPassword"
                  v-model="confirmNewPasswordInput"
                  :type="showConfirmNewPassword ? 'text' : 'password'"
                  class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                  placeholder="Confirm new password"
                  required
                  minlength="6"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
                  @click="showConfirmNewPassword = !showConfirmNewPassword"
                >
                  <svg v-if="showConfirmNewPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <p class="font-body text-xs text-charcoal-light">
              Password must be at least 6 characters.
            </p>

            <p v-if="passwordChangeError" class="text-red-600 font-body text-sm">
              {{ passwordChangeError }}
            </p>

            <div class="flex gap-3">
              <button
                type="submit"
                class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                :disabled="isChangingPassword"
              >
                {{ isChangingPassword ? "Changing..." : "Change Password" }}
              </button>
              <button
                type="button"
                class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
                @click="closePasswordChangeModal"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Login Form -->
    <div v-if="!isAuthenticated" class="relative flex items-center justify-center min-h-screen px-4">
      <!-- Dark Mode Toggle -->
      <div class="absolute top-4 right-4">
        <DarkModeToggle variant="light" />
      </div>
      <div class="w-full max-w-sm p-6 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg">
        <h1 class="font-heading text-2xl text-center text-sage-dark dark:text-sage-light mb-6">Admin Login</h1>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="username" class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
              placeholder="Enter username"
              required
              autofocus
            />
          </div>

          <div>
            <label for="password" class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showLoginPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
                @click="showLoginPassword = !showLoginPassword"
              >
                <svg v-if="showLoginPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-center">
            Use "master" as username with the master password for initial setup.
          </p>

          <p v-if="loginError" class="text-red-600 dark:text-red-400 font-body text-sm text-center">
            {{ loginError }}
          </p>

          <button
            type="submit"
            class="w-full py-3 px-6 font-body text-base font-medium text-white bg-sage rounded-lg cursor-pointer transition-colors hover:bg-sage-dark disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="isLoggingIn"
          >
            {{ isLoggingIn ? "Logging in..." : "Login" }}
          </button>
        </form>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-else class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">Admin Dashboard</h1>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
            Logged in as: <span class="font-medium">{{ currentUser }}</span>
            <span v-if="isMasterUser" class="ml-2 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Master</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Dark Mode Toggle -->
          <DarkModeToggle variant="light" />
          <!-- Change Password Button (hidden for master) -->
          <button
            v-if="!isMasterUser"
            type="button"
            class="flex items-center gap-2 px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage hover:text-white transition-colors cursor-pointer"
            @click="showPasswordChangeModal = true"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Change Password
          </button>
          <button
            type="button"
            class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-charcoal dark:hover:bg-dark-bg-elevated hover:text-white dark:hover:text-dark-text transition-colors cursor-pointer"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div class="flex border-b border-sand-dark dark:border-dark-border mb-6 min-w-max sm:min-w-0">
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'dashboard' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('dashboard')"
          >
            Dashboard
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'wedding' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('wedding')"
          >
            Wedding
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'venue' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('venue')"
          >
            Venue
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'schedule' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('schedule')"
          >
            Schedule
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'gallery' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('gallery')"
          >
            Gallery
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'contacts' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('contacts')"
          >
            Contacts
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'rsvps' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('rsvps')"
          >
            RSVPs
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer whitespace-nowrap"
            :class="activeTab === 'settings' ? 'text-sage border-sage' : 'text-charcoal-light dark:text-dark-text-secondary border-transparent hover:text-charcoal dark:hover:text-dark-text'"
            @click="switchTab('settings')"
          >
            Settings
          </button>
        </div>
      </div>

      <!-- Dashboard Tab Content -->
      <div v-if="activeTab === 'dashboard'">
        <DashboardTab @switch-tab="switchTab" />
      </div>

      <!-- Wedding Details Tab Content -->
      <div v-if="activeTab === 'wedding'">
        <WeddingDetailsTab />
      </div>

      <!-- Venue Tab Content -->
      <div v-if="activeTab === 'venue'">
        <LocationTab />
      </div>

      <!-- Schedule Tab Content -->
      <div v-if="activeTab === 'schedule'">
        <ScheduleTab />
      </div>

      <!-- Gallery Tab Content -->
      <div v-if="activeTab === 'gallery'">
        <GalleryTab />
      </div>

      <!-- Contacts Tab Content -->
      <div v-if="activeTab === 'contacts'">
        <ContactsTab />
      </div>

      <!-- RSVP Tab Content -->
      <div v-if="activeTab === 'rsvps'">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Total RSVPs</p>
            <p class="font-heading text-2xl text-sage-dark dark:text-sage-light">{{ summary.total }}</p>
          </div>
          <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Attending</p>
            <p class="font-heading text-2xl text-green-600 dark:text-green-400">{{ summary.attending }}</p>
          </div>
          <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Not Attending</p>
            <p class="font-heading text-2xl text-red-600 dark:text-red-400">{{ summary.notAttending }}</p>
          </div>
          <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Total Guests</p>
            <p class="font-heading text-2xl text-sage-dark dark:text-sage-light">{{ summary.totalGuests }}</p>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <!-- Filter -->
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
              :class="filter === 'all' ? 'bg-sage text-white' : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'"
              @click="filter = 'all'"
            >
              All ({{ summary.total }})
            </button>
            <button
              type="button"
              class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
              :class="filter === 'attending' ? 'bg-green-600 text-white' : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'"
              @click="filter = 'attending'"
            >
              Attending ({{ summary.attending }})
            </button>
            <button
              type="button"
              class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
              :class="filter === 'not_attending' ? 'bg-red-600 text-white' : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'"
              @click="filter = 'not_attending'"
            >
              Not Attending ({{ summary.notAttending }})
            </button>
          </div>

          <!-- Export -->
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage hover:text-white transition-colors cursor-pointer"
            @click="exportToCsv"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"></div>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">Loading RSVPs...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="loadError" class="text-center py-12">
          <p class="font-body text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
          <button
            type="button"
            class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
            @click="fetchRsvps"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredRsvps.length === 0" class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">No RSVPs found.</p>
        </div>

        <!-- RSVP List -->
        <div v-else class="space-y-3">
          <div
            v-for="rsvp in filteredRsvps"
            :key="rsvp.id"
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg"
          >
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-heading text-lg text-charcoal dark:text-dark-text">
                    {{ rsvp.title }} {{ rsvp.fullName }}
                  </p>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="rsvp.isAttending ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'"
                  >
                    {{ rsvp.isAttending ? "Attending" : "Not Attending" }}
                  </span>
                </div>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                  {{ rsvp.phoneNumber }}
                  <span v-if="rsvp.isAttending"> &bull; {{ rsvp.numberOfGuests }} guest(s)</span>
                </p>
                <p v-if="rsvp.message" class="font-body text-sm text-charcoal dark:text-dark-text mt-2 italic">
                  "{{ rsvp.message }}"
                </p>
              </div>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary whitespace-nowrap">
                {{ formatDate(rsvp.submittedAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="mt-6 text-center">
          <button
            type="button"
            class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors cursor-pointer"
            @click="fetchRsvps"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- Settings Tab Content (Admin Users) -->
      <div v-if="activeTab === 'settings'">
        <!-- Create Admin Button (master only) -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-heading text-xl text-charcoal dark:text-dark-text">Manage Admin Users</h2>
          <button
            v-if="isMasterUser"
            type="button"
            class="flex items-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            @click="showCreateForm = !showCreateForm"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Admin
          </button>
        </div>

        <!-- Create Admin Modal -->
        <div
          v-if="showCreateForm"
          class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
          @click.self="showCreateForm = false; newAdminUsername = ''; newAdminPassword = ''; newAdminEmail = ''; createError = ''"
        >
          <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-heading text-lg text-charcoal dark:text-dark-text">Create New Admin</h3>
              <button
                type="button"
                class="text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
                @click="showCreateForm = false; newAdminUsername = ''; newAdminPassword = ''; newAdminEmail = ''; createError = ''"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form @submit.prevent="handleCreateAdmin" class="space-y-4">
              <div>
                <label for="newUsername" class="block font-body text-sm font-medium text-charcoal mb-1">
                  Username
                </label>
                <input
                  id="newUsername"
                  v-model="newAdminUsername"
                  type="text"
                  class="w-full px-3 py-2.5 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label for="newPassword" class="block font-body text-sm font-medium text-charcoal mb-1">
                  Password
                </label>
                <div class="relative">
                  <input
                    id="newPassword"
                    v-model="newAdminPassword"
                    :type="showNewAdminPassword ? 'text' : 'password'"
                    class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                    placeholder="Enter password"
                    required
                    minlength="6"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
                    @click="showNewAdminPassword = !showNewAdminPassword"
                  >
                    <svg v-if="showNewAdminPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Email field -->
              <div>
                <label for="newEmail" class="block font-body text-sm font-medium text-charcoal mb-1">
                  Email <span class="text-charcoal-light font-normal">(optional)</span>
                </label>
                <input
                  id="newEmail"
                  v-model="newAdminEmail"
                  type="email"
                  class="w-full px-3 py-2.5 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                  placeholder="Enter email for welcome notification"
                />
                <p class="font-body text-xs text-charcoal-light mt-1">
                  A welcome email with login credentials will be sent to this address.
                </p>
              </div>

              <p v-if="createError" class="text-red-600 font-body text-sm">
                {{ createError }}
              </p>

              <div class="flex gap-3">
                <button
                  type="submit"
                  class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  :disabled="isCreating"
                >
                  {{ isCreating ? "Creating..." : "Create Admin" }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
                  @click="showCreateForm = false; newAdminUsername = ''; newAdminPassword = ''; newAdminEmail = ''; createError = ''"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingAdmins" class="text-center py-12">
          <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"></div>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">Loading admin users...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="adminLoadError" class="text-center py-12">
          <p class="font-body text-sm text-red-600 dark:text-red-400">{{ adminLoadError }}</p>
          <button
            type="button"
            class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
            @click="fetchAdminUsers"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="adminUsers.length === 0" class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">No admin users found.</p>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2">Create the first admin user to get started.</p>
        </div>

        <!-- Admin Users List -->
        <div v-else class="space-y-3">
          <div
            v-for="admin in adminUsers"
            :key="admin.username"
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-heading text-lg text-charcoal dark:text-dark-text">{{ admin.username }}</p>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                  Created by {{ admin.createdBy }} on {{ formatDate(admin.createdAt) }}
                </p>
              </div>
              <!-- Delete buttons (master only) -->
              <div v-if="isMasterUser" class="flex items-center gap-2">
                <button
                  v-if="deleteConfirm !== admin.username"
                  type="button"
                  class="px-3 py-1.5 font-body text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  @click="deleteConfirm = admin.username"
                >
                  Delete
                </button>
                <template v-else>
                  <span class="font-body text-sm text-charcoal-light">Confirm?</span>
                  <button
                    type="button"
                    class="px-3 py-1.5 font-body text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    :disabled="isDeleting"
                    @click="handleDeleteAdmin(admin.username)"
                  >
                    {{ isDeleting ? "..." : "Yes" }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
                    @click="deleteConfirm = null"
                  >
                    No
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="mt-6 text-center">
          <button
            type="button"
            class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors cursor-pointer"
            @click="fetchAdminUsers"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
