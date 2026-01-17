import { ref, computed } from 'vue'
import type {
  Wedding,
  CreateWeddingRequest,
  UpdateWeddingRequest,
  AddWeddingOwnerRequest,
  UpdateWeddingOwnerRequest,
  WeddingAdmin,
  DeletionPreview,
} from '@/types/admin'
import {
  listWeddings,
  getWeddingById,
  createWedding as apiCreateWedding,
  updateWeddingById,
  archiveWedding as apiArchiveWedding,
  addWeddingOwner as apiAddWeddingOwner,
  updateWeddingOwner as apiUpdateWeddingOwner,
  removeWeddingOwner as apiRemoveWeddingOwner,
  resetOwnerPassword as apiResetOwnerPassword,
  getDeletionPreview as apiGetDeletionPreview,
  hardDeleteWedding as apiHardDeleteWedding,
} from '@/services/api'

// Singleton state
const weddings = ref<Wedding[]>([])
const selectedWedding = ref<Wedding | null>(null)
const selectedWeddingAdmins = ref<WeddingAdmin[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const isHardDeleting = ref(false)
const isLoadingPreview = ref(false)
const deletionPreview = ref<DeletionPreview | null>(null)
const loadError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actionSuccess = ref<string | null>(null)

export function useSuperAdmin() {
  // Computed
  const activeWeddings = computed(() => weddings.value.filter((w) => w.status === 'active'))
  const archivedWeddings = computed(() => weddings.value.filter((w) => w.status === 'archived'))
  const totalWeddings = computed(() => weddings.value.length)

  // Fetch all weddings
  const fetchWeddings = async (): Promise<void> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await listWeddings()
      weddings.value = response.weddings
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load weddings'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch a single wedding by ID (returns wedding with admins)
  const fetchWedding = async (weddingId: string): Promise<Wedding | null> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await getWeddingById(weddingId)
      selectedWedding.value = response.wedding
      selectedWeddingAdmins.value = response.admins
      return response.wedding
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load wedding'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Create a new wedding
  const createWedding = async (
    data: CreateWeddingRequest
  ): Promise<{ success: boolean; wedding?: Wedding; error?: string }> => {
    isCreating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const response = await apiCreateWedding(data)
      weddings.value.push(response.wedding)
      actionSuccess.value = `Wedding "${response.wedding.displayName}" created successfully!`
      return { success: true, wedding: response.wedding }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wedding'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isCreating.value = false
    }
  }

  // Update a wedding
  const updateWedding = async (
    weddingId: string,
    data: UpdateWeddingRequest
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const updatedWedding = await updateWeddingById(weddingId, data)
      // Update in list
      const index = weddings.value.findIndex((w) => w.weddingId === weddingId)
      if (index !== -1) {
        weddings.value[index] = updatedWedding
      }
      if (selectedWedding.value?.weddingId === weddingId) {
        selectedWedding.value = updatedWedding
      }
      actionSuccess.value = 'Wedding updated successfully!'
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update wedding'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Archive a wedding
  const archiveWedding = async (
    weddingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      await apiArchiveWedding(weddingId)
      // Update status in list
      const index = weddings.value.findIndex((w) => w.weddingId === weddingId)
      if (index !== -1) {
        weddings.value[index] = { ...weddings.value[index]!, status: 'archived' }
      }
      actionSuccess.value = 'Wedding archived successfully!'
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive wedding'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Add owner to a wedding
  const addOwner = async (
    weddingId: string,
    data: AddWeddingOwnerRequest
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      await apiAddWeddingOwner(weddingId, data)
      actionSuccess.value = `Owner "${data.username}" added successfully!`
      // Refresh the wedding to get updated owner info
      await fetchWedding(weddingId)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add owner'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Update owner details
  const updateOwner = async (
    weddingId: string,
    username: string,
    data: UpdateWeddingOwnerRequest
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      await apiUpdateWeddingOwner(weddingId, username, data)
      actionSuccess.value = `Admin "${username}" updated successfully!`
      // Refresh the wedding to get updated owner info
      await fetchWedding(weddingId)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update admin'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Remove owner from a wedding
  const removeOwner = async (
    weddingId: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      await apiRemoveWeddingOwner(weddingId, username)
      actionSuccess.value = `Owner "${username}" removed successfully!`
      // Refresh the wedding to get updated owner info
      await fetchWedding(weddingId)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove owner'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Reset owner password
  const resetPassword = async (
    weddingId: string,
    username: string
  ): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const response = await apiResetOwnerPassword(weddingId, username)
      actionSuccess.value = `Password reset for "${username}". Temporary password: ${response.temporaryPassword}`
      return { success: true, temporaryPassword: response.temporaryPassword }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Get deletion preview for a wedding
  const getDeletionPreview = async (
    weddingId: string
  ): Promise<{ success: boolean; preview?: DeletionPreview; error?: string }> => {
    isLoadingPreview.value = true
    deletionPreview.value = null
    actionError.value = null

    try {
      const preview = await apiGetDeletionPreview(weddingId)
      deletionPreview.value = preview
      return { success: true, preview }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load deletion preview'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isLoadingPreview.value = false
    }
  }

  // Permanently delete a wedding (hard delete)
  const hardDeleteWedding = async (
    weddingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    isHardDeleting.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      await apiHardDeleteWedding(weddingId)
      // Remove wedding from list
      weddings.value = weddings.value.filter((w) => w.weddingId !== weddingId)
      actionSuccess.value = 'Wedding permanently deleted'
      deletionPreview.value = null
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete wedding'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isHardDeleting.value = false
    }
  }

  // Clear deletion preview
  const clearDeletionPreview = (): void => {
    deletionPreview.value = null
  }

  // Clear messages
  const clearMessages = (): void => {
    actionError.value = null
    actionSuccess.value = null
    loadError.value = null
  }

  // Clear selected wedding
  const clearSelectedWedding = (): void => {
    selectedWedding.value = null
    selectedWeddingAdmins.value = []
  }

  return {
    // State
    weddings,
    selectedWedding,
    selectedWeddingAdmins,
    isLoading,
    isCreating,
    isUpdating,
    isHardDeleting,
    isLoadingPreview,
    deletionPreview,
    loadError,
    actionError,
    actionSuccess,

    // Computed
    activeWeddings,
    archivedWeddings,
    totalWeddings,

    // Actions
    fetchWeddings,
    fetchWedding,
    createWedding,
    updateWedding,
    archiveWedding,
    addOwner,
    updateOwner,
    removeOwner,
    resetPassword,
    getDeletionPreview,
    hardDeleteWedding,
    clearDeletionPreview,
    clearMessages,
    clearSelectedWedding,
  }
}
