<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { useSuperAdminSettings } from '@/composables/useSuperAdminSettings'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useToast } from '@/composables/useToast'
  import PasswordResetResultPopup from '@/components/admin/PasswordResetResultPopup.vue'

  const { adminT } = useAdminLanguage()
  const toast = useToast()
  const { currentUser, userType } = useAdminAuth()

  const {
    superAdmins,
    isLoadingAdmins,
    isChangingPassword,
    isResettingPassword,
    loadError,
    fetchSuperAdmins,
    changeOwnPassword,
    resetSuperAdminPassword,
  } = useSuperAdminSettings()

  // Check if current user is master
  const isMaster = computed(() => currentUser.value === 'master' && userType.value === 'super')

  // Password change form
  const currentPasswordInput = ref<HTMLInputElement | null>(null)
  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const showCurrentPassword = ref(false)
  const showNewPassword = ref(false)
  const showConfirmPassword = ref(false)
  const passwordError = ref('')

  // Reset password state
  const showResetConfirm = ref<string | null>(null)
  const temporaryPassword = ref<string | null>(null)
  const selectedUsername = ref('')

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Password validation
  const validatePassword = (): boolean => {
    passwordError.value = ''

    if (!currentPassword.value) {
      passwordError.value = adminT.value.superAdminSettings.currentPassword + ' is required'
      return false
    }

    if (!newPassword.value) {
      passwordError.value = adminT.value.superAdminSettings.newPassword + ' is required'
      return false
    }

    if (newPassword.value.length < 6) {
      passwordError.value = adminT.value.superAdminSettings.passwordMinLength
      return false
    }

    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = adminT.value.superAdminSettings.passwordsDoNotMatch
      return false
    }

    if (currentPassword.value === newPassword.value) {
      passwordError.value = adminT.value.superAdminSettings.passwordSameAsCurrent
      return false
    }

    return true
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (!validatePassword()) return

    const result = await changeOwnPassword(currentPassword.value, newPassword.value)
    if (result.success) {
      toast.success(adminT.value.superAdminSettings.passwordChanged)
      clearPasswordForm()
    } else {
      passwordError.value = result.error ?? 'Failed to change password'
    }
  }

  // Clear password form
  const clearPasswordForm = () => {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordError.value = ''
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  }

  // Handle reset password click
  const handleResetClick = (username: string) => {
    showResetConfirm.value = username
  }

  // Confirm reset password
  const confirmResetPassword = async () => {
    if (!showResetConfirm.value) return

    const username = showResetConfirm.value
    selectedUsername.value = username
    showResetConfirm.value = null

    const result = await resetSuperAdminPassword(username)
    if (result.success && result.temporaryPassword) {
      temporaryPassword.value = result.temporaryPassword
      toast.success(adminT.value.toast.resetPasswordSuccess)
    } else {
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Cancel reset
  const cancelReset = () => {
    showResetConfirm.value = null
  }

  // Close temporary password popup
  const closePasswordPopup = () => {
    temporaryPassword.value = null
    selectedUsername.value = ''
  }

  // Handle ESC key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (temporaryPassword.value) {
        closePasswordPopup()
      } else if (showResetConfirm.value) {
        cancelReset()
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    // Auto-focus on current password input
    nextTick(() => {
      currentPasswordInput.value?.focus()
    })
    // Fetch super admins if master
    if (isMaster.value) {
      fetchSuperAdmins()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="font-heading text-xl font-bold text-charcoal dark:text-dark-text">
        {{ adminT.superAdminSettings.title }}
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.superAdminSettings.description }}
      </p>
    </div>

    <!-- Change Password Section -->
    <div
      class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-sand-dark dark:border-dark-border">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-sage/10 dark:bg-sage/20 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-sage"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-heading font-medium text-charcoal dark:text-dark-text">
              {{ adminT.superAdminSettings.changePassword }}
            </h3>
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.superAdminSettings.changePasswordDesc }}
            </p>
          </div>
        </div>
      </div>

      <form class="p-6 space-y-4" @submit.prevent="handleChangePassword">
        <!-- Current Password -->
        <div>
          <label
            class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ adminT.superAdminSettings.currentPassword }} *
          </label>
          <div class="relative">
            <input
              ref="currentPasswordInput"
              v-model="currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              class="w-full px-3 py-2 pr-10 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <svg v-if="showCurrentPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div>
          <label
            class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ adminT.superAdminSettings.newPassword }} *
          </label>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="w-full px-3 py-2 pr-10 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
              @click="showNewPassword = !showNewPassword"
            >
              <svg v-if="showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.superAdminSettings.passwordMinLength }}
          </p>
        </div>

        <!-- Confirm New Password -->
        <div>
          <label
            class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ adminT.superAdminSettings.confirmPassword }} *
          </label>
          <div class="relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="w-full px-3 py-2 pr-10 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="passwordError" class="font-body text-sm text-red-500">
          {{ passwordError }}
        </p>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
            @click="clearPasswordForm"
          >
            {{ adminT.common.cancel }}
          </button>
          <button
            type="submit"
            :disabled="isChangingPassword"
            class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="isChangingPassword"
              class="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{
              isChangingPassword
                ? adminT.superAdminSettings.changingPassword
                : adminT.superAdminSettings.changePassword
            }}
          </button>
        </div>
      </form>
    </div>

    <!-- Manage Super Admins Section (Master Only) -->
    <div
      v-if="isMaster"
      class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-sand-dark dark:border-dark-border">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-heading font-medium text-charcoal dark:text-dark-text">
              {{ adminT.superAdminSettings.manageSuperAdmins }}
            </h3>
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.superAdminSettings.manageSuperAdminsDesc }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingAdmins" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-12 px-6">
        <p class="font-body text-red-500 mb-4">{{ loadError }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
          @click="fetchSuperAdmins"
        >
          {{ adminT.common.tryAgain }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="superAdmins.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-4">👤</div>
        <p class="font-body text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.superAdminSettings.noOtherAdmins }}
        </p>
      </div>

      <!-- Super Admin List -->
      <div v-else class="divide-y divide-sand-dark dark:divide-dark-border">
        <div
          v-for="admin in superAdmins"
          :key="admin.username"
          class="p-4 hover:bg-sand/50 dark:hover:bg-dark-bg/50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xl">👤</span>
                <h4 class="font-heading font-medium text-charcoal dark:text-dark-text">
                  {{ admin.username }}
                </h4>
              </div>
              <p
                v-if="admin.email"
                class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1"
              >
                {{ admin.email }}
              </p>
              <p
                v-else
                class="font-body text-sm text-charcoal-light/70 dark:text-dark-text-secondary/70 italic mt-1"
              >
                {{ adminT.superAdminSettings.noEmail }}
              </p>
              <p
                class="font-body text-xs text-charcoal-light/50 dark:text-dark-text-secondary/50 mt-2"
              >
                {{ adminT.superAdminSettings.createdAt }}: {{ formatDate(admin.createdAt) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Reset Password Button / Confirmation -->
              <template v-if="showResetConfirm === admin.username">
                <span class="font-body text-sm text-amber-600 dark:text-amber-400 mr-2">
                  {{ adminT.superAdminSettings.resetPassword }}?
                </span>
                <button
                  type="button"
                  :disabled="isResettingPassword"
                  class="px-3 py-1.5 text-sm font-body bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50"
                  @click="confirmResetPassword"
                >
                  {{ adminT.common.yes }}
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm font-body text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text border border-charcoal-light/30 dark:border-dark-border rounded-lg transition-colors cursor-pointer"
                  @click="cancelReset"
                >
                  {{ adminT.common.no }}
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm font-body text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer"
                  @click="handleResetClick(admin.username)"
                >
                  {{ adminT.superAdminSettings.resetPassword }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Reset Result Popup -->
    <PasswordResetResultPopup
      :show="!!temporaryPassword"
      :username="selectedUsername"
      :temporary-password="temporaryPassword ?? ''"
      :email-sent="false"
      :has-email="false"
      @close="closePasswordPopup"
    />
  </div>
</template>
