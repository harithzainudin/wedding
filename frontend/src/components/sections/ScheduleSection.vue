<script setup lang="ts">
  import { computed, watch, nextTick } from 'vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { useScrollReveal } from '@/composables/useScrollReveal'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import type { ScheduleItem } from '@/types/schedule'

  const { t, currentLanguage } = useLanguage()
  const { isRevealed, observeElements } = useScrollReveal({
    threshold: 0.2,
    rootMargin: '0px 0px -30px 0px',
    selector: '.schedule-item',
  })

  const { getScheduleMultilingual, isLoadingSchedule } = usePublicWeddingData()

  // Re-observe elements when loading completes (elements are now in DOM)
  watch(isLoadingSchedule, (loading) => {
    if (!loading) {
      nextTick(() => {
        observeElements()
      })
    }
  })

  const schedule = computed(() => getScheduleMultilingual())

  // Get the appropriate title based on current language (supports all 4 languages)
  const getScheduleTitle = (item: ScheduleItem): string => {
    const lang = currentLanguage.value as keyof typeof item.title
    return item.title[lang] || item.title.en
  }

  // Get subtitle (show English if not already showing, otherwise Malay)
  const getScheduleSubtitle = computed(() => (item: ScheduleItem): string => {
    if (currentLanguage.value === 'en') {
      return item.title.ms
    }
    return item.title.en
  })
</script>

<template>
  <section
    class="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-dark-bg-secondary transition-colors duration-300"
  >
    <div class="max-w-xl mx-auto">
      <h2
        class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark dark:text-sage-light mb-6 sm:mb-8"
      >
        {{ t.schedule.title }}
      </h2>

      <!-- Loading Skeleton -->
      <div v-if="isLoadingSchedule" class="space-y-4 sm:space-y-6">
        <div v-for="i in 4" :key="i" class="flex items-start gap-3 sm:gap-4 animate-pulse">
          <div class="flex-shrink-0 w-20 sm:w-24 text-right">
            <div class="h-5 sm:h-6 w-16 bg-sage/20 dark:bg-sage/10 rounded ml-auto"></div>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sage/30"></div>
            <div v-if="i < 4" class="w-0.5 h-10 sm:h-12 bg-sage/20"></div>
          </div>
          <div class="flex-1 pb-4 sm:pb-6 space-y-2">
            <div class="h-5 sm:h-6 w-3/4 bg-charcoal/10 dark:bg-dark-text/10 rounded"></div>
            <div class="h-4 w-1/2 bg-charcoal/5 dark:bg-dark-text/5 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Actual Schedule -->
      <div v-else class="space-y-4 sm:space-y-6">
        <div
          v-for="(item, index) in schedule"
          :key="item.id"
          :data-index="index"
          class="flex items-start gap-3 sm:gap-4 schedule-item"
          :class="{ 'schedule-item--revealed': isRevealed(index) }"
          :style="{ transitionDelay: `${index * 150}ms` }"
        >
          <!-- Time -->
          <div class="flex-shrink-0 w-20 sm:w-24 text-right">
            <p class="font-heading text-base sm:text-lg text-sage-dark dark:text-sage-light">
              {{ item.time }}
            </p>
          </div>

          <!-- Timeline Dot -->
          <div class="flex flex-col items-center">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sage"></div>
            <div v-if="index < schedule.length - 1" class="w-0.5 h-10 sm:h-12 bg-sage/30"></div>
          </div>

          <!-- Event Description -->
          <div class="flex-1 pb-4 sm:pb-6">
            <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
              {{ getScheduleTitle(item) }}
            </p>
            <p
              class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary"
            >
              {{ getScheduleSubtitle(item) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .schedule-item {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 0.6s ease-out,
      transform 0.6s ease-out;
  }

  .schedule-item--revealed {
    opacity: 1;
    transform: translateY(0);
  }
</style>
