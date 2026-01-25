import { ref } from 'vue'
import type {
  ContactsData,
  ContactPerson,
  ContactsUpdateRequest,
  ContactsSettings,
} from '@/types/contacts'
import { DEFAULT_CONTACTS_SETTINGS } from '@/types/contacts'
import {
  getContacts,
  getContactsAdmin,
  updateContacts as apiUpdateContacts,
  updateContactsSettings as apiUpdateContactsSettings,
} from '@/services/api'
import { clearCache, CACHE_KEYS } from '@/utils/apiCache'

// Default contacts data (matches backend defaults)
// Empty array to show empty state - admins should add their own contacts
const DEFAULT_CONTACTS: ContactsData = {
  contacts: [],
  settings: DEFAULT_CONTACTS_SETTINGS,
}

// Singleton state
const contacts = ref<ContactsData>(DEFAULT_CONTACTS)
const isLoading = ref(false)
const loadError = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

// Multi-tenant tracking
const currentWeddingSlug = ref<string | undefined>(undefined)
const currentWeddingId = ref<string | undefined>(undefined)

export function useContacts() {
  // Fetch contacts from API (public endpoint - uses weddingSlug)
  const fetchContacts = async (weddingSlug?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''
    currentWeddingSlug.value = weddingSlug

    try {
      const data = await getContacts(weddingSlug)
      contacts.value = data
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load contacts'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch contacts from admin API (authenticated - uses weddingId)
  const fetchContactsAdmin = async (weddingId?: string): Promise<void> => {
    isLoading.value = true
    loadError.value = ''
    currentWeddingId.value = weddingId

    try {
      const data = await getContactsAdmin(weddingId)
      contacts.value = data
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load contacts'
    } finally {
      isLoading.value = false
    }
  }

  // Update contacts
  const updateContacts = async (
    contactsList: ContactPerson[],
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = false
    currentWeddingId.value = weddingId

    try {
      const requestData: ContactsUpdateRequest = { contacts: contactsList }
      const responseData = await apiUpdateContacts(requestData, weddingId)
      contacts.value = responseData
      saveSuccess.value = true
      // Clear success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contacts'
      saveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  // Update contacts settings (reserved for future use)
  const updateContactsSettings = async (
    settings: Partial<ContactsSettings>,
    weddingId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    saveError.value = ''

    try {
      const response = await apiUpdateContactsSettings(settings, weddingId)
      // Update local state with new settings
      contacts.value = {
        ...contacts.value,
        settings: response.settings,
      }
      // Clear cache to ensure fresh data on next fetch
      clearCache(CACHE_KEYS.CONTACTS)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings'
      saveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isSaving.value = false
    }
  }

  // Generate unique ID for new items
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  // Reset to defaults (for form reset)
  const resetToDefaults = (): void => {
    contacts.value = {
      ...DEFAULT_CONTACTS,
      contacts: [...DEFAULT_CONTACTS.contacts],
    }
  }

  return {
    contacts,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    currentWeddingSlug,
    currentWeddingId,
    fetchContacts,
    fetchContactsAdmin,
    updateContacts,
    updateContactsSettings,
    generateId,
    resetToDefaults,
  }
}
