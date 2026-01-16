<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import type { RsvpSubmission, AdminRsvpRequest } from "@/types/rsvp";
import type { HonorificTitle } from "@/types/index";
import { HONORIFIC_TITLES } from "@/types/index";
import BaseFormModal from "./BaseFormModal.vue";

const props = defineProps<{
  show: boolean;
  rsvp?: RsvpSubmission;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: AdminRsvpRequest];
}>();

// Template refs
const nameInputRef = ref<HTMLInputElement | null>(null);

// Form state
const title = ref<HonorificTitle | "">("");
const fullName = ref("");
const isAttending = ref(true);
const numberOfGuests = ref(1);
const message = ref("");

// Computed
const isEditMode = computed(() => !!props.rsvp);
const modalTitle = computed(() => (isEditMode.value ? "Edit Guest" : "Add Guest"));
const submitText = computed(() => {
  if (props.isSubmitting) return "Saving...";
  return isEditMode.value ? "Update" : "Add Guest";
});

const isValid = computed(() => {
  return fullName.value.trim().length >= 2;
});

// Handle escape key to close modal
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.show && !props.isSubmitting) {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// Reset/populate form when modal opens or rsvp changes
watch(
  () => [props.show, props.rsvp],
  async () => {
    if (props.show && props.rsvp) {
      // Edit mode: populate from existing
      title.value = props.rsvp.title || "";
      fullName.value = props.rsvp.fullName;
      isAttending.value = props.rsvp.isAttending;
      numberOfGuests.value = props.rsvp.numberOfGuests || 1;
      message.value = props.rsvp.message || "";
    } else if (props.show) {
      // Create mode: reset to defaults
      title.value = "";
      fullName.value = "";
      isAttending.value = true;
      numberOfGuests.value = 1;
      message.value = "";
    }

    // Auto-focus name input when modal opens
    if (props.show) {
      await nextTick();
      nameInputRef.value?.focus();
    }
  },
  { immediate: true }
);

// Handle submit
const handleSubmit = () => {
  if (!isValid.value || props.isSubmitting) return;

  const data: AdminRsvpRequest = {
    fullName: fullName.value.trim(),
    isAttending: isAttending.value,
    numberOfGuests: isAttending.value ? numberOfGuests.value : 0,
  };

  if (title.value) {
    data.title = title.value;
  }

  if (message.value.trim()) {
    data.message = message.value.trim();
  }

  emit("submit", data);
};

// Toggle attendance
const setAttending = (value: boolean) => {
  if (props.isSubmitting) return;
  isAttending.value = value;
};

// Handle guest count input
const handleGuestInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  let value = parseInt(target.value, 10);

  // Clamp value between 1 and 10
  if (isNaN(value) || value < 1) {
    value = 1;
  } else if (value > 10) {
    value = 10;
  }

  numberOfGuests.value = value;
};
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
        Title (Optional)
      </label>
      <select
        v-model="title"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50"
      >
        <option value="">-- No Title --</option>
        <option v-for="t in HONORIFIC_TITLES" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Full Name - Required -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
        Full Name <span class="text-red-500">*</span>
      </label>
      <input
        ref="nameInputRef"
        v-model="fullName"
        type="text"
        required
        minlength="2"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50"
        placeholder="Enter full name"
      />
      <p v-if="fullName && fullName.trim().length < 2" class="mt-1 font-body text-xs text-red-500">
        Name must be at least 2 characters
      </p>
    </div>

    <!-- Attendance Status - Visual Toggle -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-2">
        Attendance
      </label>
      <div class="flex rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border">
        <button
          type="button"
          :disabled="isSubmitting"
          class="flex-1 px-4 py-2.5 font-body text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          :class="
            isAttending
              ? 'bg-green-600 text-white shadow-inner'
              : 'bg-white dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-green-50 dark:hover:bg-green-900/20'
          "
          @click="setAttending(true)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Attending
        </button>
        <button
          type="button"
          :disabled="isSubmitting"
          class="flex-1 px-4 py-2.5 font-body text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 border-l border-sand-dark dark:border-dark-border"
          :class="
            !isAttending
              ? 'bg-red-600 text-white shadow-inner'
              : 'bg-white dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-red-50 dark:hover:bg-red-900/20'
          "
          @click="setAttending(false)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Not Attending
        </button>
      </div>
    </div>

    <!-- Number of Guests - With smooth transition -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-32"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 max-h-32"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <div v-if="isAttending" class="overflow-hidden">
        <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
          Number of Guests
        </label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="isSubmitting || numberOfGuests <= 1"
            class="w-10 h-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg flex items-center justify-center transition-colors hover:bg-sand dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            @click="numberOfGuests = Math.max(1, numberOfGuests - 1)"
          >
            <svg class="w-5 h-5 text-charcoal dark:text-dark-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div class="flex-1 relative">
            <input
              type="number"
              :value="numberOfGuests"
              min="1"
              max="10"
              :disabled="isSubmitting"
              class="w-full h-10 px-3 font-heading text-xl text-center text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              @input="handleGuestInput"
              @blur="handleGuestInput"
            />
          </div>
          <button
            type="button"
            :disabled="isSubmitting || numberOfGuests >= 10"
            class="w-10 h-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg flex items-center justify-center transition-colors hover:bg-sand dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            @click="numberOfGuests = Math.min(10, numberOfGuests + 1)"
          >
            <svg class="w-5 h-5 text-charcoal dark:text-dark-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
        <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-center">
          Enter 1-10 guests
        </p>
      </div>
    </Transition>

    <!-- Message - Optional -->
    <div>
      <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
        Message (Optional)
      </label>
      <textarea
        v-model="message"
        rows="3"
        maxlength="500"
        :disabled="isSubmitting"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-sage/50 dark:text-dark-text disabled:opacity-50 resize-none"
        placeholder="Any wishes or notes..."
      ></textarea>
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-right">
        {{ message.length }}/500
      </p>
    </div>

    <!-- Keyboard shortcut hint - hidden on mobile -->
    <p class="hidden sm:block text-xs text-charcoal-light dark:text-dark-text-secondary text-center pt-2">
      Press <kbd class="px-1.5 py-0.5 bg-sand dark:bg-dark-border rounded text-xs font-mono">Esc</kbd> to close
    </p>
  </BaseFormModal>
</template>
