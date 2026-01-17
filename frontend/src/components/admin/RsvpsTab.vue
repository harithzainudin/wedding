<script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue'
  import { useRsvps } from '@/composables/useRsvps'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import type { RsvpSubmission, AdminRsvpRequest } from '@/types/rsvp'
  import RsvpFormModal from './RsvpFormModal.vue'
  import ConfirmModal from './ConfirmModal.vue'

  const { adminT } = useAdminLanguage()

  const weddingId = computed(() => getStoredPrimaryWeddingId())

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
    isDeleting,
    operationError,
    createRsvpEntry,
    updateRsvpEntry,
    deleteRsvpEntry,
    clearOperationError,
  } = useRsvps()

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
    let success: boolean
    if (selectedRsvp.value) {
      success = await updateRsvpEntry(selectedRsvp.value.id, data, weddingId.value ?? undefined)
    } else {
      success = await createRsvpEntry(data, weddingId.value ?? undefined)
    }
    if (success) {
      showFormModal.value = false
    }
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (selectedRsvp.value) {
      const success = await deleteRsvpEntry(selectedRsvp.value.id, weddingId.value ?? undefined)
      if (success) {
        showDeleteModal.value = false
      }
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

  onMounted(() => {
    fetchRsvps(weddingId.value ?? undefined)
  })
</script>

<template>
  <div>
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
      v-if="showDeleteModal"
      :title="adminT.rsvps.deleteGuest"
      :message="
        interpolate(adminT.rsvps.deleteGuestConfirm, { name: selectedRsvp?.fullName || '' })
      "
      :confirm-text="adminT.common.delete"
      variant="danger"
      :is-loading="isDeleting"
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
  </div>
</template>
