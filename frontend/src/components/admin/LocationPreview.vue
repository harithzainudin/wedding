<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  venueName: string;
  address: string;
  parkingInfo: string;
  googleMapsUrl: string;
  wazeUrl: string;
}>();

const hasContent = computed(() => {
  return props.venueName.trim().length > 0 || props.address.trim().length > 0;
});

const openLink = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};
</script>

<template>
  <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-sand/50 dark:bg-dark-bg-elevated border-b border-sand-dark dark:border-dark-border">
      <h4 class="font-heading text-sm font-medium text-charcoal dark:text-dark-text">
        Preview
      </h4>
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5">
        How guests will see the venue
      </p>
    </div>

    <!-- Preview Content -->
    <div class="p-4 space-y-4">
      <div v-if="hasContent">
        <!-- Venue Name -->
        <div v-if="venueName.trim()">
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">Venue</p>
          <p class="font-heading text-base text-charcoal dark:text-dark-text">
            {{ venueName }}
          </p>
        </div>

        <!-- Address -->
        <div v-if="address.trim()">
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">Address</p>
          <p class="font-body text-sm text-charcoal dark:text-dark-text whitespace-pre-line">
            {{ address }}
          </p>
        </div>

        <!-- Parking Info -->
        <div v-if="parkingInfo.trim()">
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">Parking</p>
          <p class="font-body text-sm text-charcoal dark:text-dark-text whitespace-pre-line">
            {{ parkingInfo }}
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-4">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          Enter venue details to see preview
        </p>
      </div>

      <!-- Navigation Buttons -->
      <div class="pt-3 border-t border-sand-dark/50 dark:border-dark-border/50 space-y-2">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
          Test navigation links:
        </p>

        <div class="flex gap-2">
          <!-- Google Maps Button -->
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors"
            @click="openLink(googleMapsUrl)"
          >
            <svg class="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="font-body text-xs font-medium text-charcoal dark:text-dark-text">Maps</span>
            <svg class="w-3 h-3 text-charcoal-light dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          <!-- Waze Button -->
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors"
            @click="openLink(wazeUrl)"
          >
            <svg class="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.54 6.63c-.52-.93-1.2-1.76-2-2.47A9.48 9.48 0 0012 2C6.48 2 2 6.48 2 12c0 2.04.61 3.93 1.66 5.51L2 22l4.49-1.66C8.07 21.39 9.96 22 12 22c5.52 0 10-4.48 10-10 0-1.56-.36-3.04-1-4.37l-.46-1zm-8.54 12.37c-1.64 0-3.18-.45-4.49-1.24l-.32-.19-3.33 1.23 1.08-3.22-.21-.34a7.96 7.96 0 01-1.23-4.24c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="8.5" cy="10.5" r="1.5"/>
              <circle cx="15.5" cy="10.5" r="1.5"/>
              <path d="M12 16c1.5 0 2.75-.9 3.3-2.2H8.7c.55 1.3 1.8 2.2 3.3 2.2z"/>
            </svg>
            <span class="font-body text-xs font-medium text-charcoal dark:text-dark-text">Waze</span>
            <svg class="w-3 h-3 text-charcoal-light dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        <!-- URL Preview -->
        <div class="mt-3 space-y-1">
          <div class="flex items-start gap-2">
            <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary shrink-0">Maps:</span>
            <p class="font-body text-xs text-sage break-all">{{ googleMapsUrl }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary shrink-0">Waze:</span>
            <p class="font-body text-xs text-sage break-all">{{ wazeUrl }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
