<script setup lang="ts">
import { computed } from "vue";
import { weddingConfig } from "@/config/wedding";
import { useLanguage } from "@/composables/useLanguage";

const { t, currentLanguage } = useLanguage();

const schedule = weddingConfig.event.schedule;

// Get the appropriate title based on current language
const getScheduleTitle = (item: { title: string; titleMalay: string }): string => {
  return currentLanguage.value === "ms" ? item.titleMalay : item.title;
};

// Get subtitle (show the other language as subtitle)
const getScheduleSubtitle = computed(() => (item: { title: string; titleMalay: string }): string => {
  return currentLanguage.value === "ms" ? item.title : item.titleMalay;
});
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 bg-white">
    <div class="max-w-xl mx-auto">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark mb-6 sm:mb-8">
        {{ t.schedule.title }}
      </h2>

      <div class="space-y-4 sm:space-y-6">
        <div
          v-for="(item, index) in schedule"
          :key="index"
          class="flex items-start gap-3 sm:gap-4"
        >
          <!-- Time -->
          <div class="flex-shrink-0 w-20 sm:w-24 text-right">
            <p class="font-heading text-base sm:text-lg text-sage-dark">
              {{ item.time }}
            </p>
          </div>

          <!-- Timeline Dot -->
          <div class="flex flex-col items-center">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sage"></div>
            <div
              v-if="index < schedule.length - 1"
              class="w-0.5 h-10 sm:h-12 bg-sage/30"
            ></div>
          </div>

          <!-- Event Description -->
          <div class="flex-1 pb-4 sm:pb-6">
            <p class="font-heading text-base sm:text-lg text-charcoal">
              {{ getScheduleTitle(item) }}
            </p>
            <p class="font-body text-xs sm:text-sm text-charcoal-light">
              {{ getScheduleSubtitle(item) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
