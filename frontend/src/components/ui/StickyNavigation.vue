<script setup lang="ts">
import { weddingConfig } from "@/config/wedding";
import { generateGoogleCalendarUrl } from "@/composables/useCalendar";
import { useLanguage } from "@/composables/useLanguage";
import { useVenueConfig } from "@/composables/useVenueConfig";

const { t } = useLanguage();
const { venue } = useVenueConfig();

const openGoogleMaps = (): void => {
  window.open(venue.value.googleMapsUrl, "_blank");
};

const openWaze = (): void => {
  window.open(venue.value.wazeUrl, "_blank");
};

const addToCalendar = (): void => {
  const url = generateGoogleCalendarUrl(weddingConfig);
  window.open(url, "_blank");
};

const scrollToRsvp = (): void => {
  const rsvpSection = document.getElementById("rsvp");
  if (rsvpSection) {
    rsvpSection.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary border-t border-sand-dark dark:border-dark-border p-3 z-50 shadow-[0_-4px_6px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_rgba(0,0,0,0.3)] transition-colors duration-300"
  >
    <div class="flex justify-around items-center max-w-md mx-auto">
      <!-- Google Maps -->
      <button
        type="button"
        class="flex flex-col items-center gap-1 p-2 bg-transparent border-none text-charcoal dark:text-dark-text cursor-pointer font-body text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-sage dark:hover:text-sage-light"
        aria-label="Open Google Maps"
        @click="openGoogleMaps"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          />
        </svg>
        <span>{{ t.nav.maps }}</span>
      </button>

      <!-- Waze -->
      <button
        type="button"
        class="flex flex-col items-center gap-1 p-2 bg-transparent border-none text-charcoal dark:text-dark-text cursor-pointer font-body text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-sage dark:hover:text-sage-light"
        aria-label="Open Waze"
        @click="openWaze"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        </svg>
        <span>{{ t.nav.waze }}</span>
      </button>

      <!-- Calendar -->
      <button
        type="button"
        class="flex flex-col items-center gap-1 p-2 bg-transparent border-none text-charcoal dark:text-dark-text cursor-pointer font-body text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-sage dark:hover:text-sage-light"
        aria-label="Add to Calendar"
        @click="addToCalendar"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
          />
        </svg>
        <span>{{ t.nav.calendar }}</span>
      </button>

      <!-- RSVP Button -->
      <button
        type="button"
        class="flex items-center gap-1 px-4 py-2 bg-sage text-white rounded-full font-body text-xs font-medium uppercase tracking-wider transition-colors hover:bg-sage-dark cursor-pointer"
        @click="scrollToRsvp"
      >
        RSVP
      </button>
    </div>
  </nav>
</template>
