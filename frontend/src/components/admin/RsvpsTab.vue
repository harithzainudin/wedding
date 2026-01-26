<script setup lang="ts">
  import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
  import { useRsvps } from '@/composables/useRsvps'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { useWeddingDetails } from '@/composables/useWeddingDetails'
  import { interpolate } from '@/i18n/translations'
  import { getStoredPrimaryWeddingId, getStoredPrimaryWeddingSlug } from '@/services/tokenManager'
  import type { RsvpSubmission, AdminRsvpRequest } from '@/types/rsvp'
  import RsvpFormModal from './RsvpFormModal.vue'
  import ConfirmModal from './ConfirmModal.vue'
  import RsvpAttendanceChart from './charts/RsvpAttendanceChart.vue'
  import RsvpCategoryChart from './charts/RsvpCategoryChart.vue'
  import RsvpTimelineChart from './charts/RsvpTimelineChart.vue'
  import RsvpPartySizeChart from './charts/RsvpPartySizeChart.vue'
  import RsvpSideChart from './charts/RsvpSideChart.vue'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()
  const { weddingDetails, fetchWeddingDetails } = useWeddingDetails()

  const weddingId = computed(() => getStoredPrimaryWeddingId())
  const weddingSlug = computed(() => getStoredPrimaryWeddingSlug())

  // Settings panel state
  const showSettings = ref(false)

  // Analytics section state
  const showAnalytics = ref(true)

  const {
    filteredRsvps,
    isLoading,
    loadError,
    filter,
    summary,
    fetchRsvps,
    setFilter,
    formatDate,
    exportToCsv,
    isCreating,
    isUpdating,
    operationError,
    createRsvpEntry,
    updateRsvpEntry,
    deleteRsvpEntry,
    clearOperationError,
    rsvpSettings,
    updateSettings,
    analytics,
  } = useRsvps()

  // Local state for other settings (saved when clicking save button in modal)
  const localAcceptingRsvps = ref(true)
  const localRsvpDeadline = ref<string>('')

  // Sync local settings state from rsvpSettings
  const syncLocalSettings = () => {
    localAcceptingRsvps.value = rsvpSettings.value.acceptingRsvps
    localRsvpDeadline.value = rsvpSettings.value.rsvpDeadline
      ? rsvpSettings.value.rsvpDeadline.slice(0, 16) // Format for datetime-local input
      : ''
  }

  // Check if settings have changed (only for modal settings, not visibility toggle)
  const hasSettingsChanges = computed(() => {
    const currentDeadline = rsvpSettings.value.rsvpDeadline
      ? rsvpSettings.value.rsvpDeadline.slice(0, 16)
      : ''
    return (
      localAcceptingRsvps.value !== rsvpSettings.value.acceptingRsvps ||
      localRsvpDeadline.value !== currentDeadline
    )
  })

  // Get event date for deadline validation
  const eventDate = computed(() => {
    return weddingDetails.value?.eventDate
  })

  // Convert local deadline to datetime-local max value
  const maxDeadlineDate = computed(() => {
    if (!eventDate.value) return ''
    return eventDate.value.slice(0, 16) // Format for datetime-local input
  })

  // Clear deadline
  const clearDeadline = () => {
    localRsvpDeadline.value = ''
  }

  // Save settings (for modal - acceptingRsvps and deadline only, visibility auto-saves)
  const saveSettings = async () => {
    await withLoading(
      async () => {
        await updateSettings(
          {
            acceptingRsvps: localAcceptingRsvps.value,
            ...(localRsvpDeadline.value
              ? { rsvpDeadline: new Date(localRsvpDeadline.value).toISOString() }
              : {}),
          },
          weddingId.value ?? undefined
        )
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Modal state
  const showFormModal = ref(false)
  const showDeleteModal = ref(false)
  const selectedRsvp = ref<RsvpSubmission | undefined>(undefined)

  // Open add modal
  const openAddModal = () => {
    selectedRsvp.value = undefined
    showFormModal.value = true
  }

  // Open edit modal
  const openEditModal = (rsvp: RsvpSubmission) => {
    selectedRsvp.value = rsvp
    showFormModal.value = true
  }

  // Open delete confirmation
  const openDeleteModal = (rsvp: RsvpSubmission) => {
    selectedRsvp.value = rsvp
    showDeleteModal.value = true
  }

  // Handle form submit (create or update)
  const handleFormSubmit = async (data: AdminRsvpRequest) => {
    showFormModal.value = false
    await withLoading(
      async () => {
        if (selectedRsvp.value) {
          await updateRsvpEntry(selectedRsvp.value.id, data, weddingId.value ?? undefined)
        } else {
          await createRsvpEntry(data, weddingId.value ?? undefined)
        }
      },
      {
        message: selectedRsvp.value
          ? adminT.value.loadingOverlay.saving
          : adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (selectedRsvp.value) {
      showDeleteModal.value = false
      await withLoading(
        async () => {
          await deleteRsvpEntry(selectedRsvp.value!.id, weddingId.value ?? undefined)
        },
        {
          message: adminT.value.loadingOverlay.deleting,
          showSuccess: true,
        }
      )
    }
  }

  // Auto-clear error after 5 seconds
  watch(operationError, (error) => {
    if (error) {
      setTimeout(() => {
        clearOperationError()
      }, 5000)
    }
  })

  // Sync local settings when rsvpSettings changes
  watch(rsvpSettings, () => {
    syncLocalSettings()
  })

  // Handle Escape key to close settings
  const handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && showSettings.value) {
      showSettings.value = false
    }
  }

  // Reset body overflow after settings panel leave animation completes
  const onSettingsClosed = (): void => {
    document.body.style.overflow = ''
  }

  watch(showSettings, (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapeKey)
  })

  onMounted(async () => {
    await fetchRsvps(weddingId.value ?? undefined)
    // fetchWeddingDetails expects a slug, not ID
    if (weddingSlug.value) {
      await fetchWeddingDetails(weddingSlug.value)
    }
    syncLocalSettings()
  })

  // Watch for wedding ID changes (user switching between weddings)
  watch(weddingId, async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchRsvps(newId)
      // fetchWeddingDetails expects a slug, not ID
      const slug = getStoredPrimaryWeddingSlug()
      if (slug) {
        await fetchWeddingDetails(slug)
      }
      syncLocalSettings()
    }
  })
</script>

<template>
  <div>
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.rsvps.totalRsvps }}
        </p>
        <p class="font-heading text-2xl text-sage-dark dark:text-sage-light">
          {{ summary.total }}
        </p>
      </div>
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.rsvps.attending }}
        </p>
        <p class="font-heading text-2xl text-green-600 dark:text-green-400">
          {{ summary.attending }}
        </p>
      </div>
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.rsvps.notAttending }}
        </p>
        <p class="font-heading text-2xl text-red-600 dark:text-red-400">
          {{ summary.notAttending }}
        </p>
      </div>
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.rsvps.totalGuests }}
        </p>
        <p class="font-heading text-2xl text-sage-dark dark:text-sage-light">
          {{ summary.totalGuests }}
        </p>
      </div>
    </div>

    <!-- Analytics Dashboard Section -->
    <div v-if="analytics && summary.total > 0" class="mb-8">
      <button
        type="button"
        class="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg cursor-pointer hover:bg-sand/50 dark:hover:bg-dark-bg-elevated transition-colors mb-4"
        @click="showAnalytics = !showAnalytics"
      >
        <span class="font-heading text-lg text-charcoal dark:text-dark-text">
          {{ adminT.rsvps.analytics }}
        </span>
        <svg
          class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform"
          :class="{ 'rotate-180': showAnalytics }"
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

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2 max-h-0"
        enter-to-class="opacity-100 translate-y-0 max-h-[2000px]"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 max-h-[2000px]"
        leave-to-class="opacity-0 -translate-y-2 max-h-0"
      >
        <div v-if="showAnalytics" class="overflow-hidden space-y-4">
          <!-- Metrics Row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                {{ adminT.rsvps.attendanceRate }}
              </p>
              <p class="font-heading text-2xl text-green-600 dark:text-green-400">
                {{ analytics.attendanceRate }}%
              </p>
            </div>
            <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                {{ adminT.rsvps.avgPartySize }}
              </p>
              <p class="font-heading text-2xl text-blue-600 dark:text-blue-400">
                {{ analytics.avgPartySize }}
              </p>
            </div>
          </div>

          <!-- Charts Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Attendance Breakdown -->
            <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
              <h4 class="font-heading text-sm text-charcoal dark:text-dark-text mb-3">
                {{ adminT.rsvps.attendanceBreakdown }}
              </h4>
              <RsvpAttendanceChart
                :attending="summary.attending"
                :not-attending="summary.notAttending"
              />
            </div>

            <!-- Guest Category Breakdown -->
            <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
              <h4 class="font-heading text-sm text-charcoal dark:text-dark-text mb-3">
                {{ adminT.rsvps.guestsByCategory }}
              </h4>
              <RsvpCategoryChart :by-category="analytics.byCategory" />
            </div>

            <!-- RSVP Timeline -->
            <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
              <h4 class="font-heading text-sm text-charcoal dark:text-dark-text mb-3">
                {{ adminT.rsvps.rsvpTimeline }}
              </h4>
              <RsvpTimelineChart :timeline="analytics.timeline" />
            </div>

            <!-- Party Size Distribution -->
            <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
              <h4 class="font-heading text-sm text-charcoal dark:text-dark-text mb-3">
                {{ adminT.rsvps.partySizeDistribution }}
              </h4>
              <RsvpPartySizeChart :distribution="analytics.partySizeDistribution" />
            </div>
          </div>

          <!-- Bride/Groom Side Chart (only for combined weddings) -->
          <div
            v-if="analytics.bySide && weddingDetails?.weddingType === 'combined'"
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg"
          >
            <h4 class="font-heading text-sm text-charcoal dark:text-dark-text mb-3">
              {{ adminT.rsvps.guestsBySide }}
            </h4>
            <RsvpSideChart :by-side="analytics.bySide" />
          </div>
        </div>
      </Transition>
    </div>

    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 flex-wrap">
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            filter === 'all'
              ? 'bg-sage text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="setFilter('all')"
        >
          {{ adminT.rsvps.filterAll }} ({{ summary.total }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            filter === 'attending'
              ? 'bg-green-600 text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="setFilter('attending')"
        >
          {{ adminT.rsvps.filterAttending }} ({{ summary.attending }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            filter === 'not_attending'
              ? 'bg-red-600 text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="setFilter('not_attending')"
        >
          {{ adminT.rsvps.filterNotAttending }} ({{ summary.notAttending }})
        </button>
      </div>

      <div class="flex gap-2">
        <!-- Settings Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
          @click="showSettings = !showSettings"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="hidden sm:inline">{{ adminT.common.settings }}</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
          @click="openAddModal"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {{ adminT.rsvps.addGuest }}
        </button>
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage hover:text-white transition-colors cursor-pointer"
          @click="exportToCsv"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {{ adminT.rsvps.exportCsv }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      ></div>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.rsvps.loadingRsvps }}
      </p>
    </div>

    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="fetchRsvps(weddingId ?? undefined)"
      >
        {{ adminT.common.tryAgain }}
      </button>
    </div>

    <div
      v-else-if="filteredRsvps.length === 0"
      class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl"
    >
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.rsvps.noRsvps }}
      </p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="openAddModal"
      >
        {{ adminT.rsvps.addFirstGuest }}
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="rsvp in filteredRsvps"
        :key="rsvp.id"
        class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <p class="font-heading text-lg text-charcoal dark:text-dark-text">
                {{ rsvp.title }} {{ rsvp.fullName }}
              </p>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="
                  rsvp.isAttending
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                "
              >
                {{ rsvp.isAttending ? adminT.rsvps.attending : adminT.rsvps.notAttending }}
              </span>
              <span
                v-if="rsvp.source === 'admin'"
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              >
                {{ adminT.rsvps.manual }}
              </span>
            </div>
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              <span v-if="rsvp.phoneNumber">{{ rsvp.phoneNumber }}</span>
              <span v-if="rsvp.phoneNumber && rsvp.isAttending"> &bull; </span>
              <span v-if="rsvp.isAttending"
                >{{ rsvp.numberOfGuests }} {{ adminT.rsvps.guests }}</span
              >
              <span v-if="!rsvp.phoneNumber && !rsvp.isAttending" class="italic">{{
                adminT.rsvps.noPhoneProvided
              }}</span>
            </p>
            <p
              v-if="rsvp.message"
              class="font-body text-sm text-charcoal dark:text-dark-text mt-2 italic"
            >
              "{{ rsvp.message }}"
            </p>
          </div>
          <div class="flex items-center gap-2">
            <p
              class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary whitespace-nowrap"
            >
              {{ formatDate(rsvp.submittedAt) }}
            </p>
            <div class="flex gap-1">
              <button
                type="button"
                class="p-1.5 text-sage hover:bg-sage/10 dark:hover:bg-sage/20 rounded-lg transition-colors cursor-pointer"
                title="Edit"
                @click="openEditModal(rsvp)"
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                title="Delete"
                @click="openDeleteModal(rsvp)"
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 text-center">
      <button
        type="button"
        class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors cursor-pointer"
        @click="fetchRsvps(weddingId ?? undefined)"
      >
        {{ adminT.common.refresh }}
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <RsvpFormModal
      v-if="showFormModal && selectedRsvp"
      :show="true"
      :rsvp="selectedRsvp"
      :is-submitting="isCreating || isUpdating"
      @close="showFormModal = false"
      @submit="handleFormSubmit"
    />
    <RsvpFormModal
      v-else-if="showFormModal"
      :show="true"
      :is-submitting="isCreating"
      @close="showFormModal = false"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      :title="adminT.rsvps.deleteGuest"
      :message="
        interpolate(adminT.rsvps.deleteGuestConfirm, { name: selectedRsvp?.fullName || '' })
      "
      :confirm-text="adminT.common.delete"
      variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Error toast -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="operationError"
          class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
        >
          <svg
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span class="font-body text-sm">{{ operationError }}</span>
          <button
            type="button"
            class="ml-2 hover:opacity-80 transition-opacity cursor-pointer"
            @click="clearOperationError"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Settings Panel (Bottom Sheet / Modal) -->
    <Teleport to="body">
      <Transition name="settings-panel" @after-leave="onSettingsClosed">
        <div v-if="showSettings" class="settings-container" @click.self="showSettings = false">
          <div
            class="settings-panel bg-white dark:bg-dark-bg-secondary border-sand-dark dark:border-dark-border"
          >
            <!-- Mobile Header with Close -->
            <div class="settings-mobile-header border-sand-dark dark:border-dark-border">
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ adminT.rsvps.title }} {{ adminT.common.settings }}
              </h3>
              <button
                type="button"
                class="p-2 -m-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="showSettings = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Settings Content -->
            <div class="p-4 space-y-4">
              <!-- Accept RSVPs Toggle -->
              <div
                class="flex items-center justify-between py-3 px-4 bg-sand/50 dark:bg-dark-bg rounded-lg"
              >
                <div>
                  <label class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                    {{ adminT.rsvps.acceptRsvps }}
                  </label>
                  <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                    {{ adminT.rsvps.acceptRsvpsDesc }}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="localAcceptingRsvps"
                  :disabled="isLoading"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                  :class="localAcceptingRsvps ? 'bg-sage' : 'bg-gray-300 dark:bg-dark-border'"
                  @click="localAcceptingRsvps = !localAcceptingRsvps"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="localAcceptingRsvps ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>

              <!-- RSVP Deadline -->
              <div class="py-3 px-4 bg-sand/50 dark:bg-dark-bg rounded-lg">
                <label class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                  {{ adminT.rsvps.rsvpDeadline }}
                </label>
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
                  {{ adminT.rsvps.rsvpDeadlineDesc }}
                </p>
                <div class="flex items-center gap-2">
                  <input
                    v-model="localRsvpDeadline"
                    type="datetime-local"
                    :max="maxDeadlineDate"
                    :disabled="isLoading"
                    class="flex-1 px-3 py-2 font-body text-sm border border-charcoal/20 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:ring-2 focus:ring-sage focus:border-sage"
                  />
                  <button
                    v-if="localRsvpDeadline"
                    type="button"
                    class="px-3 py-2 font-body text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    @click="clearDeadline"
                  >
                    {{ adminT.rsvps.clearDeadline }}
                  </button>
                </div>
                <p
                  v-if="!localRsvpDeadline"
                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1 italic"
                >
                  {{ adminT.rsvps.noDeadline }}
                </p>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end pt-2">
                <button
                  type="button"
                  :disabled="!hasSettingsChanges || isLoading"
                  class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="saveSettings"
                >
                  {{ adminT.common.saveChanges }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  /* Settings Container - Backdrop */
  .settings-container {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0);
    transition: background 0.3s ease-out;
  }

  /* Settings Panel - Mobile: Bottom Sheet */
  .settings-panel {
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
    transition: transform 0.3s ease-out;
    will-change: transform;
  }

  .settings-mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom-width: 1px;
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 10;
  }

  /* Desktop styles */
  @media (min-width: 640px) {
    .settings-container {
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
    }

    .settings-panel {
      width: auto;
      min-width: 400px;
      max-width: 500px;
      max-height: 80vh;
      border-radius: 1rem;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(1);
      transition:
        transform 0.3s ease-out,
        opacity 0.3s ease-out;
      will-change: transform, opacity;
    }
  }

  /* Transition - Enter */
  .settings-panel-enter-active {
    transition: opacity 0.3s ease-out;
  }

  .settings-panel-enter-active .settings-panel {
    transition: transform 0.3s ease-out;
  }

  .settings-panel-enter-from {
    opacity: 0;
  }

  .settings-panel-enter-from .settings-panel {
    transform: translateY(100%);
  }

  @media (min-width: 640px) {
    .settings-panel-enter-from .settings-panel {
      transform: scale(0.95) translateY(10px);
    }
  }

  /* Transition - Leave */
  .settings-panel-leave-active {
    transition: opacity 0.2s ease-in;
  }

  .settings-panel-leave-active .settings-panel {
    transition: transform 0.2s ease-in;
  }

  .settings-panel-leave-to {
    opacity: 0;
  }

  .settings-panel-leave-to .settings-panel {
    transform: translateY(100%);
  }

  @media (min-width: 640px) {
    .settings-panel-leave-to .settings-panel {
      transform: scale(0.95) translateY(10px);
    }
  }
</style>
