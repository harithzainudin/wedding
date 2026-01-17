import { ref, onMounted, onUnmounted } from 'vue'
import type { UserType } from '@/types/admin'
import { adminLogin, setNewPassword } from '@/services/api'
import {
  storeTokens,
  clearTokens,
  hasValidTokens,
  getStoredUsername,
  getStoredIsMaster,
  getStoredUserType,
  getStoredWeddingIds,
  getStoredPrimaryWeddingId,
  refreshTokens,
  AUTH_EXPIRED_EVENT,
} from '@/services/tokenManager'

export function useAdminAuth() {
  const isAuthenticated = ref(false)
  const isCheckingAuth = ref(true)
  const username = ref('')
  const password = ref('')
  const showLoginPassword = ref(false)
  const loginError = ref('')
  const isLoggingIn = ref(false)
  const currentUser = ref('')
  const isMasterUser = ref(false)
  const userType = ref<UserType>('legacy')
  const mustChangePassword = ref(false)

  // Forced password change state
  const newPasswordForChange = ref('')
  const confirmNewPasswordForChange = ref('')
  const showNewPasswordForChange = ref(false)
  const showConfirmNewPasswordForChange = ref(false)
  const forcedPasswordChangeError = ref('')
  const isSettingNewPassword = ref(false)

  const checkExistingAuth = async (): Promise<boolean> => {
    isCheckingAuth.value = true
    try {
      if (hasValidTokens()) {
        // Try to refresh to validate tokens are still valid
        const success = await refreshTokens()
        if (success) {
          isAuthenticated.value = true
          currentUser.value = getStoredUsername() ?? ''
          isMasterUser.value = getStoredIsMaster()
          userType.value = getStoredUserType()
          return true
        }
      }

      // Clear invalid tokens
      clearTokens()
      return false
    } finally {
      isCheckingAuth.value = false
    }
  }

  const handleLogin = async (): Promise<boolean> => {
    loginError.value = ''
    isLoggingIn.value = true

    try {
      const response = await adminLogin({
        username: username.value,
        password: password.value,
      })

      // Support both new (accessToken/refreshToken) and legacy (token) responses
      const accessToken = response.accessToken ?? response.token
      const refreshToken = response.refreshToken

      if (accessToken && refreshToken) {
        storeTokens({
          accessToken,
          refreshToken,
          expiresIn: response.expiresIn ?? 900,
          username: response.username ?? '',
          isMaster: response.isMaster ?? false,
          userType: response.userType ?? 'legacy',
          weddingIds: response.weddingIds,
          primaryWeddingId: response.primaryWeddingId,
        })

        isAuthenticated.value = true
        currentUser.value = response.username ?? ''
        isMasterUser.value = response.isMaster ?? false
        userType.value = response.userType ?? 'legacy'
        mustChangePassword.value = response.mustChangePassword ?? false
        username.value = ''
        password.value = ''
        return true
      } else {
        loginError.value = 'Invalid response from server'
        return false
      }
    } catch (error) {
      loginError.value =
        error instanceof Error ? error.message : 'Failed to login. Please try again.'
      return false
    } finally {
      isLoggingIn.value = false
    }
  }

  const handleLogout = (): void => {
    clearTokens()
    isAuthenticated.value = false
    currentUser.value = ''
    isMasterUser.value = false
    userType.value = 'legacy'
    mustChangePassword.value = false
    resetForcedPasswordChangeForm()
  }

  const resetForcedPasswordChangeForm = (): void => {
    newPasswordForChange.value = ''
    confirmNewPasswordForChange.value = ''
    showNewPasswordForChange.value = false
    showConfirmNewPasswordForChange.value = false
    forcedPasswordChangeError.value = ''
  }

  const handleSetNewPassword = async (): Promise<boolean> => {
    forcedPasswordChangeError.value = ''

    // Validation
    if (!newPasswordForChange.value) {
      forcedPasswordChangeError.value = 'New password is required'
      return false
    }

    if (newPasswordForChange.value.length < 6) {
      forcedPasswordChangeError.value = 'Password must be at least 6 characters'
      return false
    }

    if (newPasswordForChange.value !== confirmNewPasswordForChange.value) {
      forcedPasswordChangeError.value = 'Passwords do not match'
      return false
    }

    isSettingNewPassword.value = true

    try {
      await setNewPassword({ newPassword: newPasswordForChange.value })
      // If we get here, password was set successfully
      mustChangePassword.value = false
      resetForcedPasswordChangeForm()
      return true
    } catch (error) {
      forcedPasswordChangeError.value =
        error instanceof Error ? error.message : 'Failed to set new password. Please try again.'
      return false
    } finally {
      isSettingNewPassword.value = false
    }
  }

  // Listen for auth expiry events from API calls
  const handleAuthExpired = (): void => {
    handleLogout()
  }

  onMounted(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  })

  onUnmounted(() => {
    window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  })

  return {
    isAuthenticated,
    isCheckingAuth,
    username,
    password,
    showLoginPassword,
    loginError,
    isLoggingIn,
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
    handleLogin,
    handleLogout,
    handleSetNewPassword,
  }
}
