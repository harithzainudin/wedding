<script setup lang="ts">
import { weddingConfig } from "@/config/wedding";
import { generateGoogleCalendarUrl } from "@/composables/useCalendar";
import { useLanguage } from "@/composables/useLanguage";
import { useVenueConfig } from "@/composables/useVenueConfig";
import { usePublicWeddingData } from "@/composables/usePublicWeddingData";

const { t } = useLanguage();
const { venue } = useVenueConfig();
const { getDisplayNameOrder } = usePublicWeddingData();

const openGoogleMaps = (): void => {
  window.open(venue.value.googleMapsUrl, "_blank");
};

const openWaze = (): void => {
  window.open(venue.value.wazeUrl, "_blank");
};

const addToCalendar = (): void => {
  const url = generateGoogleCalendarUrl(weddingConfig, getDisplayNameOrder());
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
          <path d="M12 2C6.5 2 2 6.5 2 12c0 2.6 1 5 2.7 6.8-.2.7-.6 1.8-1.3 3.2 2.1-.5 3.7-1.1 4.7-1.5.9.3 2 .5 3.1.5h.8c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-.9 0-1.8-.1-2.6-.4l-.5-.2-.5.2c-.6.2-1.5.5-2.7.9.4-.8.7-1.5.8-2l.2-.6-.4-.5C5 15.8 4 13.9 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"/>
          <circle cx="8.5" cy="11" r="1.5"/>
          <circle cx="15.5" cy="11" r="1.5"/>
          <path d="M12 17c2 0 3.7-1.2 4.5-3h-9c.8 1.8 2.5 3 4.5 3z"/>
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
