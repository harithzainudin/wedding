import { ref } from 'vue'
import { getAdminProfile, updateAdminEmail } from '@/services/api'

export function useProfile(_getCurrentUser: () => string) {
  const showProfileModal = ref(false)
  const email = ref<string>('')
  const originalEmail = ref<string>('')
  const isLoadingProfile = ref(false)
  const isSavingProfile = ref(false)
  const profileError = ref('')
  const profileSuccess = ref(false)

  const fetchProfile = async (): Promise<void> => {
    isLoadingProfile.value = true
    profileError.value = ''

    try {
      const data = await getAdminProfile()
      email.value = data.email ?? ''
      originalEmail.value = data.email ?? ''
    } catch (err) {
      profileError.value =
        err instanceof Error ? err.message : 'Failed to fetch profile. Please try again.'
    } finally {
      isLoadingProfile.value = false
    }
  }

  const updateEmail = async (): Promise<boolean> => {
    profileError.value = ''

    // Nothing to update if email hasn't changed
    if (email.value === originalEmail.value) {
      return true
    }

    isSavingProfile.value = true

    try {
      await updateAdminEmail({
        email: email.value,
      })

      profileSuccess.value = true
      originalEmail.value = email.value
      setTimeout(() => {
        profileSuccess.value = false
      }, 2000)
      return true
    } catch (err) {
      profileError.value =
        err instanceof Error ? err.message : 'Failed to update email. Please try again.'
      return false
    } finally {
      isSavingProfile.value = false
    }
  }

  const openProfileModal = (): void => {
    showProfileModal.value = true
    fetchProfile()
  }

  const closeProfileModal = (): void => {
    showProfileModal.value = false
    email.value = originalEmail.value
    profileError.value = ''
    profileSuccess.value = false
  }

  const hasChanges = (): boolean => {
    return email.value !== originalEmail.value
  }

  return {
    showProfileModal,
    email,
    isLoadingProfile,
    isSavingProfile,
    profileError,
    profileSuccess,
    fetchProfile,
    updateEmail,
    openProfileModal,
    closeProfileModal,
    hasChanges,
  }
}
