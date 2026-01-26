import { ref, computed } from 'vue'
import { listRsvps, createRsvp, updateRsvp, deleteRsvp, updateRsvpSettings } from '@/services/api'
import type { RsvpSubmission, AdminRsvpRequest, RsvpSettings, RsvpAnalytics } from '@/types/rsvp'
import { DEFAULT_RSVP_SETTINGS } from '@/types/rsvp'

export interface RsvpSummary {
  total: number
  attending: number
  notAttending: number
  totalGuests: number
}

export function useRsvps() {
  const rsvps = ref<RsvpSubmission[]>([])
  const isLoading = ref(false)
  const loadError = ref('')
  const filter = ref<'all' | 'attending' | 'not_attending'>('all')

  // Multi-tenant context tracking
  const currentWeddingId = ref<string | undefined>(undefined)
  const currentWeddingSlug = ref<string | undefined>(undefined)

  const summary = ref<RsvpSummary>({
    total: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
  })

  // RSVP settings
  const rsvpSettings = ref<RsvpSettings>(DEFAULT_RSVP_SETTINGS)

  // RSVP analytics (only available for admin requests)
  const analytics = ref<RsvpAnalytics | undefined>(undefined)

  // CRUD operation states
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const operationError = ref('')

  const filteredRsvps = computed(() => {
    if (filter.value === 'all') return rsvps.value
    if (filter.value === 'attending') return rsvps.value.filter((r) => r.isAttending)
    return rsvps.value.filter((r) => !r.isAttending)
  })

  const fetchRsvps = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    // Update current wedding context if provided
    if (weddingId !== undefined) {
      currentWeddingId.value = weddingId
    }

    try {
      const data = await listRsvps(undefined, weddingId ?? currentWeddingId.value)
      rsvps.value = data.rsvps
      summary.value = data.summary
      if (data.settings) {
        rsvpSettings.value = data.settings
      }
      if (data.analytics) {
        analytics.value = data.analytics
      }
    } catch {
      loadError.value = 'Failed to load RSVPs. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  const createRsvpEntry = async (data: AdminRsvpRequest, weddingId?: string): Promise<boolean> => {
    isCreating.value = true
    operationError.value = ''

    const effectiveWeddingId = weddingId ?? currentWeddingId.value

    try {
      await createRsvp(data, effectiveWeddingId)
      await fetchRsvps(effectiveWeddingId)
      return true
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : 'Failed to create guest'
      return false
    } finally {
      isCreating.value = false
    }
  }

  const updateRsvpEntry = async (
    id: string,
    data: AdminRsvpRequest,
    weddingId?: string
  ): Promise<boolean> => {
    isUpdating.value = true
    operationError.value = ''

    const effectiveWeddingId = weddingId ?? currentWeddingId.value

    try {
      await updateRsvp(id, data, effectiveWeddingId)
      await fetchRsvps(effectiveWeddingId)
      return true
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : 'Failed to update guest'
      return false
    } finally {
      isUpdating.value = false
    }
  }

  const deleteRsvpEntry = async (id: string, weddingId?: string): Promise<boolean> => {
    isDeleting.value = true
    operationError.value = ''

    const effectiveWeddingId = weddingId ?? currentWeddingId.value

    try {
      await deleteRsvp(id, effectiveWeddingId)
      await fetchRsvps(effectiveWeddingId)
      return true
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : 'Failed to delete guest'
      return false
    } finally {
      isDeleting.value = false
    }
  }

  const clearOperationError = (): void => {
    operationError.value = ''
  }

  const setWeddingContext = (weddingId?: string, weddingSlug?: string): void => {
    currentWeddingId.value = weddingId
    currentWeddingSlug.value = weddingSlug
  }

  const setFilter = (newFilter: 'all' | 'attending' | 'not_attending'): void => {
    filter.value = newFilter
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const exportToCsv = (): void => {
    const headers = [
      'Title',
      'Full Name',
      'Phone',
      'Attending',
      'Guests',
      'Guest Type',
      'Message',
      'Submitted At',
    ]
    const rows = rsvps.value.map((r) => [
      r.title,
      r.fullName,
      r.phoneNumber,
      r.isAttending ? 'Yes' : 'No',
      r.numberOfGuests.toString(),
      r.guestType ?? '',
      `"${r.message.replace(/"/g, '""')}"`,
      r.submittedAt,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rsvp-list-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const clearRsvps = (): void => {
    rsvps.value = []
  }

  // Update RSVP settings
  const updateSettings = async (
    settings: Partial<RsvpSettings>,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const effectiveWeddingId = weddingId ?? currentWeddingId.value

    try {
      const response = await updateRsvpSettings(settings, effectiveWeddingId)
      rsvpSettings.value = response.settings
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update RSVP settings'
      return { success: false, error: errorMessage }
    }
  }

  return {
    rsvps,
    isLoading,
    loadError,
    filter,
    summary,
    filteredRsvps,
    fetchRsvps,
    setFilter,
    formatDate,
    exportToCsv,
    clearRsvps,
    // Multi-tenant context
    currentWeddingId,
    currentWeddingSlug,
    setWeddingContext,
    // CRUD operations
    isCreating,
    isUpdating,
    isDeleting,
    operationError,
    createRsvpEntry,
    updateRsvpEntry,
    deleteRsvpEntry,
    clearOperationError,
    // Settings
    rsvpSettings,
    updateSettings,
    // Analytics
    analytics,
  }
}
