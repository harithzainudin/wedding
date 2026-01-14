<script setup lang="ts">
import { computed, ref } from "vue";
import { useLanguage } from "@/composables/useLanguage";
import { useVenueConfig } from "@/composables/useVenueConfig";
import { usePublicWeddingData } from "@/composables/usePublicWeddingData";
import { useNameOrder } from "@/composables/useNameOrder";
import type { EventDisplayPreset, EventDisplayCustomOptions } from "@/types/weddingDetails";

const { t, currentLanguage } = useLanguage();
const { venue } = useVenueConfig();
const { getEventDate, getEventEndTime, getEventDisplayFormat, getDressCode, getHashtag } = usePublicWeddingData();
const { orderedCouple, orderedParents } = useNameOrder();

const localeMap: Record<string, string> = {
  ms: "ms-MY",
  en: "en-MY",
  zh: "zh-CN",
  ta: "ta-MY",
};

const couple = computed(() => orderedCouple.value);
const parents = computed(() => orderedParents.value);
const eventDate = computed(() => getEventDate());
const eventEndTime = computed(() => getEventEndTime());
const displayFormat = computed(() => getEventDisplayFormat());
const dressCode = computed(() => getDressCode());
const hashtag = computed(() => getHashtag());

// Get display options for a preset
function getOptionsForPreset(preset: EventDisplayPreset): EventDisplayCustomOptions {
  switch (preset) {
    case "date_time_range":
      return { showDate: true, showStartTime: true, showEndTime: true, showDayOfWeek: true, timeFormat: "12h" };
    case "date_start_only":
      return { showDate: true, showStartTime: true, showEndTime: false, showDayOfWeek: true, timeFormat: "12h" };
    case "date_only":
      return { showDate: true, showStartTime: false, showEndTime: false, showDayOfWeek: true, timeFormat: "12h" };
    case "full_details":
      return { showDate: true, showStartTime: true, showEndTime: true, showDayOfWeek: true, timeFormat: "12h" };
    case "custom":
    default:
      return displayFormat.value.customOptions;
  }
}

// Get the effective display options
const effectiveOptions = computed(() => {
  const format = displayFormat.value;
  return format.preset === "custom" ? format.customOptions : getOptionsForPreset(format.preset);
});

// Check if we should show date
const shouldShowDate = computed(() => effectiveOptions.value.showDate);

// Check if we should show time
const shouldShowTime = computed(() => effectiveOptions.value.showStartTime || effectiveOptions.value.showEndTime);

// Check if using full details format
const isFullDetails = computed(() => displayFormat.value.preset === "full_details");

// Custom format parser - converts format strings like "DD/MM/YYYY" to formatted date
function formatDateWithPattern(date: Date, pattern: string): string {
  const locale = localeMap[currentLanguage.value] ?? "ms-MY";

  // Get localized month and day names
  const monthNames: string[] = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: "long" })
  );
  const dayNames: string[] = Array.from({ length: 7 }, (_, i) =>
    new Date(2000, 0, 2 + i).toLocaleDateString(locale, { weekday: "long" })
  );

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes();
  const ampm = hours24 >= 12 ? "PM" : "AM";

  const monthName = monthNames[month] ?? "Unknown";
  const dayName = dayNames[dayOfWeek] ?? "Unknown";

  return pattern
    .replace(/YYYY/g, String(year))
    .replace(/YY/g, String(year).slice(-2))
    .replace(/MMMM/g, monthName)
    .replace(/MMM/g, monthName.slice(0, 3))
    .replace(/MM/g, String(month + 1).padStart(2, "0"))
    .replace(/M(?!a)/g, String(month + 1))
    .replace(/dddd/g, dayName)
    .replace(/ddd/g, dayName.slice(0, 3))
    .replace(/DD/g, String(day).padStart(2, "0"))
    .replace(/D(?!e)/g, String(day))
    .replace(/HH/g, String(hours24).padStart(2, "0"))
    .replace(/H(?!o)/g, String(hours24))
    .replace(/hh/g, String(hours12).padStart(2, "0"))
    .replace(/h(?!o)/g, String(hours12))
    .replace(/mm/g, String(minutes).padStart(2, "0"))
    .replace(/m(?!b)/g, String(minutes))
    .replace(/A/g, ampm)
    .replace(/a/g, ampm.toLowerCase());
}

const formattedDate = computed(() => {
  if (!shouldShowDate.value) return "";
  const date = eventDate.value;
  const locale = localeMap[currentLanguage.value] ?? "ms-MY";
  const options = effectiveOptions.value;

  // Use custom format if provided
  if (displayFormat.value.preset === "custom" && options.customDateFormat) {
    return formatDateWithPattern(date, options.customDateFormat);
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  if (options.showDayOfWeek) {
    dateOptions.weekday = "long";
  }
  return date.toLocaleDateString(locale, dateOptions);
});

const formattedTime = computed(() => {
  if (!shouldShowTime.value) return "";

  const locale = localeMap[currentLanguage.value] ?? "ms-MY";
  const options = effectiveOptions.value;

  // Use custom time format if provided
  if (displayFormat.value.preset === "custom" && options.customTimeFormat) {
    const startTimeStr = formatDateWithPattern(eventDate.value, options.customTimeFormat);

    if (options.showEndTime && eventEndTime.value) {
      const endTimeStr = formatDateWithPattern(eventEndTime.value, options.customTimeFormat);
      return `${startTimeStr} - ${endTimeStr}`;
    }

    return options.showStartTime ? startTimeStr : "";
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.timeFormat === "12h",
  };

  const startTimeStr = eventDate.value.toLocaleTimeString(locale, timeOptions);

  // If showing end time and we have one
  if (options.showEndTime && eventEndTime.value) {
    const endTimeStr = eventEndTime.value.toLocaleTimeString(locale, timeOptions);
    return `${startTimeStr} - ${endTimeStr}`;
  }

  return options.showStartTime ? startTimeStr : "";
});

// For full details format - separate start and end times
const formattedStartTime = computed(() => {
  if (!effectiveOptions.value.showStartTime) return "";
  const locale = localeMap[currentLanguage.value] ?? "ms-MY";
  const options = effectiveOptions.value;

  // Use custom time format if provided
  if (displayFormat.value.preset === "custom" && options.customTimeFormat) {
    return formatDateWithPattern(eventDate.value, options.customTimeFormat);
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.timeFormat === "12h",
  };
  return eventDate.value.toLocaleTimeString(locale, timeOptions);
});

const formattedEndTime = computed(() => {
  if (!effectiveOptions.value.showEndTime || !eventEndTime.value) return "";
  const locale = localeMap[currentLanguage.value] ?? "ms-MY";
  const options = effectiveOptions.value;

  // Use custom time format if provided
  if (displayFormat.value.preset === "custom" && options.customTimeFormat) {
    return formatDateWithPattern(eventEndTime.value, options.customTimeFormat);
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.timeFormat === "12h",
  };
  return eventEndTime.value.toLocaleTimeString(locale, timeOptions);
});

const copied = ref(false);

const copyHashtag = async (): Promise<void> => {
  const hashtagValue = hashtag.value;
  try {
    await navigator.clipboard.writeText(hashtagValue);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = hashtagValue;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 bg-sand dark:bg-dark-bg transition-colors duration-300">
    <div class="max-w-xl mx-auto text-center">
      <!-- Formal Invitation -->
      <div class="mb-8 sm:mb-12">
        <p class="font-heading text-lg sm:text-xl text-sage-dark dark:text-sage-light mb-4 sm:mb-6">
          {{ t.details.greeting }}
        </p>

        <p class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary leading-relaxed mb-4 sm:mb-6">
          {{ t.details.withGratitude }}
        </p>

        <!-- First Parents (based on display order) -->
        <div class="mb-3 sm:mb-4">
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            {{ parents.first.father }}
          </p>
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            & {{ parents.first.mother }}
          </p>
        </div>

        <p class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-3 sm:mb-4">
          {{ t.details.together }}
        </p>

        <!-- Second Parents (based on display order) -->
        <div class="mb-4 sm:mb-6">
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            {{ parents.second.father }}
          </p>
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            & {{ parents.second.mother }}
          </p>
        </div>

        <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary leading-relaxed px-2">
          {{ t.details.invitation }}
        </p>
      </div>

      <!-- Couple Names -->
      <div class="mb-8 sm:mb-12">
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-sage-dark dark:text-sage-light mb-1 sm:mb-2 leading-tight">
          {{ couple.first.fullName }}
        </h2>
        <p class="font-heading text-xl sm:text-2xl text-charcoal-light dark:text-dark-text-secondary mb-1 sm:mb-2">
          &
        </p>
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-sage-dark dark:text-sage-light leading-tight">
          {{ couple.second.fullName }}
        </h2>
      </div>

      <!-- Divider -->
      <div class="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
        <div class="h-px w-12 sm:w-16 bg-sage/30"></div>
        <div class="w-2 h-2 rounded-full bg-sage/50"></div>
        <div class="h-px w-12 sm:w-16 bg-sage/30"></div>
      </div>

      <!-- Event Details -->
      <div class="space-y-4 sm:space-y-5">
        <div v-if="shouldShowDate">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.date }}
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text">
            {{ formattedDate }}
          </p>
        </div>

        <!-- Standard time display (for date_time_range, date_start_only presets) -->
        <div v-if="shouldShowTime && !isFullDetails">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.time }}
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text">
            {{ formattedTime }}
          </p>
        </div>

        <!-- Full details format (separate start/end times) -->
        <div v-if="shouldShowTime && isFullDetails">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.time }}
          </p>
          <div class="space-y-1">
            <p v-if="formattedStartTime" class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text">
              Starts: {{ formattedStartTime }}
            </p>
            <p v-if="formattedEndTime" class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text">
              Ends: {{ formattedEndTime }}
            </p>
          </div>
        </div>

        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.venue }}
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text mb-1">
            {{ venue.venueName }}
          </p>
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary px-4">
            {{ venue.address }}
          </p>
        </div>

        <!-- Parking Info -->
        <div
          v-if="venue.parkingInfo"
          class="mt-2 p-3 sm:p-4 bg-white/50 dark:bg-dark-bg-elevated/50 rounded-lg"
        >
          <div class="flex items-start gap-2 justify-center">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
            </svg>
            <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary text-left">
              {{ venue.parkingInfo }}
            </p>
          </div>
        </div>
      </div>

      <!-- Dress Code & Hashtag -->
      <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div class="flex-1 p-3 sm:p-4 bg-white dark:bg-dark-bg-elevated rounded-lg">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.dressCode }}
          </p>
          <p class="font-heading text-base sm:text-lg text-sage-dark dark:text-sage-light">
            {{ dressCode }}
          </p>
        </div>

        <div class="flex-1 p-3 sm:p-4 bg-white dark:bg-dark-bg-elevated rounded-lg">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.shareYourMoments }}
          </p>
          <button
            type="button"
            class="font-heading text-base sm:text-lg text-sage-dark dark:text-sage-light hover:text-sage cursor-pointer transition-colors"
            @click="copyHashtag"
          >
            {{ hashtag }}
          </button>
          <p
            v-if="copied"
            class="font-body text-xs text-sage mt-1"
          >
            {{ t.details.copied }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
