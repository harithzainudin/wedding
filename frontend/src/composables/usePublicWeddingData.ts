import { ref } from 'vue'
import {
  getWeddingDetailsCached,
  getScheduleCached,
  getContactsCached,
  getRsvpSettings,
} from '@/services/api'
import { weddingConfig } from '@/config/wedding'
import type {
  WeddingDetailsData,
  EventDisplayFormat,
  DisplayNameOrder,
  BismillahCalligraphySettings,
  ParentsVisibilitySettings,
} from '@/types/weddingDetails'
import {
  DEFAULT_DISPLAY_FORMAT,
  DEFAULT_BISMILLAH_SETTINGS,
  DEFAULT_PARENTS_VISIBILITY,
} from '@/types/weddingDetails'
import type { ScheduleData, ScheduleItem } from '@/types/schedule'
import type { ContactsData, ContactPerson } from '@/types/contacts'
import type { RsvpSettingsResponse } from '@/types/rsvp'

// Error types for wedding status
export type WeddingErrorType = 'archived' | 'draft' | 'not_found' | 'error' | null

// Singleton state for public wedding data
const weddingDetails = ref<WeddingDetailsData | null>(null)
const scheduleData = ref<ScheduleData | null>(null)
const contactsData = ref<ContactsData | null>(null)
const rsvpSettingsData = ref<RsvpSettingsResponse | null>(null)
const isLoading = ref(false)
const hasLoaded = ref(false)
const currentWeddingSlug = ref<string | null>(null)

// Error state for wedding availability
const weddingError = ref<WeddingErrorType>(null)
const weddingErrorMessage = ref<string | null>(null)

// Individual loading states for better UX
const isLoadingWeddingDetails = ref(false)
const isLoadingSchedule = ref(false)
const isLoadingContacts = ref(false)
const isLoadingRsvpSettings = ref(false)

// Convert API schedule to config format for backward compatibility
interface LegacyScheduleItem {
  time: string
  title: string
  titleMalay: string
}

// Helper to detect error type from API error
function detectErrorType(error: unknown): { type: WeddingErrorType; message: string } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Debug: log the actual error message to help identify issues
    console.debug('[WeddingError] Detecting error type from message:', error.message)

    // Check for draft wedding (403 Forbidden with "not yet published")
    // Check draft BEFORE archived to ensure correct priority
    if (message.includes('not yet published') || message.includes('not published')) {
      return { type: 'draft', message: error.message }
    }

    // Check for archived wedding (410 Gone)
    if (
      message.includes('no longer available') ||
      message.includes('has been archived') ||
      message.includes('410')
    ) {
      return { type: 'archived', message: error.message }
    }

    // Check for inactive wedding
    if (message.includes('currently unavailable')) {
      return { type: 'draft', message: error.message } // Treat inactive as draft for UX
    }

    // Check for not found (404)
    if (message.includes('not found') || message.includes('404')) {
      return { type: 'not_found', message: error.message }
    }
  }
  return { type: 'error', message: 'An unexpected error occurred' }
}

export function usePublicWeddingData() {
  // Fetch all public data from APIs (uses caching to prevent duplicate calls)
  // forceRefresh: true will bypass all caches and fetch fresh data
  const fetchPublicData = async (weddingSlug: string, forceRefresh = false): Promise<void> => {
    // Reload if wedding changed, not loaded yet, or force refresh requested
    if (!forceRefresh && hasLoaded.value && currentWeddingSlug.value === weddingSlug) return

    // Reset state when force refreshing or loading new wedding
    if (forceRefresh) {
      hasLoaded.value = false
      weddingDetails.value = null
      scheduleData.value = null
      contactsData.value = null
      rsvpSettingsData.value = null
    }

    currentWeddingSlug.value = weddingSlug
    isLoading.value = true
    isLoadingWeddingDetails.value = true
    isLoadingSchedule.value = true
    isLoadingContacts.value = true
    isLoadingRsvpSettings.value = true
    // Reset error state
    weddingError.value = null
    weddingErrorMessage.value = null

    try {
      // Fetch all data in parallel using cached API functions
      // Cache deduplicates simultaneous requests automatically
      let criticalError: { type: WeddingErrorType; message: string } | null = null

      const weddingPromise = getWeddingDetailsCached(weddingSlug, forceRefresh)
        .then((data) => {
          weddingDetails.value = data
        })
        .catch((err) => {
          console.error('Failed to fetch wedding details:', err)
          // Wedding details is the critical endpoint - if it fails with a status error,
          // we should show the error page
          const detected = detectErrorType(err)
          if (detected.type !== 'error') {
            criticalError = detected
          }
        })
        .finally(() => {
          isLoadingWeddingDetails.value = false
        })

      const schedulePromise = getScheduleCached(weddingSlug, forceRefresh)
        .then((data) => {
          scheduleData.value = data
        })
        .catch((err) => {
          console.error('Failed to fetch schedule:', err)
          // Also check schedule for status errors
          if (!criticalError) {
            const detected = detectErrorType(err)
            if (detected.type !== 'error') {
              criticalError = detected
            }
          }
        })
        .finally(() => {
          isLoadingSchedule.value = false
        })

      const contactsPromise = getContactsCached(weddingSlug, forceRefresh)
        .then((data) => {
          contactsData.value = data
        })
        .catch((err) => {
          console.error('Failed to fetch contacts:', err)
        })
        .finally(() => {
          isLoadingContacts.value = false
        })

      const rsvpSettingsPromise = getRsvpSettings(weddingSlug)
        .then((data) => {
          rsvpSettingsData.value = data
        })
        .catch((err) => {
          console.error('Failed to fetch RSVP settings:', err)
        })
        .finally(() => {
          isLoadingRsvpSettings.value = false
        })

      // Wait for all to complete
      await Promise.all([weddingPromise, schedulePromise, contactsPromise, rsvpSettingsPromise])

      // Set error state if we detected a critical error
      if (criticalError !== null) {
        const error = criticalError as { type: WeddingErrorType; message: string }
        weddingError.value = error.type
        weddingErrorMessage.value = error.message
      }
    } catch (error) {
      console.error('Failed to fetch public data:', error)
      const detected = detectErrorType(error)
      weddingError.value = detected.type
      weddingErrorMessage.value = detected.message
    } finally {
      isLoading.value = false
      hasLoaded.value = true
    }
  }

  // Clear error state
  const clearError = () => {
    weddingError.value = null
    weddingErrorMessage.value = null
  }

  // Computed getters with fallback to config

  // Couple info with fallback
  const getCoupleNames = () => {
    if (weddingDetails.value) {
      return {
        bride: {
          fullName: weddingDetails.value.couple.bride.fullName,
          nickname: weddingDetails.value.couple.bride.nickname,
        },
        groom: {
          fullName: weddingDetails.value.couple.groom.fullName,
          nickname: weddingDetails.value.couple.groom.nickname,
        },
      }
    }
    return weddingConfig.couple
  }

  // Parents info with fallback
  const getParents = () => {
    if (weddingDetails.value) {
      return weddingDetails.value.parents
    }
    return weddingConfig.parents
  }

  // Event date with fallback
  const getEventDate = (): Date => {
    if (weddingDetails.value?.eventDate) {
      return new Date(weddingDetails.value.eventDate)
    }
    return weddingConfig.event.date
  }

  // Event end time with fallback
  const getEventEndTime = (): Date | null => {
    if (weddingDetails.value?.eventEndTime) {
      return new Date(weddingDetails.value.eventEndTime)
    }
    if (weddingConfig.event.endDate) {
      return weddingConfig.event.endDate
    }
    return null
  }

  // Event display format with fallback
  const getEventDisplayFormat = (): EventDisplayFormat => {
    if (weddingDetails.value?.eventDisplayFormat) {
      return weddingDetails.value.eventDisplayFormat
    }
    if (weddingConfig.event.displayFormat) {
      return weddingConfig.event.displayFormat
    }
    return DEFAULT_DISPLAY_FORMAT
  }

  // Display name order with fallback (defaults to bride_first - traditional)
  const getDisplayNameOrder = (): DisplayNameOrder => {
    if (weddingDetails.value?.displayNameOrder) {
      return weddingDetails.value.displayNameOrder
    }
    return 'bride_first'
  }

  // Dress code with fallback
  const getDressCode = (): string => {
    if (weddingDetails.value?.dressCode) {
      return weddingDetails.value.dressCode
    }
    return weddingConfig.dressCode
  }

  // Hashtag with fallback
  const getHashtag = (): string => {
    if (weddingDetails.value?.hashtag) {
      return weddingDetails.value.hashtag
    }
    return weddingConfig.hashtag
  }

  // Visibility settings for dress code and hashtag (default to true)
  const getShowDressCode = (): boolean => {
    return weddingDetails.value?.showDressCode ?? true
  }

  const getShowHashtag = (): boolean => {
    return weddingDetails.value?.showHashtag ?? true
  }

  // QR Code URL - auto-generated from current domain and wedding slug
  const getQrCodeUrl = (): string => {
    const baseUrl = window.location.origin
    const basePath = import.meta.env.BASE_URL || '/wedding'
    const slug = currentWeddingSlug.value

    if (slug) {
      return `${baseUrl}${basePath}${slug}`
    }
    // Fallback to just the base wedding path
    return `${baseUrl}${basePath}`
  }

  // Schedule with fallback - converts to legacy format for backward compatibility
  const getSchedule = (): LegacyScheduleItem[] => {
    if (scheduleData.value?.items && scheduleData.value.items.length > 0) {
      return scheduleData.value.items.map((item: ScheduleItem) => ({
        time: item.time,
        title: item.title.en,
        titleMalay: item.title.ms,
      }))
    }
    return weddingConfig.event.schedule
  }

  // Schedule with multilingual support
  const getScheduleMultilingual = (): ScheduleItem[] => {
    if (scheduleData.value?.items && scheduleData.value.items.length > 0) {
      return scheduleData.value.items
    }
    // Convert legacy config to multilingual format
    return weddingConfig.event.schedule.map((item, index) => ({
      id: String(index + 1),
      time: item.time,
      title: {
        ms: item.titleMalay,
        en: item.title,
        zh: item.title, // Fallback to English
        ta: item.title, // Fallback to English
      },
      order: index,
    }))
  }

  // Contacts with fallback
  const getContactsList = (): Array<{
    name: string
    role: string
    phone: string
  }> => {
    if (contactsData.value?.contacts && contactsData.value.contacts.length > 0) {
      return contactsData.value.contacts.map((contact: ContactPerson) => ({
        name: contact.name,
        role: contact.role.ms, // Default to Malay for backward compatibility
        phone: contact.phoneNumber,
      }))
    }
    return weddingConfig.contacts
  }

  // Contacts with multilingual support
  const getContactsMultilingual = (): ContactPerson[] => {
    if (contactsData.value?.contacts && contactsData.value.contacts.length > 0) {
      return contactsData.value.contacts
    }
    // Convert legacy config to multilingual format
    return weddingConfig.contacts.map((contact, index) => ({
      id: String(index + 1),
      name: contact.name,
      role: {
        ms: contact.role,
        en: contact.role, // Fallback
        zh: contact.role, // Fallback
        ta: contact.role, // Fallback
      },
      phoneNumber: contact.phone,
      order: index,
    }))
  }

  // Bismillah calligraphy settings with fallback
  const getBismillahSettings = (): BismillahCalligraphySettings => {
    if (weddingDetails.value?.bismillahCalligraphy) {
      return weddingDetails.value.bismillahCalligraphy
    }
    return DEFAULT_BISMILLAH_SETTINGS
  }

  // Parents visibility settings with fallback (defaults to showing both)
  const getParentsVisibility = (): ParentsVisibilitySettings => {
    if (weddingDetails.value?.parentsVisibility) {
      return weddingDetails.value.parentsVisibility
    }
    return DEFAULT_PARENTS_VISIBILITY
  }

  // RSVP settings - whether to show RSVP section and if accepting
  const showRsvpSection = (): boolean => {
    // Default to true if settings not loaded yet
    if (!rsvpSettingsData.value) return true
    return rsvpSettingsData.value.settings.showRsvp
  }

  const isAcceptingRsvps = (): boolean => {
    // Default to true if settings not loaded yet
    if (!rsvpSettingsData.value) return true
    return rsvpSettingsData.value.isAcceptingRsvps
  }

  const getRsvpDeadline = (): string | undefined => {
    return rsvpSettingsData.value?.settings.rsvpDeadline
  }

  return {
    isLoading,
    hasLoaded,
    isLoadingWeddingDetails,
    isLoadingSchedule,
    isLoadingContacts,
    isLoadingRsvpSettings,
    weddingDetails,
    scheduleData,
    contactsData,
    rsvpSettingsData,
    currentWeddingSlug,
    // Error states
    weddingError,
    weddingErrorMessage,
    // Actions
    fetchPublicData,
    clearError,
    // Getters
    getCoupleNames,
    getParents,
    getEventDate,
    getEventEndTime,
    getEventDisplayFormat,
    getDisplayNameOrder,
    getDressCode,
    getHashtag,
    getShowDressCode,
    getShowHashtag,
    getQrCodeUrl,
    getSchedule,
    getScheduleMultilingual,
    getContactsList,
    getContactsMultilingual,
    getBismillahSettings,
    getParentsVisibility,
    // RSVP settings
    showRsvpSection,
    isAcceptingRsvps,
    getRsvpDeadline,
  }
}
