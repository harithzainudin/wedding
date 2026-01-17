<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useWeddingDetails } from '@/composables/useWeddingDetails'
  import type {
    EventDisplayFormat,
    EventDisplayPreset,
    DisplayNameOrder,
    BismillahCalligraphySettings,
    ParentsVisibilitySettings,
  } from '@/types/weddingDetails'
  import {
    DEFAULT_DISPLAY_FORMAT,
    DEFAULT_BISMILLAH_SETTINGS,
    DEFAULT_PARENTS_VISIBILITY,
  } from '@/types/weddingDetails'
  import BismillahCalligraphySelector from '@/components/admin/BismillahCalligraphySelector.vue'

  // Tooltip content for name order setting
  const nameOrderTooltip = `Malay Wedding Custom

Traditionally, the name order reflects which family hosts the main reception first:

• Bride First: When the main reception (bersanding) is held at the bride's family home first. This is the traditional arrangement.

• Groom First: When the groom's family hosts the reception first, or for the bertandang ceremony at the groom's home.

Choose based on your wedding ceremony arrangement.`

  const {
    weddingDetails,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchWeddingDetails,
    updateWeddingDetails,
  } = useWeddingDetails()

  // Preset options for dropdown
  const presetOptions: { value: EventDisplayPreset; label: string }[] = [
    { value: 'date_time_range', label: 'Date + Time Range' },
    { value: 'date_start_only', label: 'Date + Start Time Only' },
    { value: 'date_only', label: 'Date Only' },
    { value: 'full_details', label: 'Full Details (Separate Lines)' },
    { value: 'custom', label: 'Custom' },
  ]

  // Toggle for custom options
  const showCustomOptions = ref(false)

  // Section visibility toggles (all expanded by default)
  const expandedSections = ref({
    couple: true,
    nameOrder: false,
    calligraphy: false,
    parents: false,
    event: true,
    displayFormat: false,
    website: false,
  })

  const toggleSection = (section: keyof typeof expandedSections.value) => {
    expandedSections.value[section] = !expandedSections.value[section]
  }

  // Local form state
  const formData = ref({
    couple: {
      bride: { fullName: '', nickname: '' },
      groom: { fullName: '', nickname: '' },
    },
    parents: {
      bride: { father: '', mother: '' },
      groom: { father: '', mother: '' },
    },
    parentsVisibility: {
      ...DEFAULT_PARENTS_VISIBILITY,
    } as ParentsVisibilitySettings,
    eventDate: '',
    eventEndTime: '',
    eventDisplayFormat: { ...DEFAULT_DISPLAY_FORMAT } as EventDisplayFormat,
    displayNameOrder: 'bride_first' as DisplayNameOrder,
    bismillahCalligraphy: {
      ...DEFAULT_BISMILLAH_SETTINGS,
    } as BismillahCalligraphySettings,
    dressCode: '',
    hashtag: '',
    qrCodeUrl: '',
  })

  // Track if form has unsaved changes
  const hasChanges = computed(() => {
    return (
      JSON.stringify(formData.value) !==
      JSON.stringify({
        couple: weddingDetails.value.couple,
        parents: weddingDetails.value.parents,
        parentsVisibility: weddingDetails.value.parentsVisibility ?? DEFAULT_PARENTS_VISIBILITY,
        eventDate: weddingDetails.value.eventDate,
        eventEndTime: weddingDetails.value.eventEndTime ?? '',
        eventDisplayFormat: weddingDetails.value.eventDisplayFormat ?? DEFAULT_DISPLAY_FORMAT,
        displayNameOrder: weddingDetails.value.displayNameOrder ?? 'bride_first',
        bismillahCalligraphy:
          weddingDetails.value.bismillahCalligraphy ?? DEFAULT_BISMILLAH_SETTINGS,
        dressCode: weddingDetails.value.dressCode,
        hashtag: weddingDetails.value.hashtag,
        qrCodeUrl: weddingDetails.value.qrCodeUrl,
      })
    )
  })

  // Sync form data when wedding details are loaded
  const syncFormData = () => {
    formData.value = {
      couple: {
        bride: { ...weddingDetails.value.couple.bride },
        groom: { ...weddingDetails.value.couple.groom },
      },
      parents: {
        bride: { ...weddingDetails.value.parents.bride },
        groom: { ...weddingDetails.value.parents.groom },
      },
      parentsVisibility: weddingDetails.value.parentsVisibility
        ? { ...weddingDetails.value.parentsVisibility }
        : { ...DEFAULT_PARENTS_VISIBILITY },
      eventDate: weddingDetails.value.eventDate,
      eventEndTime: weddingDetails.value.eventEndTime ?? '',
      eventDisplayFormat: weddingDetails.value.eventDisplayFormat
        ? {
            ...weddingDetails.value.eventDisplayFormat,
            customOptions: {
              ...weddingDetails.value.eventDisplayFormat.customOptions,
            },
          }
        : {
            ...DEFAULT_DISPLAY_FORMAT,
            customOptions: { ...DEFAULT_DISPLAY_FORMAT.customOptions },
          },
      displayNameOrder: weddingDetails.value.displayNameOrder ?? 'bride_first',
      bismillahCalligraphy: weddingDetails.value.bismillahCalligraphy
        ? { ...weddingDetails.value.bismillahCalligraphy }
        : { ...DEFAULT_BISMILLAH_SETTINGS },
      dressCode: weddingDetails.value.dressCode,
      hashtag: weddingDetails.value.hashtag,
      qrCodeUrl: weddingDetails.value.qrCodeUrl,
    }
    // Set custom options toggle based on preset
    showCustomOptions.value = formData.value.eventDisplayFormat.preset === 'custom'
  }

  // Format datetime for input - handles timezone correctly
  const formattedEventDate = computed({
    get: () => {
      if (!formData.value.eventDate) return ''
      const date = new Date(formData.value.eventDate)
      // Format as local datetime for the input (YYYY-MM-DDTHH:MM)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    },
    set: (value: string) => {
      if (value) {
        // Parse the local datetime and store with timezone offset
        const date = new Date(value)
        const tzOffset = -date.getTimezoneOffset()
        const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
        const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')
        const tzSign = tzOffset >= 0 ? '+' : '-'

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        formData.value.eventDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMinutes}`
      }
    },
  })

  // Format end time for input - handles timezone correctly
  const formattedEventEndTime = computed({
    get: () => {
      if (!formData.value.eventEndTime) return ''
      const date = new Date(formData.value.eventEndTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    },
    set: (value: string) => {
      if (value) {
        const date = new Date(value)
        const tzOffset = -date.getTimezoneOffset()
        const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
        const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0')
        const tzSign = tzOffset >= 0 ? '+' : '-'

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        formData.value.eventEndTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMinutes}`
      } else {
        formData.value.eventEndTime = ''
      }
    },
  })

  // Custom format parser - converts format strings like "DD/MM/YYYY" to formatted date
  function formatDateWithPattern(date: Date, pattern: string): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ] as const
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ] as const

    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const dayOfWeek = date.getDay()
    const hours24 = date.getHours()
    const hours12 = hours24 % 12 || 12
    const minutes = date.getMinutes()
    const ampm = hours24 >= 12 ? 'PM' : 'AM'

    const monthName = monthNames[month] ?? 'Unknown'
    const dayName = dayNames[dayOfWeek] ?? 'Unknown'

    return pattern
      .replace(/YYYY/g, String(year))
      .replace(/YY/g, String(year).slice(-2))
      .replace(/MMMM/g, monthName)
      .replace(/MMM/g, monthName.slice(0, 3))
      .replace(/MM/g, String(month + 1).padStart(2, '0'))
      .replace(/M(?!a)/g, String(month + 1))
      .replace(/dddd/g, dayName)
      .replace(/ddd/g, dayName.slice(0, 3))
      .replace(/DD/g, String(day).padStart(2, '0'))
      .replace(/D(?!e)/g, String(day))
      .replace(/HH/g, String(hours24).padStart(2, '0'))
      .replace(/H(?!o)/g, String(hours24))
      .replace(/hh/g, String(hours12).padStart(2, '0'))
      .replace(/h(?!o)/g, String(hours12))
      .replace(/mm/g, String(minutes).padStart(2, '0'))
      .replace(/m(?!b)/g, String(minutes))
      .replace(/A/g, ampm)
      .replace(/a/g, ampm.toLowerCase())
  }

  // Preview computed properties
  const previewDate = computed(() => {
    if (!formData.value.eventDate) return 'No date set'
    const date = new Date(formData.value.eventDate)
    const format = formData.value.eventDisplayFormat
    const options =
      format.preset === 'custom' ? format.customOptions : getOptionsForPreset(format.preset)

    if (!options.showDate) return ''

    // Use custom format if provided
    if (format.preset === 'custom' && options.customDateFormat) {
      return formatDateWithPattern(date, options.customDateFormat)
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    if (options.showDayOfWeek) {
      dateOptions.weekday = 'long'
    }
    return date.toLocaleDateString('en-MY', dateOptions)
  })

  const previewTime = computed(() => {
    if (!formData.value.eventDate) return ''
    const format = formData.value.eventDisplayFormat
    const options =
      format.preset === 'custom' ? format.customOptions : getOptionsForPreset(format.preset)

    if (!options.showStartTime && !options.showEndTime) return ''

    const startDate = new Date(formData.value.eventDate)

    // Use custom time format if provided
    if (format.preset === 'custom' && options.customTimeFormat) {
      const startTimeStr = formatDateWithPattern(startDate, options.customTimeFormat)

      if (options.showEndTime && formData.value.eventEndTime) {
        const endDate = new Date(formData.value.eventEndTime)
        const endTimeStr = formatDateWithPattern(endDate, options.customTimeFormat)
        return `${startTimeStr} - ${endTimeStr}`
      }

      return options.showStartTime ? startTimeStr : ''
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: options.timeFormat === '12h',
    }

    const startTimeStr = startDate.toLocaleTimeString('en-MY', timeOptions)

    if (options.showEndTime && formData.value.eventEndTime) {
      const endDate = new Date(formData.value.eventEndTime)
      const endTimeStr = endDate.toLocaleTimeString('en-MY', timeOptions)

      if (format.preset === 'full_details') {
        return `Starts: ${startTimeStr}\nEnds: ${endTimeStr}`
      }
      return `${startTimeStr} - ${endTimeStr}`
    }

    if (format.preset === 'full_details' && options.showStartTime) {
      return `Starts: ${startTimeStr}`
    }

    return options.showStartTime ? startTimeStr : ''
  })

  // Get display options for a preset
  function getOptionsForPreset(preset: EventDisplayPreset) {
    switch (preset) {
      case 'date_time_range':
        return {
          showDate: true,
          showStartTime: true,
          showEndTime: true,
          showDayOfWeek: true,
          timeFormat: '12h' as const,
        }
      case 'date_start_only':
        return {
          showDate: true,
          showStartTime: true,
          showEndTime: false,
          showDayOfWeek: true,
          timeFormat: '12h' as const,
        }
      case 'date_only':
        return {
          showDate: true,
          showStartTime: false,
          showEndTime: false,
          showDayOfWeek: true,
          timeFormat: '12h' as const,
        }
      case 'full_details':
        return {
          showDate: true,
          showStartTime: true,
          showEndTime: true,
          showDayOfWeek: true,
          timeFormat: '12h' as const,
        }
      case 'custom':
      default:
        return formData.value.eventDisplayFormat.customOptions
    }
  }

  // Handle preset change
  const handlePresetChange = (preset: EventDisplayPreset) => {
    formData.value.eventDisplayFormat.preset = preset
    if (preset === 'custom') {
      showCustomOptions.value = true
    } else {
      showCustomOptions.value = false
      // Update custom options to match preset for consistency
      formData.value.eventDisplayFormat.customOptions = {
        ...getOptionsForPreset(preset),
      }
    }
  }

  // Save changes
  const handleSave = async () => {
    const result = await updateWeddingDetails(formData.value)
    // Sync form data after successful save to ensure hasChanges is false
    if (result.success) {
      syncFormData()
    }
  }

  // Discard changes
  const discardChanges = () => {
    syncFormData()
  }

  // Watch for wedding details changes and sync form
  watch(
    () => weddingDetails.value,
    () => {
      if (!hasChanges.value) {
        syncFormData()
      }
    },
    { deep: true }
  )

  onMounted(async () => {
    await fetchWeddingDetails()
    syncFormData()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
        Wedding Details
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
        Manage couple information, parents, and event details
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading wedding details...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-3"
      >
        <svg
          class="w-6 h-6 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="fetchWeddingDetails"
      >
        Try Again
      </button>
    </div>

    <!-- Form Content -->
    <div v-else class="space-y-6">
      <!-- Couple Information -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden transition-all"
        :class="
          expandedSections.couple ? 'ring-2 ring-sage/30 border-sage/50' : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer"
          :class="
            expandedSections.couple
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('couple')"
        >
          <h3
            class="font-heading text-base font-medium transition-colors"
            :class="
              expandedSections.couple
                ? 'text-sage-dark dark:text-sage-light'
                : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
            "
          >
            Couple Information
          </h3>
          <svg
            class="w-5 h-5 transition-all"
            :class="[
              expandedSections.couple
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.couple ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <!-- Bride -->
                <div class="space-y-3">
                  <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">
                    Bride
                  </h4>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      v-model="formData.couple.bride.fullName"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                      placeholder="Full name"
                      :disabled="isSaving"
                    />
                  </div>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Nickname
                    </label>
                    <input
                      v-model="formData.couple.bride.nickname"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                      placeholder="Nickname"
                      :disabled="isSaving"
                    />
                  </div>
                </div>

                <!-- Groom -->
                <div class="space-y-3">
                  <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">
                    Groom
                  </h4>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      v-model="formData.couple.groom.fullName"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                      placeholder="Full name"
                      :disabled="isSaving"
                    />
                  </div>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Nickname
                    </label>
                    <input
                      v-model="formData.couple.groom.nickname"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                      placeholder="Nickname"
                      :disabled="isSaving"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Name Display Order Setting -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border transition-all"
        :class="
          expandedSections.nameOrder ? 'ring-2 ring-sage/30 border-sage/50' : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer rounded-t-lg"
          :class="
            expandedSections.nameOrder
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('nameOrder')"
        >
          <div class="flex items-center gap-2">
            <h3
              class="font-heading text-base font-medium transition-colors"
              :class="
                expandedSections.nameOrder
                  ? 'text-sage-dark dark:text-sage-light'
                  : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
              "
            >
              Name Display Order
            </h3>
            <!-- Tooltip -->
            <div class="relative group/tooltip" @click.stop>
              <span
                class="w-5 h-5 rounded-full bg-sage/20 text-sage-dark dark:text-sage-light flex items-center justify-center text-xs font-medium hover:bg-sage/30 transition-colors cursor-help"
              >
                ?
              </span>
              <!-- Tooltip content -->
              <div
                class="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3 bg-charcoal dark:bg-dark-bg-elevated text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] whitespace-pre-line max-h-64 overflow-y-auto"
              >
                {{ nameOrderTooltip }}
              </div>
            </div>
          </div>
          <svg
            class="w-5 h-5 transition-all"
            :class="[
              expandedSections.nameOrder
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.nameOrder ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-4">
                Choose whether to display the bride or groom name first throughout the website.
              </p>

              <div class="flex flex-col sm:flex-row gap-3">
                <label
                  class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  :class="
                    formData.displayNameOrder === 'bride_first'
                      ? 'border-sage bg-sage/10 dark:bg-sage/20'
                      : 'border-sand-dark dark:border-dark-border hover:border-sage/50'
                  "
                >
                  <input
                    v-model="formData.displayNameOrder"
                    type="radio"
                    value="bride_first"
                    class="w-4 h-4 border-sand-dark text-sage focus:ring-sage"
                    :disabled="isSaving"
                  />
                  <div>
                    <span
                      class="font-body text-sm font-medium text-charcoal dark:text-dark-text block"
                    >
                      Bride First
                    </span>
                    <span
                      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                    >
                      Traditional arrangement
                    </span>
                  </div>
                </label>

                <label
                  class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  :class="
                    formData.displayNameOrder === 'groom_first'
                      ? 'border-sage bg-sage/10 dark:bg-sage/20'
                      : 'border-sand-dark dark:border-dark-border hover:border-sage/50'
                  "
                >
                  <input
                    v-model="formData.displayNameOrder"
                    type="radio"
                    value="groom_first"
                    class="w-4 h-4 border-sand-dark text-sage focus:ring-sage"
                    :disabled="isSaving"
                  />
                  <div>
                    <span
                      class="font-body text-sm font-medium text-charcoal dark:text-dark-text block"
                    >
                      Groom First
                    </span>
                    <span
                      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                    >
                      Alternative arrangement
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bismillah Calligraphy Section -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden transition-all"
        :class="
          expandedSections.calligraphy
            ? 'ring-2 ring-sage/30 border-sage/50'
            : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer"
          :class="
            expandedSections.calligraphy
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('calligraphy')"
        >
          <div>
            <h3
              class="font-heading text-base font-medium transition-colors"
              :class="
                expandedSections.calligraphy
                  ? 'text-sage-dark dark:text-sage-light'
                  : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
              "
            >
              Bismillah Calligraphy
            </h3>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
              Choose the calligraphy style for the Bismillah displayed on the hero section
            </p>
          </div>
          <svg
            class="w-5 h-5 transition-all flex-shrink-0 ml-2"
            :class="[
              expandedSections.calligraphy
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.calligraphy ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <BismillahCalligraphySelector
                :settings="formData.bismillahCalligraphy"
                :disabled="isSaving"
                @update="formData.bismillahCalligraphy = $event"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Parents Information -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden transition-all"
        :class="
          expandedSections.parents ? 'ring-2 ring-sage/30 border-sage/50' : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer"
          :class="
            expandedSections.parents
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('parents')"
        >
          <h3
            class="font-heading text-base font-medium transition-colors"
            :class="
              expandedSections.parents
                ? 'text-sage-dark dark:text-sage-light'
                : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
            "
          >
            Parents Information
          </h3>
          <svg
            class="w-5 h-5 transition-all"
            :class="[
              expandedSections.parents
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.parents ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <!-- Parents Visibility Settings -->
              <div class="mb-6 space-y-3">
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
                  Control which parents names appear on the public invitation
                </p>

                <!-- Show Bride's Parents Toggle -->
                <div
                  class="flex items-center justify-between py-3 px-4 bg-sand/50 dark:bg-dark-bg rounded-lg"
                >
                  <div>
                    <label class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                      Show Bride's Parents
                    </label>
                    <p
                      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5"
                    >
                      Display bride's parents names on the invitation
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="formData.parentsVisibility.showBrideParents"
                    class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                    :class="
                      formData.parentsVisibility.showBrideParents
                        ? 'bg-sage'
                        : 'bg-gray-300 dark:bg-dark-border'
                    "
                    :disabled="isSaving"
                    @click="
                      formData.parentsVisibility.showBrideParents =
                        !formData.parentsVisibility.showBrideParents
                    "
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="
                        formData.parentsVisibility.showBrideParents
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      "
                    />
                  </button>
                </div>

                <!-- Show Groom's Parents Toggle -->
                <div
                  class="flex items-center justify-between py-3 px-4 bg-sand/50 dark:bg-dark-bg rounded-lg"
                >
                  <div>
                    <label class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                      Show Groom's Parents
                    </label>
                    <p
                      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5"
                    >
                      Display groom's parents names on the invitation
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="formData.parentsVisibility.showGroomParents"
                    class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                    :class="
                      formData.parentsVisibility.showGroomParents
                        ? 'bg-sage'
                        : 'bg-gray-300 dark:bg-dark-border'
                    "
                    :disabled="isSaving"
                    @click="
                      formData.parentsVisibility.showGroomParents =
                        !formData.parentsVisibility.showGroomParents
                    "
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="
                        formData.parentsVisibility.showGroomParents
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      "
                    />
                  </button>
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-sand-dark dark:border-dark-border mb-4"></div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <!-- Bride's Parents -->
                <div
                  class="space-y-3 transition-opacity"
                  :class="{
                    'opacity-50': !formData.parentsVisibility.showBrideParents,
                    'cursor-not-allowed': !formData.parentsVisibility.showBrideParents,
                  }"
                >
                  <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">
                    Bride's Parents
                  </h4>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Father's Name
                    </label>
                    <input
                      v-model="formData.parents.bride.father"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-dark-bg"
                      placeholder="Father's name"
                      :disabled="isSaving || !formData.parentsVisibility.showBrideParents"
                    />
                  </div>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Mother's Name
                    </label>
                    <input
                      v-model="formData.parents.bride.mother"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-dark-bg"
                      placeholder="Mother's name"
                      :disabled="isSaving || !formData.parentsVisibility.showBrideParents"
                    />
                  </div>
                </div>

                <!-- Groom's Parents -->
                <div
                  class="space-y-3 transition-opacity"
                  :class="{
                    'opacity-50': !formData.parentsVisibility.showGroomParents,
                    'cursor-not-allowed': !formData.parentsVisibility.showGroomParents,
                  }"
                >
                  <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">
                    Groom's Parents
                  </h4>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Father's Name
                    </label>
                    <input
                      v-model="formData.parents.groom.father"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-dark-bg"
                      placeholder="Father's name"
                      :disabled="isSaving || !formData.parentsVisibility.showGroomParents"
                    />
                  </div>
                  <div>
                    <label
                      class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                    >
                      Mother's Name
                    </label>
                    <input
                      v-model="formData.parents.groom.mother"
                      type="text"
                      class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-dark-bg"
                      placeholder="Mother's name"
                      :disabled="isSaving || !formData.parentsVisibility.showGroomParents"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Details -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden transition-all"
        :class="
          expandedSections.event ? 'ring-2 ring-sage/30 border-sage/50' : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer"
          :class="
            expandedSections.event
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('event')"
        >
          <h3
            class="font-heading text-base font-medium transition-colors"
            :class="
              expandedSections.event
                ? 'text-sage-dark dark:text-sage-light'
                : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
            "
          >
            Event Details
          </h3>
          <svg
            class="w-5 h-5 transition-all"
            :class="[
              expandedSections.event
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.event ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                  >
                    Event Start Date & Time
                  </label>
                  <input
                    v-model="formattedEventDate"
                    type="datetime-local"
                    class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                    :disabled="isSaving"
                  />
                </div>
                <div>
                  <label
                    class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                  >
                    Event End Time
                  </label>
                  <input
                    v-model="formattedEventEndTime"
                    type="datetime-local"
                    class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                    :disabled="isSaving"
                  />
                </div>
              </div>
              <div>
                <label
                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                >
                  Dress Code
                </label>
                <input
                  v-model="formData.dressCode"
                  type="text"
                  class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                  placeholder="e.g., Pastel / Earthy Tones"
                  :disabled="isSaving"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Display Format Settings -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden transition-all"
        :class="
          expandedSections.displayFormat
            ? 'ring-2 ring-sage/30 border-sage/50'
            : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer"
          :class="
            expandedSections.displayFormat
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('displayFormat')"
        >
          <div>
            <h3
              class="font-heading text-base font-medium transition-colors"
              :class="
                expandedSections.displayFormat
                  ? 'text-sage-dark dark:text-sage-light'
                  : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
              "
            >
              Display Format Settings
            </h3>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
              Choose how the event date and time should appear on the public website
            </p>
          </div>
          <svg
            class="w-5 h-5 transition-all flex-shrink-0 ml-2"
            :class="[
              expandedSections.displayFormat
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.displayFormat ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <!-- Preset Dropdown -->
              <div class="mb-4">
                <label
                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                >
                  Display Format
                </label>
                <select
                  :value="formData.eventDisplayFormat.preset"
                  class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                  :disabled="isSaving"
                  @change="
                    handlePresetChange(
                      ($event.target as HTMLSelectElement).value as EventDisplayPreset
                    )
                  "
                >
                  <option v-for="option in presetOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <!-- Preview Box -->
              <div
                class="mb-4 p-4 bg-sand/50 dark:bg-dark-bg-elevated rounded-lg border border-sand-dark/50 dark:border-dark-border"
              >
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
                  Preview:
                </p>
                <div class="text-center">
                  <p
                    v-if="previewDate"
                    class="font-heading text-base text-charcoal dark:text-dark-text"
                  >
                    {{ previewDate }}
                  </p>
                  <p
                    v-if="previewTime"
                    class="font-heading text-base text-charcoal dark:text-dark-text whitespace-pre-line"
                  >
                    {{ previewTime }}
                  </p>
                  <p
                    v-if="!previewDate && !previewTime"
                    class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary italic"
                  >
                    No date/time will be displayed
                  </p>
                </div>
              </div>

              <!-- Custom Options Toggle -->
              <div v-if="formData.eventDisplayFormat.preset === 'custom'" class="space-y-4">
                <div class="border-t border-sand-dark dark:border-dark-border pt-4">
                  <h4 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
                    Custom Options
                  </h4>

                  <!-- Boolean toggles -->
                  <div class="grid grid-cols-2 gap-3 mb-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="formData.eventDisplayFormat.customOptions.showDate"
                        type="checkbox"
                        class="w-4 h-4 rounded border-sand-dark text-sage focus:ring-sage"
                        :disabled="isSaving"
                      />
                      <span class="font-body text-sm text-charcoal dark:text-dark-text"
                        >Show date</span
                      >
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="formData.eventDisplayFormat.customOptions.showDayOfWeek"
                        type="checkbox"
                        class="w-4 h-4 rounded border-sand-dark text-sage focus:ring-sage"
                        :disabled="isSaving"
                      />
                      <span class="font-body text-sm text-charcoal dark:text-dark-text"
                        >Show day of week</span
                      >
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="formData.eventDisplayFormat.customOptions.showStartTime"
                        type="checkbox"
                        class="w-4 h-4 rounded border-sand-dark text-sage focus:ring-sage"
                        :disabled="isSaving"
                      />
                      <span class="font-body text-sm text-charcoal dark:text-dark-text"
                        >Show start time</span
                      >
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="formData.eventDisplayFormat.customOptions.showEndTime"
                        type="checkbox"
                        class="w-4 h-4 rounded border-sand-dark text-sage focus:ring-sage"
                        :disabled="isSaving"
                      />
                      <span class="font-body text-sm text-charcoal dark:text-dark-text"
                        >Show end time</span
                      >
                    </label>
                  </div>

                  <!-- Time format -->
                  <div>
                    <p
                      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2"
                    >
                      Time format:
                    </p>
                    <div class="flex gap-4">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          v-model="formData.eventDisplayFormat.customOptions.timeFormat"
                          type="radio"
                          value="12h"
                          class="w-4 h-4 border-sand-dark text-sage focus:ring-sage"
                          :disabled="isSaving"
                        />
                        <span class="font-body text-sm text-charcoal dark:text-dark-text"
                          >12-hour (AM/PM)</span
                        >
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          v-model="formData.eventDisplayFormat.customOptions.timeFormat"
                          type="radio"
                          value="24h"
                          class="w-4 h-4 border-sand-dark text-sage focus:ring-sage"
                          :disabled="isSaving"
                        />
                        <span class="font-body text-sm text-charcoal dark:text-dark-text"
                          >24-hour</span
                        >
                      </label>
                    </div>
                  </div>

                  <!-- Advanced Custom Format -->
                  <div class="border-t border-sand-dark dark:border-dark-border pt-4 mt-4">
                    <h5
                      class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2"
                    >
                      Advanced Format (Optional)
                    </h5>
                    <p
                      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3"
                    >
                      Use custom format strings. Leave empty to use default formatting.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                        >
                          Date Format
                        </label>
                        <input
                          v-model="formData.eventDisplayFormat.customOptions.customDateFormat"
                          type="text"
                          class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage font-mono"
                          placeholder="e.g., DD/MM/YYYY or MMMM D, YYYY"
                          :disabled="isSaving"
                        />
                      </div>
                      <div>
                        <label
                          class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                        >
                          Time Format
                        </label>
                        <input
                          v-model="formData.eventDisplayFormat.customOptions.customTimeFormat"
                          type="text"
                          class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage font-mono"
                          placeholder="e.g., hh:mm A or HH:mm"
                          :disabled="isSaving"
                        />
                      </div>
                    </div>
                    <div
                      class="mt-2 p-2 bg-sand/30 dark:bg-dark-bg-elevated rounded text-xs text-charcoal-light dark:text-dark-text-secondary"
                    >
                      <p class="font-medium mb-1">Format tokens:</p>
                      <p>
                        Date: YYYY (year), MM (month), DD (day), MMMM (month name), dddd (day name)
                      </p>
                      <p>Time: HH (24h), hh (12h), mm (minutes), A (AM/PM)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Website Details -->
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden transition-all"
        :class="
          expandedSections.website ? 'ring-2 ring-sage/30 border-sage/50' : 'hover:border-sage/30'
        "
      >
        <button
          type="button"
          class="w-full p-4 sm:p-6 flex items-center justify-between text-left transition-colors group cursor-pointer"
          :class="
            expandedSections.website
              ? 'bg-sage/5 dark:bg-sage/10'
              : 'hover:bg-sand/30 dark:hover:bg-dark-bg-elevated'
          "
          @click="toggleSection('website')"
        >
          <h3
            class="font-heading text-base font-medium transition-colors"
            :class="
              expandedSections.website
                ? 'text-sage-dark dark:text-sage-light'
                : 'text-charcoal dark:text-dark-text group-hover:text-sage-dark dark:group-hover:text-sage-light'
            "
          >
            Website Details
          </h3>
          <svg
            class="w-5 h-5 transition-all"
            :class="[
              expandedSections.website
                ? 'rotate-180 text-sage'
                : 'text-charcoal-light dark:text-dark-text-secondary group-hover:text-sage',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expandedSections.website ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden min-h-0">
            <div class="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                  >
                    Wedding Hashtag
                  </label>
                  <input
                    v-model="formData.hashtag"
                    type="text"
                    class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                    placeholder="#YourWeddingHashtag"
                    :disabled="isSaving"
                  />
                </div>
                <div>
                  <label
                    class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                  >
                    QR Code URL
                  </label>
                  <input
                    v-model="formData.qrCodeUrl"
                    type="url"
                    class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                    placeholder="https://your-wedding-site.com"
                    :disabled="isSaving"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2"
      >
        <div class="flex-1">
          <!-- Save Error -->
          <div v-if="saveError" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="font-body text-sm text-red-600 dark:text-red-400">
              {{ saveError }}
            </p>
          </div>

          <!-- Save Success -->
          <div v-if="saveSuccess" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Wedding details saved successfully!
            </p>
          </div>

          <!-- Unsaved Changes Warning -->
          <div
            v-if="hasChanges && !isSaving && !saveSuccess"
            class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
          >
            <p class="font-body text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              You have unsaved changes
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            v-if="hasChanges"
            type="button"
            class="px-4 py-2.5 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
            @click="discardChanges"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-6 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="isSaving || !hasChanges"
            @click="handleSave"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Last Updated Info -->
      <div
        v-if="weddingDetails.updatedAt"
        class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg"
      >
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          Last updated:
          {{ new Date(weddingDetails.updatedAt).toLocaleString() }}
          <span v-if="weddingDetails.updatedBy"> by {{ weddingDetails.updatedBy }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
