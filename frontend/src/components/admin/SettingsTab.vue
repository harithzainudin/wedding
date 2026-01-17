<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useAdminUsers } from '@/composables/useAdminUsers'
  import SuccessPopup from './SuccessPopup.vue'
  import EmailWarningPopup from './EmailWarningPopup.vue'
  import PasswordResetResultPopup from './PasswordResetResultPopup.vue'

  const props = defineProps<{
    isMasterUser: boolean
    currentUser: string
  }>()

  const {
    adminUsers,
    isLoadingAdmins,
    adminLoadError,
    showCreateForm,
    newAdminUsername,
    newAdminPassword,
    newAdminEmail,
    showNewAdminPassword,
    createError,
    isCreating,
    deleteConfirm,
    isDeleting,
    resetPasswordConfirm,
    isResetting,
    fetchAdminUsers,
    handleCreateAdmin,
    handleDeleteAdmin,
    handleForceResetPassword,
    closeCreateForm,
  } = useAdminUsers(() => props.currentUser)

  const showSuccessPopup = ref(false)
  const showEmailWarningPopup = ref(false)
  const emailWarningMessage = ref('')
  const createdCredentials = ref({ username: '', password: '' })

  const showPasswordResetPopup = ref(false)
  const passwordResetResult = ref({
    username: '',
    temporaryPassword: '',
    emailSent: false,
    emailError: '',
    hasEmail: false,
  })

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const onCreateAdmin = async (): Promise<void> => {
    const credentials = {
      username: newAdminUsername.value,
      password: newAdminPassword.value,
    }

    const result = await handleCreateAdmin()
    if (result?.success) {
      createdCredentials.value = credentials
      if (newAdminEmail.value) {
        if (result.emailSent) {
          showSuccessPopup.value = true
        } else {
          emailWarningMessage.value = result.emailError ?? 'Failed to send welcome email'
          showEmailWarningPopup.value = true
        }
      } else {
        showSuccessPopup.value = true
      }
    }
  }

  const closePopups = (): void => {
    showSuccessPopup.value = false
    showEmailWarningPopup.value = false
    emailWarningMessage.value = ''
    showPasswordResetPopup.value = false
  }

  const onResetPassword = async (admin: { username: string; email?: string }): Promise<void> => {
    const result = await handleForceResetPassword(admin.username)
    if (result?.success) {
      passwordResetResult.value = {
        username: admin.username,
        temporaryPassword: result.temporaryPassword ?? '',
        emailSent: result.emailSent ?? false,
        emailError: result.emailError ?? '',
        hasEmail: !!admin.email,
      }
      showPasswordResetPopup.value = true
    }
  }

  onMounted(() => {
    fetchAdminUsers()
  })
</script>

<template>
  <div>
    <SuccessPopup
      :show="showSuccessPopup"
      :username="createdCredentials.username"
      :has-email="!!newAdminEmail"
      @close="closePopups"
    />

    <EmailWarningPopup
      :show="showEmailWarningPopup"
      :username="createdCredentials.username"
      :password="createdCredentials.password"
      :warning-message="emailWarningMessage"
      @close="closePopups"
    />

    <PasswordResetResultPopup
      :show="showPasswordResetPopup"
      :username="passwordResetResult.username"
      :temporary-password="passwordResetResult.temporaryPassword"
      :email-sent="passwordResetResult.emailSent"
      :email-error="passwordResetResult.emailError"
      :has-email="passwordResetResult.hasEmail"
      @close="closePopups"
    />

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

    <div
      v-if="showCreateForm"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
      @click.self="closeCreateForm"
    >
      <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-heading text-lg text-charcoal dark:text-dark-text">Create New Admin</h3>
          <button
            type="button"
            class="text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
            @click="closeCreateForm"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="onCreateAdmin" class="space-y-4">
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
                <svg
                  v-if="showNewAdminPassword"
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label for="newEmail" class="block font-body text-sm font-medium text-charcoal mb-1">
              Email
              <span class="text-charcoal-light font-normal">(optional)</span>
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
              {{ isCreating ? 'Creating...' : 'Create Admin' }}
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
              @click="closeCreateForm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isLoadingAdmins" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      ></div>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading admin users...
      </p>
    </div>

    <div v-else-if="adminLoadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">
        {{ adminLoadError }}
      </p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="fetchAdminUsers"
      >
        Try Again
      </button>
    </div>

    <div
      v-else-if="adminUsers.length === 0"
      class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl"
    >
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        No admin users found.
      </p>
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2">
        Create the first admin user to get started.
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="admin in adminUsers"
        :key="admin.username"
        class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-heading text-lg text-charcoal dark:text-dark-text">
              {{ admin.username }}
            </p>
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              Created by {{ admin.createdBy }} on
              {{ formatDate(admin.createdAt) }}
            </p>
          </div>
          <div v-if="isMasterUser" class="flex items-center gap-2 flex-wrap justify-end">
            <!-- Reset Password Button -->
            <template
              v-if="resetPasswordConfirm !== admin.username && deleteConfirm !== admin.username"
            >
              <button
                type="button"
                class="px-3 py-1.5 font-body text-sm text-amber-600 dark:text-amber-400 border border-amber-600 dark:border-amber-400 rounded-lg hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition-colors cursor-pointer"
                @click="resetPasswordConfirm = admin.username"
              >
                Reset Password
              </button>
              <button
                type="button"
                class="px-3 py-1.5 font-body text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                @click="deleteConfirm = admin.username"
              >
                Delete
              </button>
            </template>

            <!-- Reset Password Confirmation -->
            <template v-else-if="resetPasswordConfirm === admin.username">
              <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                >Reset password?</span
              >
              <button
                type="button"
                class="px-3 py-1.5 font-body text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                :disabled="isResetting"
                @click="onResetPassword(admin)"
              >
                {{ isResetting ? '...' : 'Yes' }}
              </button>
              <button
                type="button"
                class="px-3 py-1.5 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                @click="resetPasswordConfirm = null"
              >
                No
              </button>
            </template>

            <!-- Delete Confirmation -->
            <template v-else-if="deleteConfirm === admin.username">
              <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                >Delete?</span
              >
              <button
                type="button"
                class="px-3 py-1.5 font-body text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                :disabled="isDeleting"
                @click="handleDeleteAdmin(admin.username)"
              >
                {{ isDeleting ? '...' : 'Yes' }}
              </button>
              <button
                type="button"
                class="px-3 py-1.5 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                @click="deleteConfirm = null"
              >
                No
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

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
</template>
