/**
 * Composable for Super Admin Settings
 *
 * Provides functionality for:
 * - Changing own password (all super admins)
 * - Listing super admins (master only)
 * - Resetting other super admins' passwords (master only)
 */

import { ref } from 'vue'
import type { SuperAdminProfile } from '@/types/admin'
import {
  changeSuperAdminPassword as apiChangePassword,
  listSuperAdmins as apiListSuperAdmins,
  resetSuperAdminPassword as apiResetPassword,
} from '@/services/api'

// Singleton state for super admin list
const superAdmins = ref<SuperAdminProfile[]>([])
const isLoadingAdmins = ref(false)
const loadError = ref<string | null>(null)

// Password change state
const isChangingPassword = ref(false)
const isResettingPassword = ref(false)

export function useSuperAdminSettings() {
  /**
   * Fetch all super admins (master only)
   */
  const fetchSuperAdmins = async (): Promise<void> => {
    isLoadingAdmins.value = true
    loadError.value = null
    try {
      const response = await apiListSuperAdmins()
      superAdmins.value = response.superAdmins
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load super admins'
    } finally {
      isLoadingAdmins.value = false
    }
  }

  /**
   * Change own password
   */
  const changeOwnPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    isChangingPassword.value = true
    try {
      await apiChangePassword({ currentPassword, newPassword })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      return { success: false, error: errorMessage }
    } finally {
      isChangingPassword.value = false
    }
  }

  /**
   * Reset another super admin's password (master only)
   */
  const resetSuperAdminPassword = async (
    username: string
  ): Promise<{
    success: boolean
    temporaryPassword?: string
    error?: string
  }> => {
    isResettingPassword.value = true
    try {
      const response = await apiResetPassword(username)
      return { success: true, temporaryPassword: response.temporaryPassword }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      return { success: false, error: errorMessage }
    } finally {
      isResettingPassword.value = false
    }
  }

  /**
   * Clear error state
   */
  const clearError = (): void => {
    loadError.value = null
  }

  return {
    // State
    superAdmins,
    isLoadingAdmins,
    isChangingPassword,
    isResettingPassword,
    loadError,
    // Actions
    fetchSuperAdmins,
    changeOwnPassword,
    resetSuperAdminPassword,
    clearError,
  }
}
