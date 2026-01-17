<script setup lang="ts">
  import { computed } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    venueName: string
    address: string
    parkingInfo: string
    coordinates: { lat: number; lng: number }
    isSaving: boolean
  }>()

  const emit = defineEmits<{
    'update:venueName': [value: string]
    'update:address': [value: string]
    'update:parkingInfo': [value: string]
  }>()

  // Form validation
  const isValid = computed(() => {
    return props.venueName.trim().length > 0 && props.address.trim().length > 0
  })
</script>

<template>
  <div class="space-y-4">
    <!-- Venue Name -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
        {{ adminT.venue.venueName }} <span class="text-red-500">{{ adminT.venue.required }}</span>
      </label>
      <input
        :value="venueName"
        type="text"
        maxlength="100"
        :placeholder="adminT.venue.venueNamePlaceholder"
        :disabled="isSaving"
        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50"
        @input="emit('update:venueName', ($event.target as HTMLInputElement).value)"
      />
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.venue.characters.replace('{count}', String(venueName.length)).replace('{max}', '100') }}
      </p>
    </div>

    <!-- Address -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
        {{ adminT.venue.address }} <span class="text-red-500">{{ adminT.venue.required }}</span>
      </label>
      <textarea
        :value="address"
        rows="3"
        maxlength="500"
        :placeholder="adminT.venue.addressPlaceholder"
        :disabled="isSaving"
        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 resize-none"
        @input="emit('update:address', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.venue.characters.replace('{count}', String(address.length)).replace('{max}', '500') }}
      </p>
    </div>

    <!-- Parking Info -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
        {{ adminT.venue.parkingInfo }}
        <span class="text-charcoal-light dark:text-dark-text-secondary font-normal">{{
          adminT.venue.optional
        }}</span>
      </label>
      <textarea
        :value="parkingInfo"
        rows="2"
        maxlength="500"
        :placeholder="adminT.venue.parkingInfoPlaceholder"
        :disabled="isSaving"
        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 resize-none"
        @input="emit('update:parkingInfo', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.venue.characters.replace('{count}', String(parkingInfo.length)).replace('{max}', '500') }}
      </p>
    </div>

    <!-- Coordinates Display -->
    <div class="p-3 bg-sand/50 dark:bg-dark-bg-elevated rounded-lg">
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
        {{ adminT.venue.coordinatesFromMap }}
      </p>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
            >{{ adminT.venue.latitude }}:</span
          >
          <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium">
            {{ coordinates.lat.toFixed(6) }}
          </p>
        </div>
        <div>
          <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
            >{{ adminT.venue.longitude }}:</span
          >
          <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium">
            {{ coordinates.lng.toFixed(6) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Validation Message -->
    <p
      v-if="!isValid && (venueName.length > 0 || address.length > 0)"
      class="font-body text-xs text-red-500 text-center"
    >
      {{ adminT.venue.fillRequiredFields }}
    </p>
  </div>
</template>
