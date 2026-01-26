<script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import type {
    RsvpSubmission,
    AdminRsvpRequest,
    AnyGuestType,
    AttendanceStatus,
  } from '@/types/rsvp'
  import { GUEST_TYPES } from '@/types/rsvp'
  import type { HonorificTitle } from '@/types/index'
  import { HONORIFIC_TITLES } from '@/types/index'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import BaseFormModal from './BaseFormModal.vue'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    show: boolean
    rsvp?: RsvpSubmission
    isSubmitting: boolean
  }>()

  const emit = defineEmits<{
    close: []
    submit: [data: AdminRsvpRequest]
  }>()

  // Template refs
  const nameInputRef = ref<HTMLInputElement | null>(null)

  // Form state
  const title = ref<HonorificTitle | ''>('')
  const fullName = ref('')
  const isAttending = ref<AttendanceStatus>('yes')
  const numberOfAdults = ref(1)
  const numberOfChildren = ref(0)
  const guestType = ref<AnyGuestType | ''>('')
  const message = ref('')

  // Computed total guests
  const totalGuests = computed(() => numberOfAdults.value + numberOfChildren.value)

  // Show guest count section for 'yes' and 'maybe' responses
  const showGuestCount = computed(() => {
    return isAttending.value === 'yes' || isAttending.value === 'maybe'
  })

  // Computed
  const isEditMode = computed(() => !!props.rsvp)
  const modalTitle = computed(() =>
    isEditMode.value ? adminT.value.rsvps.formTitleEdit : adminT.value.rsvps.formTitleAdd
  )
  const submitText = computed(() => {
    if (props.isSubmitting) return adminT.value.rsvps.savingGuest
    return isEditMode.value ? adminT.value.common.update : adminT.value.rsvps.formTitleAdd
  })

  const isValid = computed(() => {
    return fullName.value.trim().length >= 2
  })

  // Handle escape key to close modal
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.show && !props.isSubmitting) {
      emit('close')
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  // Reset/populate form when modal opens or rsvp changes
  watch(
    () => [props.show, props.rsvp],
    async () => {
      if (props.show && props.rsvp) {
        // Edit mode: populate from existing
        title.value = props.rsvp.title || ''
        fullName.value = props.rsvp.fullName
        // Handle both legacy boolean and new string format
        const attendance = props.rsvp.isAttending
        if (typeof attendance === 'boolean') {
          isAttending.value = attendance ? 'yes' : 'no'
        } else {
          isAttending.value = attendance
        }
        numberOfAdults.value = props.rsvp.numberOfAdults || 1
        numberOfChildren.value = props.rsvp.numberOfChildren || 0
        guestType.value = props.rsvp.guestType || ''
        message.value = props.rsvp.message || ''
      } else if (props.show) {
        // Create mode: reset to defaults
        title.value = ''
        fullName.value = ''
        isAttending.value = 'yes'
        numberOfAdults.value = 1
        numberOfChildren.value = 0
        guestType.value = ''
        message.value = ''
      }

      // Auto-focus name input when modal opens
      if (props.show) {
        await nextTick()
        nameInputRef.value?.focus()
      }
    },
    { immediate: true }
  )

  // Handle submit
  const handleSubmit = () => {
    if (!isValid.value || props.isSubmitting) return

    const shouldHaveGuests = isAttending.value === 'yes' || isAttending.value === 'maybe'

    const data: AdminRsvpRequest = {
      fullName: fullName.value.trim(),
      isAttending: isAttending.value,
      numberOfAdults: shouldHaveGuests ? numberOfAdults.value : 0,
      numberOfChildren: shouldHaveGuests ? numberOfChildren.value : 0,
    }

    if (title.value) {
      data.title = title.value
    }

    if (message.value.trim()) {
      data.message = message.value.trim()
    }

    // Handle guestType - include if selected, set null to remove in edit mode
    if (guestType.value) {
      data.guestType = guestType.value
    } else if (isEditMode.value && props.rsvp?.guestType) {
      // Explicitly remove guestType when editing and it was previously set
      data.guestType = null
    }

    emit('submit', data)
  }

  // Toggle attendance
  const setAttending = (value: AttendanceStatus) => {
    if (props.isSubmitting) return
    isAttending.value = value
  }

  // Handle adult count input
  const handleAdultInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    let value = parseInt(target.value, 10)

    // Clamp value between 1 and 5
    if (isNaN(value) || value < 1) {
      value = 1
    } else if (value > 5) {
      value = 5
    }

    numberOfAdults.value = value
  }

  // Handle children count input
  const handleChildrenInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    let value = parseInt(target.value, 10)

    // Clamp value between 0 and 5
    if (isNaN(value) || value < 0) {
      value = 0
    } else if (value > 5) {
      value = 5
    }

    numberOfChildren.value = value
  }
</script>

<template>
  <BaseFormModal
    :show="show"
    :title="modalTitle"
    :submit-text="submitText"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <!-- Title (honorific) - Optional -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
        {{ adminT.rsvps.titleLabelOptional }}
      </label>
      <select
        v-model="title"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50"
      >
        <option value="">{{ adminT.rsvps.noTitle }}</option>
        <option v-for="t in HONORIFIC_TITLES" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
    </div>

    <!-- Full Name - Required -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
        {{ adminT.rsvps.fullName }} <span class="text-red-500">*</span>
      </label>
      <input
        ref="nameInputRef"
        v-model="fullName"
        type="text"
        required
        minlength="2"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50"
        :placeholder="adminT.rsvps.enterFullName"
      />
      <p v-if="fullName && fullName.trim().length < 2" class="mt-1 font-body text-xs text-red-500">
        {{ adminT.rsvps.nameTooShort }}
      </p>
    </div>

    <!-- Attendance Status - Visual Toggle (3 options) -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-2">
        {{ adminT.rsvps.attendance }}
      </label>
      <div class="flex rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border">
        <!-- Attending -->
        <button
          type="button"
          :disabled="isSubmitting"
          class="flex-1 px-3 py-2.5 font-body text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          :class="
            isAttending === 'yes'
              ? 'bg-green-600 text-white shadow-inner'
              : 'bg-white dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-green-50 dark:hover:bg-green-900/20'
          "
          @click="setAttending('yes')"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ adminT.rsvps.attendingLabel }}
        </button>

        <!-- Maybe -->
        <button
          type="button"
          :disabled="isSubmitting"
          class="flex-1 px-3 py-2.5 font-body text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border-l border-sand-dark dark:border-dark-border"
          :class="
            isAttending === 'maybe'
              ? 'bg-amber-500 text-white shadow-inner'
              : 'bg-white dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-amber-50 dark:hover:bg-amber-900/20'
          "
          @click="setAttending('maybe')"
        >
          <span class="text-base font-bold">?</span>
          {{ adminT.rsvps.maybe }}
        </button>

        <!-- Not Attending -->
        <button
          type="button"
          :disabled="isSubmitting"
          class="flex-1 px-3 py-2.5 font-body text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border-l border-sand-dark dark:border-dark-border"
          :class="
            isAttending === 'no'
              ? 'bg-red-600 text-white shadow-inner'
              : 'bg-white dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-red-50 dark:hover:bg-red-900/20'
          "
          @click="setAttending('no')"
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
          {{ adminT.rsvps.notAttendingLabel }}
        </button>
      </div>
    </div>

    <!-- Number of Adults and Children - With smooth transition -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-64"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 max-h-64"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <div v-if="showGuestCount" class="overflow-hidden space-y-3">
        <!-- Adults -->
        <div>
          <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
            {{ adminT.rsvps.numberOfAdults }} <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="isSubmitting || numberOfAdults <= 1"
              class="w-10 h-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg flex items-center justify-center transition-colors hover:bg-sand dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              @click="numberOfAdults = Math.max(1, numberOfAdults - 1)"
            >
              <svg
                class="w-5 h-5 text-charcoal dark:text-dark-text"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div class="flex-1 relative">
              <input
                type="number"
                :value="numberOfAdults"
                min="1"
                max="5"
                :disabled="isSubmitting"
                class="w-full h-10 px-3 font-heading text-xl text-center text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                @input="handleAdultInput"
                @blur="handleAdultInput"
              />
            </div>
            <button
              type="button"
              :disabled="isSubmitting || numberOfAdults >= 5"
              class="w-10 h-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg flex items-center justify-center transition-colors hover:bg-sand dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              @click="numberOfAdults = Math.min(5, numberOfAdults + 1)"
            >
              <svg
                class="w-5 h-5 text-charcoal dark:text-dark-text"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Children -->
        <div>
          <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
            {{ adminT.rsvps.numberOfChildren }}
          </label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="isSubmitting || numberOfChildren <= 0"
              class="w-10 h-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg flex items-center justify-center transition-colors hover:bg-sand dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              @click="numberOfChildren = Math.max(0, numberOfChildren - 1)"
            >
              <svg
                class="w-5 h-5 text-charcoal dark:text-dark-text"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div class="flex-1 relative">
              <input
                type="number"
                :value="numberOfChildren"
                min="0"
                max="5"
                :disabled="isSubmitting"
                class="w-full h-10 px-3 font-heading text-xl text-center text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                @input="handleChildrenInput"
                @blur="handleChildrenInput"
              />
            </div>
            <button
              type="button"
              :disabled="isSubmitting || numberOfChildren >= 5"
              class="w-10 h-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg flex items-center justify-center transition-colors hover:bg-sand dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              @click="numberOfChildren = Math.min(5, numberOfChildren + 1)"
            >
              <svg
                class="w-5 h-5 text-charcoal dark:text-dark-text"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <p
            class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary italic"
          >
            {{ adminT.rsvps.childrenAgeNote }}
          </p>
        </div>

        <!-- Total -->
        <p class="font-body text-sm text-charcoal dark:text-dark-text text-center font-medium">
          {{ adminT.rsvps.totalGuests }}: {{ totalGuests }}
        </p>
      </div>
    </Transition>

    <!-- Guest Type - Optional -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
        {{ adminT.rsvps.guestTypeLabelOptional }}
      </label>
      <select
        v-model="guestType"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50"
      >
        <option value="">{{ adminT.rsvps.noGuestType }}</option>
        <option v-for="type in GUEST_TYPES" :key="type" :value="type">
          {{ adminT.rsvps.guestTypes[type] }}
        </option>
      </select>
    </div>

    <!-- Message - Optional -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
        {{ adminT.rsvps.messageOptional }}
      </label>
      <textarea
        v-model="message"
        rows="3"
        maxlength="500"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50 resize-none"
        :placeholder="adminT.rsvps.wishesPlaceholder"
      ></textarea>
      <p
        class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-right"
      >
        {{ message.length }}/500
      </p>
    </div>

    <!-- Keyboard shortcut hint - hidden on mobile -->
    <p
      class="hidden sm:block text-xs text-charcoal-light dark:text-dark-text-secondary text-center pt-2"
    >
      {{ adminT.rsvps.pressEscToClose }}
    </p>
  </BaseFormModal>
</template>
