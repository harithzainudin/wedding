import { ref } from 'vue'
import type { StaffMember, CreateStaffRequest, UpdateStaffRequest } from '@/types/admin'
import {
  listStaff as apiListStaff,
  createStaff as apiCreateStaff,
  updateStaff as apiUpdateStaff,
  deleteStaff as apiDeleteStaff,
} from '@/services/api'

// Singleton state
const staff = ref<StaffMember[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const loadError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actionSuccess = ref<string | null>(null)

export function useStaff() {
  // Fetch all staff members
  const fetchStaff = async (): Promise<void> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await apiListStaff()
      staff.value = response.staff
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load staff'
    } finally {
      isLoading.value = false
    }
  }

  // Create a new staff member
  const createStaff = async (
    data: CreateStaffRequest
  ): Promise<{ success: boolean; staff?: StaffMember; error?: string }> => {
    isCreating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const response = await apiCreateStaff(data)
      const newStaff: StaffMember = {
        username: response.staff.username,
        email: response.staff.email,
        weddingIds: response.staff.weddingIds,
        createdAt: response.staff.createdAt,
        createdBy: '', // Not returned from API
      }
      staff.value.push(newStaff)
      actionSuccess.value = `Staff member "${response.staff.username}" created successfully!`
      return { success: true, staff: newStaff }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create staff'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isCreating.value = false
    }
  }

  // Update a staff member
  const updateStaff = async (
    username: string,
    data: UpdateStaffRequest
  ): Promise<{ success: boolean; error?: string }> => {
    isUpdating.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const response = await apiUpdateStaff(username, data)
      // Update in local list
      const index = staff.value.findIndex((s) => s.username === username)
      if (index !== -1 && response.updated.email !== undefined) {
        staff.value[index] = {
          ...staff.value[index]!,
          email: response.updated.email ?? undefined,
        }
      }
      actionSuccess.value = `Staff member "${username}" updated successfully!`
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isUpdating.value = false
    }
  }

  // Delete a staff member
  const deleteStaff = async (username: string): Promise<{ success: boolean; error?: string }> => {
    isDeleting.value = true
    actionError.value = null
    actionSuccess.value = null

    try {
      const response = await apiDeleteStaff(username)
      // Remove from local list
      staff.value = staff.value.filter((s) => s.username !== username)
      actionSuccess.value = `Staff member "${username}" deleted. Removed from ${response.removedFromWeddings} wedding(s).`
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete staff'
      actionError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isDeleting.value = false
    }
  }

  // Clear messages
  const clearMessages = (): void => {
    actionError.value = null
    actionSuccess.value = null
    loadError.value = null
  }

  return {
    // State
    staff,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    loadError,
    actionError,
    actionSuccess,

    // Actions
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    clearMessages,
  }
}
