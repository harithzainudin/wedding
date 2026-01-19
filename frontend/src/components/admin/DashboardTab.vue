<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import {
    listRsvpsAdminCached,
    listGalleryImagesAdminCached,
    getMusicAdmin,
    getGiftSettings,
    listGiftsAdmin,
    getQRCodeHubAdmin,
    getScheduleAdmin,
    getContactsAdmin,
  } from '@/services/api'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useWeddingDetails } from '@/composables/useWeddingDetails'
  import { useVenue } from '@/composables/useVenue'
  import { useTheme } from '@/composables/useTheme'
  import { getStoredPrimaryWeddingId, getStoredPrimaryWeddingSlug } from '@/services/tokenManager'
  import { isPlaceholder, isValidCoordinates } from '@/utils/placeholderDetection'
  import { interpolate } from '@/i18n/translations'
  import { DEFAULT_THEME_ID } from '@/constants/themes'
  import type { MusicSettings } from '@/types/music'
  import type { GiftSettings } from '@/types/gift'
  import type { QRCodeHubSettings } from '@/types/qrCodeHub'
  import type { GallerySettings } from '@/types/gallery'
  import type { RsvpSettings } from '@/types/rsvp'
  import type { ScheduleSettings } from '@/types/schedule'
  import type { ContactsSettings } from '@/types/contacts'

  const { adminT } = useAdminLanguage()
  const { weddingDetails, fetchWeddingDetails } = useWeddingDetails()
  const { venue, fetchVenue } = useVenue()
  const { themeSettings, loadTheme } = useTheme()

  // Get the wedding ID and slug for API calls (reactive)
  const weddingId = computed(() => getStoredPrimaryWeddingId())
  const weddingSlug = computed(() => getStoredPrimaryWeddingSlug())

  type TabType =
    | 'dashboard'
    | 'wedding'
    | 'venue'
    | 'schedule'
    | 'gallery'
    | 'music'
    | 'gifts'
    | 'theme'
    | 'contacts'
    | 'rsvps'
    | 'qrcodehub'

  const emit = defineEmits<{
    (e: 'switch-tab', tab: TabType): void
  }>()

  // Stats
  const rsvpStats = ref({
    total: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
  })
  const galleryCount = ref(0)
  const gallerySettings = ref<GallerySettings>({
    maxFileSize: 10 * 1024 * 1024,
    maxImages: 50,
    allowedFormats: [],
    showGallery: true,
  })
  const musicSettings = ref<MusicSettings | null>(null)
  const musicTrackCount = ref(0)
  const giftSettings = ref<GiftSettings | null>(null)
  const giftCount = ref(0)
  const qrHubSettings = ref<QRCodeHubSettings | null>(null)
  const rsvpSettings = ref<RsvpSettings | null>(null)
  // Local refs for schedule and contacts to avoid async composable state issues
  const scheduleSettings = ref<ScheduleSettings | null>(null)
  const scheduleItemCount = ref(0)
  const contactsSettings = ref<ContactsSettings | null>(null)
  const contactsCount = ref(0)
  const isLoading = ref(true)

  const loadStats = async (forceRefresh = false) => {
    isLoading.value = true
    try {
      const id = weddingId.value ?? undefined
      const slug = weddingSlug.value

      // Phase 1: Fetch all critical data in parallel for faster loading
      const [rsvpData, galleryData, scheduleData, contactsData] = await Promise.all([
        listRsvpsAdminCached(id, forceRefresh),
        listGalleryImagesAdminCached(id, forceRefresh),
        getScheduleAdmin(id),
        getContactsAdmin(id),
        // Also fetch setup progress data if slug exists (these don't return values we need)
        ...(slug
          ? [fetchWeddingDetails(slug), fetchVenue(slug), loadTheme(slug, forceRefresh)]
          : []),
      ])

      // Process RSVP data
      rsvpStats.value = rsvpData.summary
      if (rsvpData.settings) {
        rsvpSettings.value = rsvpData.settings
      }

      // Process gallery data
      galleryCount.value = galleryData.images.length
      if (galleryData.settings) {
        gallerySettings.value = galleryData.settings
      }

      // Process schedule data
      scheduleSettings.value = scheduleData.settings ?? null
      scheduleItemCount.value = scheduleData.items?.length ?? 0

      // Process contacts data
      contactsSettings.value = contactsData.settings ?? null
      contactsCount.value = contactsData.contacts?.length ?? 0

      // Phase 2: Fetch non-critical data in parallel (won't block dashboard on failure)
      const nonCriticalResults = await Promise.allSettled([
        getMusicAdmin(id),
        Promise.all([getGiftSettings(id), listGiftsAdmin(id)]),
        getQRCodeHubAdmin(id),
      ])

      // Process music result
      if (nonCriticalResults[0]!.status === 'fulfilled') {
        const musicData = nonCriticalResults[0]!.value
        musicSettings.value = musicData.settings
        musicTrackCount.value = musicData.tracks?.length ?? 0
      }

      // Process gifts result
      if (nonCriticalResults[1]!.status === 'fulfilled') {
        const [giftSettingsData, giftsData] = nonCriticalResults[1]!.value
        giftSettings.value = giftSettingsData
        giftCount.value = giftsData.gifts?.length ?? 0
      }

      // Process QR Hub result
      if (nonCriticalResults[2]!.status === 'fulfilled') {
        qrHubSettings.value = nonCriticalResults[2]!.value
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Setup Progress Items
  interface SetupItem {
    id: string
    label: string
    isComplete: boolean
    statusText: string
    tab: TabType
  }

  // Helper to count enabled QR codes
  const enabledQRCodeCount = computed(() => {
    if (!qrHubSettings.value) return 0
    let count = 0
    if (qrHubSettings.value.website?.enabled) count++
    if (qrHubSettings.value.restuDigital?.enabled) count++
    if (qrHubSettings.value.location?.enabled) count++
    if (qrHubSettings.value.wifi?.enabled) count++
    if (qrHubSettings.value.rsvp?.enabled) count++
    if (qrHubSettings.value.calendar?.enabled) count++
    if (qrHubSettings.value.hashtag?.enabled) count++
    return count
  })

  const setupItems = computed<SetupItem[]>(() => {
    const items: SetupItem[] = []
    const t = adminT.value.dashboard.setupItems

    // Order follows tab navigation: wedding → venue → schedule → gallery → music → gifts → theme → contacts → qrcodehub

    // 1. Wedding Details - comprehensive check for all sections
    // Check couple info (bride/groom fullName and nickname)
    const brideFullNameFilled = !isPlaceholder(weddingDetails.value.couple.bride.fullName)
    const brideNicknameFilled = !isPlaceholder(weddingDetails.value.couple.bride.nickname)
    const groomFullNameFilled = !isPlaceholder(weddingDetails.value.couple.groom.fullName)
    const groomNicknameFilled = !isPlaceholder(weddingDetails.value.couple.groom.nickname)
    const coupleComplete =
      brideFullNameFilled && brideNicknameFilled && groomFullNameFilled && groomNicknameFilled

    // Check parents info (only if visibility is enabled for that parent)
    const parentsVisibility = weddingDetails.value.parentsVisibility
    const brideParentsComplete =
      !parentsVisibility?.showBrideParents ||
      (!isPlaceholder(weddingDetails.value.parents.bride.father) &&
        !isPlaceholder(weddingDetails.value.parents.bride.mother))
    const groomParentsComplete =
      !parentsVisibility?.showGroomParents ||
      (!isPlaceholder(weddingDetails.value.parents.groom.father) &&
        !isPlaceholder(weddingDetails.value.parents.groom.mother))
    const parentsComplete = brideParentsComplete && groomParentsComplete

    // Check dress code (empty is OK, but placeholder is not)
    const dressCodeFilled =
      weddingDetails.value.dressCode === '' || !isPlaceholder(weddingDetails.value.dressCode)

    // Check hashtag (empty is OK, but placeholder is not)
    const hashtagFilled =
      weddingDetails.value.hashtag === '' || !isPlaceholder(weddingDetails.value.hashtag)

    const weddingDetailsComplete =
      coupleComplete && parentsComplete && dressCodeFilled && hashtagFilled

    // Build dynamic status text based on what's incomplete
    let weddingStatusText = t.weddingDetailsComplete
    if (!weddingDetailsComplete) {
      const incomplete: string[] = []
      if (!coupleComplete) incomplete.push(t.weddingDetailsCoupleIncomplete)
      if (!parentsComplete) incomplete.push(t.weddingDetailsParentsIncomplete)
      if (!dressCodeFilled) incomplete.push(t.weddingDetailsDressCodeIncomplete)
      if (!hashtagFilled) incomplete.push(t.weddingDetailsHashtagIncomplete)
      weddingStatusText = incomplete.join(', ')
    }

    items.push({
      id: 'wedding',
      label: t.weddingDetails,
      isComplete: weddingDetailsComplete,
      statusText: weddingStatusText,
      tab: 'wedding',
    })

    // 2. Venue - check venue name, address, and coordinates
    const venueNameFilled = !isPlaceholder(venue.value.venueName)
    const venueAddressFilled = !isPlaceholder(venue.value.address)
    const coordinatesValid = isValidCoordinates(
      venue.value.coordinates?.lat,
      venue.value.coordinates?.lng
    )
    const venueComplete = venueNameFilled && venueAddressFilled && coordinatesValid

    // Build dynamic status text based on what's incomplete
    let venueStatusText = t.venueComplete
    if (!venueComplete) {
      const incomplete: string[] = []
      if (!venueNameFilled) incomplete.push(t.venueNameIncomplete)
      if (!venueAddressFilled) incomplete.push(t.venueAddressIncomplete)
      if (!coordinatesValid) incomplete.push(t.venueLocationIncomplete)
      venueStatusText = incomplete.join(', ')
    }

    items.push({
      id: 'venue',
      label: t.venue,
      isComplete: venueComplete,
      statusText: venueStatusText,
      tab: 'venue',
    })

    // 3. Schedule - check enabled state and item count
    // If disabled: mark as complete with "disabled" message
    // If enabled: check if at least 1 schedule item is added
    const scheduleEnabled = scheduleSettings.value?.showSchedule ?? true
    if (!scheduleEnabled) {
      items.push({
        id: 'schedule',
        label: t.schedule,
        isComplete: true,
        statusText: t.scheduleDisabled,
        tab: 'schedule',
      })
    } else {
      const scheduleComplete = scheduleItemCount.value >= 1
      items.push({
        id: 'schedule',
        label: t.schedule,
        isComplete: scheduleComplete,
        statusText: scheduleComplete
          ? interpolate(t.scheduleComplete, { count: String(scheduleItemCount.value) })
          : t.scheduleIncomplete,
        tab: 'schedule',
      })
    }

    // 4. Gallery - check enabled state and photo count
    // If disabled: mark as complete with "disabled" message
    // If enabled: check if at least 1 photo uploaded
    const galleryEnabled = gallerySettings.value.showGallery
    if (!galleryEnabled) {
      items.push({
        id: 'gallery',
        label: t.gallery,
        isComplete: true,
        statusText: t.galleryDisabled,
        tab: 'gallery',
      })
    } else {
      const galleryComplete = galleryCount.value >= 1
      items.push({
        id: 'gallery',
        label: t.gallery,
        isComplete: galleryComplete,
        statusText: galleryComplete
          ? interpolate(t.galleryComplete, { count: String(galleryCount.value) })
          : t.galleryIncomplete,
        tab: 'gallery',
      })
    }

    // 5. Music - check enabled state and track count
    // If disabled: mark as complete with "disabled" message
    // If enabled: check if at least 1 track uploaded
    const musicEnabled = musicSettings.value?.enabled ?? true
    if (!musicEnabled) {
      items.push({
        id: 'music',
        label: t.music,
        isComplete: true,
        statusText: t.musicDisabled,
        tab: 'music',
      })
    } else {
      const musicComplete = musicTrackCount.value >= 1
      items.push({
        id: 'music',
        label: t.music,
        isComplete: musicComplete,
        statusText: musicComplete
          ? interpolate(t.musicComplete, { count: String(musicTrackCount.value) })
          : t.musicIncomplete,
        tab: 'music',
      })
    }

    // 6. Gifts - check enabled state and gift count
    // If disabled: mark as complete with "disabled" message
    // If enabled: check if at least 1 gift added
    const giftsEnabled = giftSettings.value?.enabled ?? false
    if (!giftsEnabled) {
      items.push({
        id: 'gifts',
        label: t.gifts,
        isComplete: true,
        statusText: t.giftsDisabled,
        tab: 'gifts',
      })
    } else {
      const giftsComplete = giftCount.value >= 1
      items.push({
        id: 'gifts',
        label: t.gifts,
        isComplete: giftsComplete,
        statusText: giftsComplete
          ? interpolate(t.giftsComplete, { count: String(giftCount.value) })
          : t.giftsIncomplete,
        tab: 'gifts',
      })
    }

    // 7. Theme - always complete (default theme is valid), show customization status
    const themeCustomized = themeSettings.value.activeThemeId !== DEFAULT_THEME_ID
    items.push({
      id: 'theme',
      label: t.theme,
      isComplete: true,
      statusText: themeCustomized ? t.themeComplete : t.themeDefault,
      tab: 'theme',
    })

    // 8. Contacts - check enabled state and contact count
    // If disabled: mark as complete with "disabled" message
    // If enabled: check if at least 1 contact is added
    const contactsEnabled = contactsSettings.value?.showContacts ?? true
    if (!contactsEnabled) {
      items.push({
        id: 'contacts',
        label: t.contacts,
        isComplete: true,
        statusText: t.contactsDisabled,
        tab: 'contacts',
      })
    } else {
      const contactsComplete = contactsCount.value >= 1
      items.push({
        id: 'contacts',
        label: t.contacts,
        isComplete: contactsComplete,
        statusText: contactsComplete
          ? interpolate(t.contactsComplete, { count: String(contactsCount.value) })
          : t.contactsIncomplete,
        tab: 'contacts',
      })
    }

    // 9. RSVPs - check enabled state and accepting status
    // If disabled: mark as complete with "disabled" message
    // If closed: show count with "closed" message
    // If accepting: show count
    const rsvpEnabled = rsvpSettings.value?.showRsvp ?? true
    if (!rsvpEnabled) {
      items.push({
        id: 'rsvps',
        label: t.rsvps,
        isComplete: true,
        statusText: t.rsvpsDisabled,
        tab: 'rsvps',
      })
    } else {
      const rsvpCount = rsvpStats.value.total
      const isAccepting = rsvpSettings.value?.acceptingRsvps ?? true
      const rsvpComplete = rsvpCount >= 1 || !isAccepting
      items.push({
        id: 'rsvps',
        label: t.rsvps,
        isComplete: rsvpComplete,
        statusText: isAccepting
          ? rsvpCount >= 1
            ? interpolate(t.rsvpsComplete, { count: String(rsvpCount) })
            : t.rsvpsIncomplete
          : interpolate(t.rsvpsClosed, { count: String(rsvpCount) }),
        tab: 'rsvps',
      })
    }

    // 10. QR Hub - check enabled state and QR type count
    // If disabled: mark as complete with "disabled" message
    // If enabled: check if at least 1 QR type enabled
    const qrHubEnabled = qrHubSettings.value?.hubEnabled ?? true
    if (!qrHubEnabled) {
      items.push({
        id: 'qrHub',
        label: t.qrHub,
        isComplete: true,
        statusText: t.qrHubDisabled,
        tab: 'qrcodehub',
      })
    } else {
      const qrCount = enabledQRCodeCount.value
      const qrComplete = qrCount >= 1
      items.push({
        id: 'qrHub',
        label: t.qrHub,
        isComplete: qrComplete,
        statusText: qrComplete
          ? interpolate(t.qrHubComplete, { count: String(qrCount) })
          : t.qrHubIncomplete,
        tab: 'qrcodehub',
      })
    }

    return items
  })

  const completedCount = computed(() => setupItems.value.filter((item) => item.isComplete).length)
  const totalCount = computed(() => setupItems.value.length)
  const progressPercentage = computed(() =>
    Math.round((completedCount.value / totalCount.value) * 100)
  )
  const isSetupComplete = computed(() => completedCount.value === totalCount.value)

  const quickLinks = computed<{ label: string; tab: TabType; icon: string; description: string }[]>(
    () => [
      {
        label: adminT.value.dashboard.weddingDetails,
        tab: 'wedding',
        icon: 'heart',
        description: adminT.value.dashboard.coupleEventInfo,
      },
      {
        label: adminT.value.nav.venue,
        tab: 'venue',
        icon: 'location',
        description: adminT.value.dashboard.locationSettings,
      },
      {
        label: adminT.value.nav.schedule,
        tab: 'schedule',
        icon: 'calendar',
        description: adminT.value.dashboard.eventTimeline,
      },
      {
        label: adminT.value.nav.gallery,
        tab: 'gallery',
        icon: 'image',
        description: adminT.value.dashboard.managePhotos,
      },
      {
        label: adminT.value.nav.contacts,
        tab: 'contacts',
        icon: 'phone',
        description: adminT.value.dashboard.contactPeople,
      },
      {
        label: adminT.value.nav.rsvps,
        tab: 'rsvps',
        icon: 'users',
        description: adminT.value.dashboard.guestResponses,
      },
    ]
  )

  onMounted(() => {
    // Always force refresh to get latest data when dashboard is mounted
    // This ensures settings changed in other tabs are reflected
    // Note: Wedding switching is handled by AdminView clearing cache and component remounting
    loadStats(true)
  })
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
        {{ adminT.dashboard.title }}
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
        {{ adminT.dashboard.subtitle }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.dashboard.loadingDashboard }}
      </p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.dashboard.totalRsvps }}
          </p>
          <p class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">
            {{ rsvpStats.total }}
          </p>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.dashboard.attending }}
          </p>
          <p class="font-heading text-2xl sm:text-3xl text-green-600 dark:text-green-400">
            {{ rsvpStats.attending }}
          </p>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.dashboard.totalGuests }}
          </p>
          <p class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">
            {{ rsvpStats.totalGuests }}
          </p>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.dashboard.galleryPhotos }}
          </p>
          <p class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">
            {{ galleryCount }}
          </p>
        </div>
      </div>

      <!-- Setup Progress Card -->
      <div class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text">
            {{ adminT.dashboard.setupProgress }}
          </h3>
          <span
            v-if="isSetupComplete"
            class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          >
            {{ adminT.dashboard.setupComplete }}
          </span>
          <span v-else class="text-sm font-medium text-sage-dark dark:text-sage-light">
            {{ progressPercentage }}%
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="h-2 bg-gray-100 dark:bg-dark-bg-elevated rounded-full mb-5 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="isSetupComplete ? 'bg-green-500' : 'bg-sage'"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>

        <!-- Setup Items Checklist -->
        <div class="space-y-3">
          <div
            v-for="item in setupItems"
            :key="item.id"
            class="flex items-center justify-between gap-3 p-3 rounded-lg transition-colors"
            :class="
              item.isComplete
                ? 'bg-green-50 dark:bg-green-900/10'
                : 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
            "
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Status Icon -->
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                :class="
                  item.isComplete
                    ? 'bg-green-500 text-white'
                    : 'bg-amber-200 dark:bg-amber-700 text-amber-700 dark:text-amber-200'
                "
              >
                <svg
                  v-if="item.isComplete"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span v-else class="text-xs font-bold">!</span>
              </div>

              <!-- Label and Status -->
              <div class="min-w-0">
                <p
                  class="font-heading text-sm font-medium truncate"
                  :class="
                    item.isComplete
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-charcoal dark:text-dark-text'
                  "
                >
                  {{ item.label }}
                </p>
                <p
                  class="font-body text-xs truncate"
                  :class="
                    item.isComplete
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-amber-700 dark:text-amber-400'
                  "
                >
                  {{ item.statusText }}
                </p>
              </div>
            </div>

            <!-- Navigate Button (only for incomplete items) -->
            <button
              v-if="!item.isComplete"
              type="button"
              class="flex-shrink-0 p-2 rounded-lg bg-sage/10 hover:bg-sage/20 text-sage transition-colors cursor-pointer"
              :title="`Go to ${item.label}`"
              @click="emit('switch-tab', item.tab)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.dashboard.quickActions }}
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="link in quickLinks"
            :key="link.tab"
            type="button"
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg text-left hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
            @click="emit('switch-tab', link.tab)"
          >
            <div class="flex items-center gap-3">
              <!-- Icons -->
              <div
                class="w-10 h-10 rounded-lg bg-sage/10 dark:bg-sage/20 flex items-center justify-center flex-shrink-0"
              >
                <svg
                  v-if="link.icon === 'heart'"
                  class="w-5 h-5 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <svg
                  v-else-if="link.icon === 'location'"
                  class="w-5 h-5 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <svg
                  v-else-if="link.icon === 'calendar'"
                  class="w-5 h-5 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <svg
                  v-else-if="link.icon === 'image'"
                  class="w-5 h-5 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <svg
                  v-else-if="link.icon === 'phone'"
                  class="w-5 h-5 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <svg
                  v-else-if="link.icon === 'users'"
                  class="w-5 h-5 text-sage"
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
              <div class="min-w-0">
                <p
                  class="font-heading text-sm font-medium text-charcoal dark:text-dark-text truncate"
                >
                  {{ link.label }}
                </p>
                <p
                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary truncate"
                >
                  {{ link.description }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="text-center">
        <button
          type="button"
          class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors cursor-pointer"
          @click="loadStats(true)"
        >
          {{ adminT.dashboard.refreshStats }}
        </button>
      </div>
    </div>
  </div>
</template>
