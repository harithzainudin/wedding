<script setup lang="ts">
import { computed, ref } from "vue";
import { weddingConfig } from "@/config/wedding";
import { useLanguage } from "@/composables/useLanguage";

const { t, currentLanguage } = useLanguage();

const localeMap: Record<string, string> = {
  ms: "ms-MY",
  en: "en-MY",
  zh: "zh-CN",
  ta: "ta-MY",
};

const formattedDate = computed(() => {
  const date = weddingConfig.event.date;
  const locale = localeMap[currentLanguage.value] ?? "ms-MY";
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(locale, options);
});

const formattedTime = computed(() => {
  const date = weddingConfig.event.date;
  const locale = localeMap[currentLanguage.value] ?? "ms-MY";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

const copied = ref(false);

const copyHashtag = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(weddingConfig.hashtag);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = weddingConfig.hashtag;
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

        <!-- Bride's Parents -->
        <div class="mb-3 sm:mb-4">
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            {{ weddingConfig.parents.bride.father }}
          </p>
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            & {{ weddingConfig.parents.bride.mother }}
          </p>
        </div>

        <p class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-3 sm:mb-4">
          {{ t.details.together }}
        </p>

        <!-- Groom's Parents -->
        <div class="mb-4 sm:mb-6">
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            {{ weddingConfig.parents.groom.father }}
          </p>
          <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
            & {{ weddingConfig.parents.groom.mother }}
          </p>
        </div>

        <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary leading-relaxed px-2">
          {{ t.details.invitation }}
        </p>
      </div>

      <!-- Couple Names -->
      <div class="mb-8 sm:mb-12">
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-sage-dark dark:text-sage-light mb-1 sm:mb-2 leading-tight">
          {{ weddingConfig.couple.bride.fullName }}
        </h2>
        <p class="font-heading text-xl sm:text-2xl text-charcoal-light dark:text-dark-text-secondary mb-1 sm:mb-2">
          &
        </p>
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-sage-dark dark:text-sage-light leading-tight">
          {{ weddingConfig.couple.groom.fullName }}
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
        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.date }}
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text">
            {{ formattedDate }}
          </p>
        </div>

        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.time }}
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text">
            {{ formattedTime }}
          </p>
        </div>

        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-1">
            {{ t.details.venue }}
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text mb-1">
            {{ weddingConfig.event.venue.name }}
          </p>
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary px-4">
            {{ weddingConfig.event.venue.address }}
          </p>
        </div>

        <!-- Parking Info -->
        <div
          v-if="weddingConfig.event.venue.parkingInfo"
          class="mt-2 p-3 sm:p-4 bg-white/50 dark:bg-dark-bg-elevated/50 rounded-lg"
        >
          <div class="flex items-start gap-2 justify-center">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
            </svg>
            <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary text-left">
              {{ weddingConfig.event.venue.parkingInfo }}
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
            {{ weddingConfig.dressCode }}
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
            {{ weddingConfig.hashtag }}
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
