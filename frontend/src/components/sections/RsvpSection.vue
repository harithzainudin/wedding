<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import type { RsvpFormData, AnyGuestType } from '@/types/rsvp'
  import { GUEST_TYPES, COMBINED_GUEST_TYPES } from '@/types/rsvp'
  import type { WeddingType } from '@/types/weddingDetails'
  import { HONORIFIC_TITLES } from '@/types'
  import { submitRsvp } from '@/services/api'
  import { useLanguage } from '@/composables/useLanguage'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'

  // Visibility is now controlled by Design Tab's section settings
  // This component only checks isAcceptingRsvps (functional toggle)
  const props = withDefaults(
    defineProps<{
      isAcceptingRsvps?: boolean
      rsvpDeadline?: string
      weddingType?: WeddingType
    }>(),
    {
      isAcceptingRsvps: true,
      weddingType: 'single_side',
    }
  )

  const { t } = useLanguage()
  const { currentWeddingSlug, weddingDetails } = usePublicWeddingData()

  // Get wedding type from loaded wedding details (fallback to prop for backward compatibility)
  const effectiveWeddingType = computed(() => {
    return weddingDetails.value?.weddingType ?? props.weddingType ?? 'single_side'
  })

  // Format the deadline for display
  const formattedDeadline = computed(() => {
    if (!props.rsvpDeadline) return null
    const date = new Date(props.rsvpDeadline)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  const adultOptions = [1, 2, 3, 4, 5]
  const childrenOptions = [0, 1, 2, 3, 4, 5]

  const formData = reactive<RsvpFormData>({
    title: 'Encik',
    fullName: '',
    isAttending: 'yes',
    numberOfAdults: 1,
    numberOfChildren: 0,
    phoneNumber: '',
    message: '',
  })

  // Show guest count section for 'yes' and 'maybe' responses
  const showGuestCount = computed(() => {
    return formData.isAttending === 'yes' || formData.isAttending === 'maybe'
  })

  // Get the appropriate hint message based on attendance status
  const guestCountHint = computed(() => {
    if (formData.isAttending === 'yes') return t.value.rsvp.guestCountHintYes
    if (formData.isAttending === 'maybe') return t.value.rsvp.guestCountHintMaybe
    return ''
  })

  // Computed total guests for display
  const totalGuests = computed(() => formData.numberOfAdults + formData.numberOfChildren)

  // Computed guest type options based on wedding type
  const guestTypeOptions = computed(() => {
    if (effectiveWeddingType.value === 'combined') {
      return COMBINED_GUEST_TYPES
    }
    return GUEST_TYPES
  })

  // Get translation key for guest type
  const getGuestTypeLabel = (guestType: AnyGuestType): string => {
    const key = guestType as keyof typeof t.value.rsvp.guestTypes
    return t.value.rsvp.guestTypes[key] || guestType
  }

  const isSubmitting = ref(false)
  const isSubmitted = ref(false)
  const errorMessage = ref('')
  const phoneBlurred = ref(false)

  // Phone number validation - matches backend regex
  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return false
    // Remove common formatting characters: spaces, dashes, parentheses, dots
    const cleanPhone = phone.replace(/[-\s().]/g, '')
    // Accept international formats: +{country code}{number} or local formats starting with 0
    // Minimum 7 digits (local), maximum 15 digits (E.164 standard)
    const phoneRegex = /^(\+?[1-9]\d{6,14}|0[1-9]\d{6,12})$/
    return phoneRegex.test(cleanPhone)
  }

  // Computed phone validation state
  const phoneValidation = computed(() => {
    const phone = formData.phoneNumber
    if (!phone.trim()) {
      return { isEmpty: true, isValid: false }
    }
    return { isEmpty: false, isValid: validatePhone(phone) }
  })

  // Show phone error only after user has interacted with the field
  const showPhoneError = computed(() => {
    return phoneBlurred.value && !phoneValidation.value.isEmpty && !phoneValidation.value.isValid
  })

  const handleSubmit = async (): Promise<void> => {
    errorMessage.value = ''

    // Basic validation
    if (!formData.fullName.trim()) {
      errorMessage.value = t.value.rsvp.errorName
      return
    }

    if (!formData.phoneNumber.trim()) {
      errorMessage.value = t.value.rsvp.errorPhone
      return
    }

    // Validate phone format
    if (!validatePhone(formData.phoneNumber)) {
      errorMessage.value = t.value.rsvp.errorPhoneInvalid
      return
    }

    isSubmitting.value = true

    try {
      await submitRsvp(formData, currentWeddingSlug.value ?? undefined)
      isSubmitted.value = true
    } catch {
      errorMessage.value = t.value.rsvp.errorGeneric
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <section
    id="rsvp"
    class="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-dark-bg-secondary transition-colors duration-300"
  >
    <div class="max-w-md mx-auto">
      <h2
        class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark dark:text-sage-light mb-1 sm:mb-2"
      >
        {{ t.rsvp.title }}
      </h2>
      <p
        class="font-body text-sm sm:text-base text-center text-charcoal-light dark:text-dark-text-secondary mb-6 sm:mb-8"
      >
        {{ t.rsvp.subtitle }}
      </p>

      <!-- RSVP Closed Message (only checks functional isAcceptingRsvps toggle) -->
      <div v-if="!isAcceptingRsvps" class="text-center p-6 sm:p-8">
        <div
          class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl text-charcoal-light dark:text-dark-text-secondary bg-sand dark:bg-dark-bg-elevated rounded-full"
        >
          <svg
            class="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h3 class="font-heading text-xl sm:text-2xl text-charcoal-dark dark:text-dark-text mb-2">
          {{ t.rsvp.rsvpClosed }}
        </h3>
        <p
          class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-3 sm:mb-4"
        >
          {{ t.rsvp.rsvpClosedMessage }}
        </p>
        <p
          v-if="formattedDeadline"
          class="font-body text-xs sm:text-sm italic text-charcoal-light dark:text-dark-text-secondary p-3 sm:p-4 bg-sand dark:bg-dark-bg-elevated rounded-lg"
        >
          {{ t.rsvp.rsvpClosedDeadline }} {{ formattedDeadline }}
        </p>
      </div>

      <!-- Success Message -->
      <div v-else-if="isSubmitted" class="text-center p-6 sm:p-8">
        <div
          class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl text-white bg-sage rounded-full"
        >
          ✓
        </div>
        <h3 class="font-heading text-xl sm:text-2xl text-sage-dark dark:text-sage-light mb-2">
          {{ t.rsvp.thankYou }}
        </h3>
        <p
          class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-3 sm:mb-4"
        >
          {{ t.rsvp.responseReceived }}
        </p>
        <p
          class="font-body text-xs sm:text-sm italic text-charcoal-light dark:text-dark-text-secondary p-3 sm:p-4 bg-sand dark:bg-dark-bg-elevated rounded-lg"
        >
          {{ t.rsvp.prayer }}
        </p>
      </div>

      <!-- RSVP Form -->
      <form v-else class="space-y-4 sm:space-y-5" @submit.prevent="handleSubmit">
        <!-- Title & Name - Stack on mobile -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="w-full sm:w-28">
            <label
              for="title"
              class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
            >
              {{ t.rsvp.titleLabel }}
            </label>
            <select
              id="title"
              v-model="formData.title"
              class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
            >
              <option v-for="title in HONORIFIC_TITLES" :key="title" :value="title">
                {{ title }}
              </option>
            </select>
          </div>

          <div class="flex-1">
            <label
              for="fullName"
              class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
            >
              {{ t.rsvp.fullName }} *
            </label>
            <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
              :placeholder="t.rsvp.fullNamePlaceholder"
              required
            />
          </div>
        </div>

        <!-- Attendance -->
        <div>
          <label
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-2"
          >
            {{ t.rsvp.attendance }} *
          </label>
          <div class="space-y-2">
            <!-- Yes, I will attend -->
            <label
              class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
              :class="
                formData.isAttending === 'yes'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-sand-dark dark:border-dark-border hover:border-green-300 dark:hover:border-green-700'
              "
            >
              <input
                v-model="formData.isAttending"
                type="radio"
                value="yes"
                class="w-4 h-4 accent-green-600"
              />
              <div class="flex items-center gap-2">
                <span class="text-green-600 dark:text-green-400 text-lg">✓</span>
                <span class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text">
                  {{ t.rsvp.attending }}
                </span>
              </div>
            </label>

            <!-- Maybe, I'm not sure yet -->
            <label
              class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
              :class="
                formData.isAttending === 'maybe'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-sand-dark dark:border-dark-border hover:border-amber-300 dark:hover:border-amber-700'
              "
            >
              <input
                v-model="formData.isAttending"
                type="radio"
                value="maybe"
                class="w-4 h-4 accent-amber-600"
              />
              <div class="flex items-center gap-2">
                <span class="text-amber-600 dark:text-amber-400 text-lg">?</span>
                <span class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text">
                  {{ t.rsvp.maybe }}
                </span>
              </div>
            </label>

            <!-- Sorry, I cannot attend -->
            <label
              class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all"
              :class="
                formData.isAttending === 'no'
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'border-sand-dark dark:border-dark-border hover:border-red-300 dark:hover:border-red-700'
              "
            >
              <input
                v-model="formData.isAttending"
                type="radio"
                value="no"
                class="w-4 h-4 accent-red-500"
              />
              <div class="flex items-center gap-2">
                <span class="text-red-500 dark:text-red-400 text-lg">✗</span>
                <span class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text">
                  {{ t.rsvp.notAttending }}
                </span>
              </div>
            </label>
          </div>
        </div>

        <!-- Number of Guests (shown for 'yes' and 'maybe' responses) -->
        <div v-if="showGuestCount" class="space-y-3">
          <!-- Warm hint message -->
          <p
            class="font-body text-xs sm:text-sm text-center p-3 rounded-lg"
            :class="
              formData.isAttending === 'yes'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
            "
          >
            {{ guestCountHint }}
          </p>

          <!-- Adults and Children in a row -->
          <div class="flex gap-3">
            <!-- Number of Adults -->
            <div class="flex-1">
              <label
                for="numberOfAdults"
                class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
              >
                {{ t.rsvp.numberOfAdults }} *
              </label>
              <select
                id="numberOfAdults"
                v-model="formData.numberOfAdults"
                class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              >
                <option v-for="num in adultOptions" :key="num" :value="num">
                  {{ num }}
                </option>
              </select>
            </div>

            <!-- Number of Children -->
            <div class="flex-1">
              <label
                for="numberOfChildren"
                class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
              >
                {{ t.rsvp.numberOfChildren }}
              </label>
              <select
                id="numberOfChildren"
                v-model="formData.numberOfChildren"
                class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              >
                <option v-for="num in childrenOptions" :key="num" :value="num">
                  {{ num }}
                </option>
              </select>
            </div>
          </div>

          <!-- Helper text and total -->
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-charcoal-light dark:text-dark-text-secondary"
          >
            <p class="font-body italic">{{ t.rsvp.childrenAgeNote }}</p>
            <p class="font-body font-medium">
              {{ t.rsvp.totalGuests }}: {{ totalGuests }} {{ t.rsvp.guestUnit }}
            </p>
          </div>
        </div>

        <!-- Phone Number -->
        <div>
          <label
            for="phoneNumber"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ t.rsvp.phoneNumber }} *
          </label>
          <input
            id="phoneNumber"
            v-model="formData.phoneNumber"
            type="tel"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60 transition-colors"
            :class="
              showPhoneError
                ? 'border-red-500 focus:border-red-500'
                : 'border-sand-dark dark:border-dark-border focus:border-sage'
            "
            :placeholder="t.rsvp.phonePlaceholder"
            required
            @blur="phoneBlurred = true"
          />
          <!-- Inline phone validation error -->
          <p v-if="showPhoneError" class="mt-1 font-body text-xs text-red-600 dark:text-red-400">
            {{ t.rsvp.errorPhoneInvalid }}
          </p>
        </div>

        <!-- Guest Type (Relationship) - Optional -->
        <div>
          <label
            for="guestType"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ t.rsvp.guestTypeLabel }}
          </label>
          <!-- Single side: simple dropdown with helper text -->
          <select
            v-if="effectiveWeddingType === 'single_side'"
            id="guestType"
            v-model="formData.guestType"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          >
            <option value="">{{ t.rsvp.selectGuestType }}</option>
            <option v-for="gType in guestTypeOptions" :key="gType" :value="gType">
              {{ getGuestTypeLabel(gType) }}
            </option>
          </select>
          <!-- Combined: grouped dropdown -->
          <select
            v-else
            id="guestType"
            v-model="formData.guestType"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          >
            <option value="">{{ t.rsvp.selectGuestType }}</option>
            <optgroup :label="t.rsvp.guestTypeGroups.brideSide">
              <option value="bride_father_guest">
                {{ t.rsvp.guestTypes.bride_father_guest }}
              </option>
              <option value="bride_mother_guest">
                {{ t.rsvp.guestTypes.bride_mother_guest }}
              </option>
              <option value="bride_both_parents_guest">
                {{ t.rsvp.guestTypes.bride_both_parents_guest }}
              </option>
              <option value="bride_father_relative">
                {{ t.rsvp.guestTypes.bride_father_relative }}
              </option>
              <option value="bride_mother_relative">
                {{ t.rsvp.guestTypes.bride_mother_relative }}
              </option>
              <option value="bride_friend">{{ t.rsvp.guestTypes.bride_friend }}</option>
              <option value="bride_colleague">{{ t.rsvp.guestTypes.bride_colleague }}</option>
            </optgroup>
            <optgroup :label="t.rsvp.guestTypeGroups.groomSide">
              <option value="groom_father_guest">
                {{ t.rsvp.guestTypes.groom_father_guest }}
              </option>
              <option value="groom_mother_guest">
                {{ t.rsvp.guestTypes.groom_mother_guest }}
              </option>
              <option value="groom_both_parents_guest">
                {{ t.rsvp.guestTypes.groom_both_parents_guest }}
              </option>
              <option value="groom_father_relative">
                {{ t.rsvp.guestTypes.groom_father_relative }}
              </option>
              <option value="groom_mother_relative">
                {{ t.rsvp.guestTypes.groom_mother_relative }}
              </option>
              <option value="groom_friend">{{ t.rsvp.guestTypes.groom_friend }}</option>
              <option value="groom_colleague">{{ t.rsvp.guestTypes.groom_colleague }}</option>
            </optgroup>
            <optgroup :label="t.rsvp.guestTypeGroups.both">
              <option value="mutual_friend">{{ t.rsvp.guestTypes.mutual_friend }}</option>
              <option value="other">{{ t.rsvp.guestTypes.other }}</option>
            </optgroup>
          </select>
        </div>

        <!-- Message -->
        <div>
          <label
            for="message"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ t.rsvp.message }}
          </label>
          <textarea
            id="message"
            v-model="formData.message"
            rows="3"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage resize-none placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
            :placeholder="t.rsvp.messagePlaceholder"
          ></textarea>
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-red-600 font-body text-xs sm:text-sm text-center">
          {{ errorMessage }}
        </p>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 px-6 font-body text-sm sm:text-base font-medium text-white bg-sage rounded-lg cursor-pointer transition-colors hover:bg-sage-dark active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? t.rsvp.submitting : t.rsvp.submit }}
        </button>
      </form>

      <!-- Spacer for sticky nav -->
      <div class="h-20"></div>
    </div>
  </section>
</template>
