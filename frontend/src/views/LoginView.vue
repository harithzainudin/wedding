<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import AdminLoginForm from '@/components/admin/AdminLoginForm.vue'
  import ForcedPasswordChangeModal from '@/components/admin/ForcedPasswordChangeModal.vue'

  const router = useRouter()
  const { adminT } = useAdminLanguage()

  useDocumentTitle({ text: 'Login', position: 'prefix', static: true })

  const {
    isAuthenticated,
    isCheckingAuth,
    username,
    password,
    showLoginPassword,
    loginError,
    isLoggingIn,
    mustChangePassword,
    newPasswordForChange,
    confirmNewPasswordForChange,
    showNewPasswordForChange,
    showConfirmNewPasswordForChange,
    forcedPasswordChangeError,
    isSettingNewPassword,
    checkExistingAuth,
    handleLogin,
    handleSetNewPassword,
    getRedirectPath,
  } = useAdminAuth()

  const onLogin = async (): Promise<void> => {
    const success = await handleLogin()
    if (success && !mustChangePassword.value) {
      // Redirect based on user type
      const redirectPath = getRedirectPath()
      router.push(redirectPath)
    }
  }

  const onPasswordChanged = async (): Promise<void> => {
    const success = await handleSetNewPassword()
    if (success) {
      // After password change, redirect to appropriate page
      const redirectPath = getRedirectPath()
      router.push(redirectPath)
    }
  }

  onMounted(async () => {
    const wasAuthenticated = await checkExistingAuth()
    if (wasAuthenticated) {
      // Already logged in, redirect to appropriate page
      const redirectPath = getRedirectPath()
      router.push(redirectPath)
    }
  })
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg transition-colors duration-300">
    <!-- Loading state while checking auth -->
    <div v-if="isCheckingAuth" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        <span class="text-charcoal-light dark:text-dark-text-secondary text-sm font-body">{{
          adminT.common.loading
        }}</span>
      </div>
    </div>

    <template v-else>
      <!-- Forced Password Change Modal -->
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
        @submit="onPasswordChanged"
      />

      <!-- Login Form (only show if not already authenticated and not changing password) -->
      <AdminLoginForm
        v-if="!isAuthenticated && !mustChangePassword"
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
    </template>
  </div>
</template>
