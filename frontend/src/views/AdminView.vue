<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { adminLogin, listRsvps, listAdminUsers, createAdminUser, deleteAdminUser } from "@/services/api";
import type { RsvpSubmission } from "@/types/rsvp";
import type { AdminUser } from "@/types/admin";

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
const activeTab = ref<"rsvps" | "admins">("rsvps");
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
const showNewAdminPassword = ref(false);
const createError = ref("");
const isCreating = ref(false);
const deleteConfirm = ref<string | null>(null);
const isDeleting = ref(false);

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
    const response = await createAdminUser({
      username: newAdminUsername.value,
      password: newAdminPassword.value,
      createdBy: currentUser.value,
    });
    if (response.success) {
      newAdminUsername.value = "";
      newAdminPassword.value = "";
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

// Switch tab handler
const switchTab = (tab: "rsvps" | "admins"): void => {
  activeTab.value = tab;
  if (tab === "admins" && adminUsers.value.length === 0) {
    fetchAdminUsers();
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

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  <div class="min-h-screen bg-sand">
    <!-- Login Form -->
    <div v-if="!isAuthenticated" class="flex items-center justify-center min-h-screen px-4">
      <div class="w-full max-w-sm p-6 bg-white rounded-xl shadow-lg">
        <h1 class="font-heading text-2xl text-center text-sage-dark mb-6">Admin Login</h1>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="username" class="block font-body text-sm font-medium text-charcoal mb-1">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
              placeholder="Enter username"
              required
              autofocus
            />
          </div>

          <div>
            <label for="password" class="block font-body text-sm font-medium text-charcoal mb-1">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showLoginPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
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

          <p class="font-body text-xs text-charcoal-light text-center">
            Use "master" as username with the master password for initial setup.
          </p>

          <p v-if="loginError" class="text-red-600 font-body text-sm text-center">
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
          <h1 class="font-heading text-2xl sm:text-3xl text-sage-dark">Admin Dashboard</h1>
          <p class="font-body text-sm text-charcoal-light mt-1">
            Logged in as: <span class="font-medium">{{ currentUser }}</span>
            <span v-if="isMasterUser" class="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">Master</span>
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-charcoal hover:text-white transition-colors"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-sand-dark mb-6">
        <button
          type="button"
          class="px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px"
          :class="activeTab === 'rsvps' ? 'text-sage border-sage' : 'text-charcoal-light border-transparent hover:text-charcoal'"
          @click="switchTab('rsvps')"
        >
          RSVPs
        </button>
        <button
          type="button"
          class="px-4 py-3 font-body text-sm font-medium transition-colors border-b-2 -mb-px"
          :class="activeTab === 'admins' ? 'text-sage border-sage' : 'text-charcoal-light border-transparent hover:text-charcoal'"
          @click="switchTab('admins')"
        >
          Admin Users
        </button>
      </div>

      <!-- RSVP Tab Content -->
      <div v-if="activeTab === 'rsvps'">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="p-4 bg-white rounded-xl shadow-sm">
            <p class="font-body text-sm text-charcoal-light">Total RSVPs</p>
            <p class="font-heading text-2xl text-sage-dark">{{ summary.total }}</p>
          </div>
          <div class="p-4 bg-white rounded-xl shadow-sm">
            <p class="font-body text-sm text-charcoal-light">Attending</p>
            <p class="font-heading text-2xl text-green-600">{{ summary.attending }}</p>
          </div>
          <div class="p-4 bg-white rounded-xl shadow-sm">
            <p class="font-body text-sm text-charcoal-light">Not Attending</p>
            <p class="font-heading text-2xl text-red-600">{{ summary.notAttending }}</p>
          </div>
          <div class="p-4 bg-white rounded-xl shadow-sm">
            <p class="font-body text-sm text-charcoal-light">Total Guests</p>
            <p class="font-heading text-2xl text-sage-dark">{{ summary.totalGuests }}</p>
          </div>
        </div>

        <!-- Actions Bar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <!-- Filter -->
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 font-body text-sm rounded-full transition-colors"
              :class="filter === 'all' ? 'bg-sage text-white' : 'bg-white text-charcoal hover:bg-sand-dark'"
              @click="filter = 'all'"
            >
              All ({{ summary.total }})
            </button>
            <button
              type="button"
              class="px-3 py-1.5 font-body text-sm rounded-full transition-colors"
              :class="filter === 'attending' ? 'bg-green-600 text-white' : 'bg-white text-charcoal hover:bg-sand-dark'"
              @click="filter = 'attending'"
            >
              Attending ({{ summary.attending }})
            </button>
            <button
              type="button"
              class="px-3 py-1.5 font-body text-sm rounded-full transition-colors"
              :class="filter === 'not_attending' ? 'bg-red-600 text-white' : 'bg-white text-charcoal hover:bg-sand-dark'"
              @click="filter = 'not_attending'"
            >
              Not Attending ({{ summary.notAttending }})
            </button>
          </div>

          <!-- Export -->
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage hover:text-white transition-colors"
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
          <p class="font-body text-sm text-charcoal-light mt-3">Loading RSVPs...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="loadError" class="text-center py-12">
          <p class="font-body text-sm text-red-600">{{ loadError }}</p>
          <button
            type="button"
            class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors"
            @click="fetchRsvps"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredRsvps.length === 0" class="text-center py-12 bg-white rounded-xl">
          <p class="font-body text-sm text-charcoal-light">No RSVPs found.</p>
        </div>

        <!-- RSVP List -->
        <div v-else class="space-y-3">
          <div
            v-for="rsvp in filteredRsvps"
            :key="rsvp.id"
            class="p-4 bg-white rounded-xl shadow-sm"
          >
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-heading text-lg text-charcoal">
                    {{ rsvp.title }} {{ rsvp.fullName }}
                  </p>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="rsvp.isAttending ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  >
                    {{ rsvp.isAttending ? "Attending" : "Not Attending" }}
                  </span>
                </div>
                <p class="font-body text-sm text-charcoal-light">
                  {{ rsvp.phoneNumber }}
                  <span v-if="rsvp.isAttending"> &bull; {{ rsvp.numberOfGuests }} guest(s)</span>
                </p>
                <p v-if="rsvp.message" class="font-body text-sm text-charcoal mt-2 italic">
                  "{{ rsvp.message }}"
                </p>
              </div>
              <p class="font-body text-xs text-charcoal-light whitespace-nowrap">
                {{ formatDate(rsvp.submittedAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="mt-6 text-center">
          <button
            type="button"
            class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors"
            @click="fetchRsvps"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- Admin Users Tab Content -->
      <div v-if="activeTab === 'admins'">
        <!-- Create Admin Button -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-heading text-xl text-charcoal">Manage Admin Users</h2>
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors"
            @click="showCreateForm = !showCreateForm"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Admin
          </button>
        </div>

        <!-- Create Admin Form -->
        <div v-if="showCreateForm" class="mb-6 p-4 bg-white rounded-xl shadow-sm">
          <h3 class="font-heading text-lg text-charcoal mb-4">Create New Admin</h3>
          <form @submit.prevent="handleCreateAdmin" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
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
            </div>

            <p v-if="createError" class="text-red-600 font-body text-sm">
              {{ createError }}
            </p>

            <div class="flex gap-3">
              <button
                type="submit"
                class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                :disabled="isCreating"
              >
                {{ isCreating ? "Creating..." : "Create Admin" }}
              </button>
              <button
                type="button"
                class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors"
                @click="showCreateForm = false; newAdminUsername = ''; newAdminPassword = ''; createError = ''"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingAdmins" class="text-center py-12">
          <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"></div>
          <p class="font-body text-sm text-charcoal-light mt-3">Loading admin users...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="adminLoadError" class="text-center py-12">
          <p class="font-body text-sm text-red-600">{{ adminLoadError }}</p>
          <button
            type="button"
            class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors"
            @click="fetchAdminUsers"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="adminUsers.length === 0" class="text-center py-12 bg-white rounded-xl">
          <p class="font-body text-sm text-charcoal-light">No admin users found.</p>
          <p class="font-body text-xs text-charcoal-light mt-2">Create the first admin user to get started.</p>
        </div>

        <!-- Admin Users List -->
        <div v-else class="space-y-3">
          <div
            v-for="admin in adminUsers"
            :key="admin.username"
            class="p-4 bg-white rounded-xl shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-heading text-lg text-charcoal">{{ admin.username }}</p>
                <p class="font-body text-sm text-charcoal-light">
                  Created by {{ admin.createdBy }} on {{ formatDate(admin.createdAt) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="deleteConfirm !== admin.username"
                  type="button"
                  class="px-3 py-1.5 font-body text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  @click="deleteConfirm = admin.username"
                >
                  Delete
                </button>
                <template v-else>
                  <span class="font-body text-sm text-charcoal-light">Confirm?</span>
                  <button
                    type="button"
                    class="px-3 py-1.5 font-body text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
                    :disabled="isDeleting"
                    @click="handleDeleteAdmin(admin.username)"
                  >
                    {{ isDeleting ? "..." : "Yes" }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors"
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
            class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors"
            @click="fetchAdminUsers"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
