<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  venueName: string;
  address: string;
  parkingInfo: string;
  coordinates: { lat: number; lng: number };
  isSaving: boolean;
  hasChanges: boolean;
}>();

const emit = defineEmits<{
  "update:venueName": [value: string];
  "update:address": [value: string];
  "update:parkingInfo": [value: string];
  save: [];
  cancel: [];
}>();

// Form validation
const isValid = computed(() => {
  return props.venueName.trim().length > 0 && props.address.trim().length > 0;
});

const canSave = computed(() => {
  return isValid.value && props.hasChanges && !props.isSaving;
});
</script>

<template>
  <div class="space-y-4">
    <!-- Venue Name -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
        Venue Name <span class="text-red-500">*</span>
      </label>
      <input
        :value="venueName"
        type="text"
        maxlength="100"
        placeholder="e.g., Dewan Seri Endon"
        :disabled="isSaving"
        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50"
        @input="emit('update:venueName', ($event.target as HTMLInputElement).value)"
      />
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ venueName.length }}/100 characters
      </p>
    </div>

    <!-- Address -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
        Address <span class="text-red-500">*</span>
      </label>
      <textarea
        :value="address"
        rows="3"
        maxlength="500"
        placeholder="Full venue address"
        :disabled="isSaving"
        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 resize-none"
        @input="emit('update:address', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ address.length }}/500 characters
      </p>
    </div>

    <!-- Parking Info -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
        Parking Information
        <span class="text-charcoal-light dark:text-dark-text-secondary font-normal">(optional)</span>
      </label>
      <textarea
        :value="parkingInfo"
        rows="2"
        maxlength="500"
        placeholder="Parking instructions for guests"
        :disabled="isSaving"
        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 resize-none"
        @input="emit('update:parkingInfo', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ parkingInfo.length }}/500 characters
      </p>
    </div>

    <!-- Coordinates Display -->
    <div class="p-3 bg-sand/50 dark:bg-dark-bg-elevated rounded-lg">
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
        Coordinates (from map)
      </p>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">Latitude:</span>
          <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium">
            {{ coordinates.lat.toFixed(6) }}
          </p>
        </div>
        <div>
          <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">Longitude:</span>
          <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium">
            {{ coordinates.lng.toFixed(6) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button
        v-if="hasChanges"
        type="button"
        class="flex-1 py-3 rounded-lg font-body text-sm font-medium text-charcoal border border-charcoal-light hover:bg-sand-dark transition-colors cursor-pointer"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        :disabled="!canSave"
        class="flex-1 py-3 rounded-lg font-body text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        :class="
          canSave
            ? 'bg-sage text-white hover:bg-sage-dark cursor-pointer'
            : 'bg-sand-dark dark:bg-dark-border text-charcoal-light dark:text-dark-text-secondary cursor-not-allowed'
        "
        @click="emit('save')"
      >
        <svg
          v-if="isSaving"
          class="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
            class="opacity-25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            class="opacity-75"
          />
        </svg>
        <span>{{ isSaving ? "Saving..." : "Save Changes" }}</span>
      </button>
    </div>

    <!-- Validation Message -->
    <p v-if="!isValid && (venueName.length > 0 || address.length > 0)" class="font-body text-xs text-red-500 text-center">
      Please fill in all required fields
    </p>
  </div>
</template>
