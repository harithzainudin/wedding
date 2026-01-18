<script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import { useStaff } from '@/composables/useStaff'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'
  import type { CreateStaffRequest, StaffMember } from '@/types/admin'

  const { adminT } = useAdminLanguage()
  const {
    staff,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    loadError,
    actionError,
    actionSuccess,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    clearMessages,
  } = useStaff()

  // Modal states
  const showCreateModal = ref(false)
  const showEditModal = ref<StaffMember | null>(null)
  const showDeleteConfirm = ref<string | null>(null)

  // Input refs for auto-focus
  const createUsernameInput = ref<HTMLInputElement | null>(null)
  const editEmailInput = ref<HTMLInputElement | null>(null)

  // Form state
  const createForm = ref<CreateStaffRequest>({
    username: '',
    password: '',
    email: '',
  })
  const createFormError = ref('')
  const showCreatePassword = ref(false)

  const editForm = ref({
    email: '',
    password: '',
  })
  const editFormError = ref('')
  const showEditPassword = ref(false)

  // Handle ESC key to close modals
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showDeleteConfirm.value) {
        showDeleteConfirm.value = null
      } else if (showEditModal.value) {
        closeEditModal()
      } else if (showCreateModal.value) {
        closeCreateModal()
      }
    }
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get wedding count text
  const getWeddingCountText = (count: number): string => {
    if (count === 0) return adminT.value.staff.noWeddings
    return interpolate(adminT.value.staff.managingWeddings, { count: count.toString() })
  }

  // Handle create submit
  const handleCreateSubmit = async () => {
    createFormError.value = ''

    // Validate
    if (!createForm.value.username || createForm.value.username.length < 3) {
      createFormError.value = 'Username must be at least 3 characters'
      return
    }
    if (!createForm.value.password || createForm.value.password.length < 8) {
      createFormError.value = 'Password must be at least 8 characters'
      return
    }

    const result = await createStaff(createForm.value)
    if (result.success) {
      closeCreateModal()
    } else {
      createFormError.value = result.error ?? 'Failed to create staff'
    }
  }

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!showEditModal.value) return
    editFormError.value = ''

    // At least one field must be provided
    if (!editForm.value.email && !editForm.value.password) {
      editFormError.value = 'At least one field (email or password) must be provided'
      return
    }

    // Validate password if provided
    if (editForm.value.password && editForm.value.password.length < 8) {
      editFormError.value = 'Password must be at least 8 characters'
      return
    }

    const updateData: { email?: string; password?: string } = {}
    if (editForm.value.email) {
      updateData.email = editForm.value.email
    }
    if (editForm.value.password) {
      updateData.password = editForm.value.password
    }

    const result = await updateStaff(showEditModal.value.username, updateData)
    if (result.success) {
      closeEditModal()
    } else {
      editFormError.value = result.error ?? 'Failed to update staff'
    }
  }

  // Handle delete
  const handleDelete = async (username: string) => {
    await deleteStaff(username)
    showDeleteConfirm.value = null
  }

  // Modal helpers
  const openCreateModal = () => {
    showCreateModal.value = true
    nextTick(() => {
      createUsernameInput.value?.focus()
    })
  }

  const closeCreateModal = () => {
    showCreateModal.value = false
    createForm.value = { username: '', password: '', email: '' }
    createFormError.value = ''
    showCreatePassword.value = false
  }

  const openEditModal = (staffMember: StaffMember) => {
    showEditModal.value = staffMember
    editForm.value = {
      email: staffMember.email ?? '',
      password: '',
    }
    editFormError.value = ''
    showEditPassword.value = false
    nextTick(() => {
      editEmailInput.value?.focus()
    })
  }

  const closeEditModal = () => {
    showEditModal.value = null
    editForm.value = { email: '', password: '' }
    editFormError.value = ''
    showEditPassword.value = false
  }

  // Handle backdrop click
  const handleBackdropClick = (event: MouseEvent, closeHandler: () => void) => {
    if (event.target === event.currentTarget) {
      closeHandler()
    }
  }

  onMounted(() => {
    fetchStaff()
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-bold text-charcoal dark:text-dark-text">
          {{ adminT.staff.title }}
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.staff.description }}
        </p>
      </div>
      <button
        type="button"
        class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        @click="openCreateModal"
      >
        + {{ adminT.staff.addStaff }}
      </button>
    </div>

    <!-- Messages -->
    <div
      v-if="actionSuccess"
      class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <p class="font-body text-sm text-green-700 dark:text-green-300">{{ actionSuccess }}</p>
      <button
        type="button"
        class="text-green-600 underline text-sm mt-1 cursor-pointer"
        @click="clearMessages"
      >
        Dismiss
      </button>
    </div>
    <div
      v-if="actionError"
      class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <p class="font-body text-sm text-red-700 dark:text-red-300">{{ actionError }}</p>
      <button
        type="button"
        class="text-red-600 underline text-sm mt-1 cursor-pointer"
        @click="clearMessages"
      >
        Dismiss
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-red-500 mb-4">{{ loadError }}</p>
      <button
        type="button"
        class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
        @click="fetchStaff"
      >
        Retry
      </button>
    </div>

    <!-- Staff List -->
    <div
      v-else
      class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden"
    >
      <!-- Empty State -->
      <div v-if="staff.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-4">👥</div>
        <p class="font-body text-charcoal-light dark:text-dark-text-secondary mb-2">
          {{ adminT.staff.noStaffYet }}
        </p>
        <p class="font-body text-sm text-charcoal-light/70 dark:text-dark-text-secondary/70 mb-4">
          {{ adminT.staff.createFirst }}
        </p>
        <button
          type="button"
          class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
          @click="openCreateModal"
        >
          + {{ adminT.staff.addStaff }}
        </button>
      </div>

      <!-- Staff Cards -->
      <div v-else class="divide-y divide-sand-dark dark:divide-dark-border">
        <div
          v-for="member in staff"
          :key="member.username"
          class="p-4 hover:bg-sand/50 dark:hover:bg-dark-bg/50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xl">👤</span>
                <h3 class="font-heading font-medium text-charcoal dark:text-dark-text">
                  {{ member.username }}
                </h3>
              </div>
              <p
                v-if="member.email"
                class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1"
              >
                {{ member.email }}
              </p>
              <p
                class="font-body text-sm text-charcoal-light/70 dark:text-dark-text-secondary/70 mt-1"
              >
                {{ getWeddingCountText(member.weddingIds?.length ?? 0) }}
              </p>
              <p
                class="font-body text-xs text-charcoal-light/50 dark:text-dark-text-secondary/50 mt-2"
              >
                {{ adminT.staff.createdAt }}: {{ formatDate(member.createdAt) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-sm font-body text-sage hover:bg-sage/10 rounded-lg transition-colors cursor-pointer"
                @click="openEditModal(member)"
              >
                {{ adminT.common.edit }}
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm font-body text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                @click="showDeleteConfirm = member.username"
              >
                {{ adminT.common.delete }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Staff Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick($event, closeCreateModal)"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full">
            <div
              class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between"
            >
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ adminT.staff.addStaff }}
              </h3>
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                title="Close (ESC)"
                @click="closeCreateModal"
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
            <form @submit.prevent="handleCreateSubmit" class="p-6 space-y-4">
              <!-- Username -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.staff.username }} *
                </label>
                <input
                  ref="createUsernameInput"
                  v-model="createForm.username"
                  type="text"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., harith"
                />
              </div>

              <!-- Email -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.staff.email }}
                </label>
                <input
                  v-model="createForm.email"
                  type="email"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., harith@company.com"
                />
              </div>

              <!-- Password -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.staff.password }} *
                </label>
                <div class="relative">
                  <input
                    v-model="createForm.password"
                    :type="showCreatePassword ? 'text' : 'password'"
                    class="w-full px-3 py-2 pr-10 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                    @click="showCreatePassword = !showCreatePassword"
                  >
                    <span v-if="showCreatePassword">👁️</span>
                    <span v-else>👁️‍🗨️</span>
                  </button>
                </div>
              </div>

              <!-- Error -->
              <p v-if="createFormError" class="font-body text-sm text-red-500">
                {{ createFormError }}
              </p>

              <!-- Buttons -->
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                  @click="closeCreateModal"
                >
                  {{ adminT.common.cancel }}
                </button>
                <button
                  type="submit"
                  :disabled="isCreating"
                  class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ isCreating ? adminT.common.saving : adminT.staff.addStaff }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Edit Staff Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick($event, closeEditModal)"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full">
            <div
              class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between"
            >
              <div>
                <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                  {{ adminT.staff.editStaff }}
                </h3>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                  {{ showEditModal.username }}
                </p>
              </div>
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                title="Close (ESC)"
                @click="closeEditModal"
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
            <form @submit.prevent="handleEditSubmit" class="p-6 space-y-4">
              <!-- Email -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.staff.email }}
                </label>
                <input
                  ref="editEmailInput"
                  v-model="editForm.email"
                  type="email"
                  class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                  placeholder="e.g., harith@company.com"
                />
              </div>

              <!-- Password -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.staff.password }}
                  <span class="text-charcoal-light dark:text-dark-text-secondary font-normal">
                    (leave empty to keep current)
                  </span>
                </label>
                <div class="relative">
                  <input
                    v-model="editForm.password"
                    :type="showEditPassword ? 'text' : 'password'"
                    class="w-full px-3 py-2 pr-10 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
                    placeholder="New password (min 8 characters)"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                    @click="showEditPassword = !showEditPassword"
                  >
                    <span v-if="showEditPassword">👁️</span>
                    <span v-else>👁️‍🗨️</span>
                  </button>
                </div>
              </div>

              <!-- Error -->
              <p v-if="editFormError" class="font-body text-sm text-red-500">
                {{ editFormError }}
              </p>

              <!-- Buttons -->
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                  @click="closeEditModal"
                >
                  {{ adminT.common.cancel }}
                </button>
                <button
                  type="submit"
                  :disabled="isUpdating"
                  class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ isUpdating ? adminT.common.saving : adminT.common.save }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Delete Confirm Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleBackdropClick($event, () => (showDeleteConfirm = null))"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-start gap-4 mb-4">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                  {{ adminT.staff.deleteStaff }}
                </h3>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
                  {{ interpolate(adminT.staff.deleteConfirm, { username: showDeleteConfirm }) }}
                </p>
              </div>
            </div>
            <div
              class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-6"
            >
              <p class="font-body text-sm text-amber-700 dark:text-amber-300">
                ⚠️ {{ adminT.staff.deleteWarning }}
              </p>
            </div>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="showDeleteConfirm = null"
              >
                {{ adminT.common.cancel }}
              </button>
              <button
                type="button"
                :disabled="isDeleting"
                class="px-4 py-2 bg-red-600 text-white font-body text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                @click="handleDelete(showDeleteConfirm!)"
              >
                {{ isDeleting ? 'Deleting...' : adminT.common.delete }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
