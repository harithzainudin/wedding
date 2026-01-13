<script setup lang="ts">
import { computed } from "vue";
import CountdownTimer from "@/components/ui/CountdownTimer.vue";
import MusicToggle from "@/components/ui/MusicToggle.vue";
import LanguageToggle from "@/components/ui/LanguageToggle.vue";
import DarkModeToggle from "@/components/ui/DarkModeToggle.vue";
import { useLanguage } from "@/composables/useLanguage";
import { usePublicWeddingData } from "@/composables/usePublicWeddingData";

const { t } = useLanguage();
const { getCoupleNames, getEventDate } = usePublicWeddingData();

const coupleNames = computed(() => {
  const couple = getCoupleNames();
  return {
    bride: couple.bride.nickname,
    groom: couple.groom.nickname,
  };
});

const weddingDate = computed(() => getEventDate());
</script>

<template>
  <section
    class="relative min-h-svh flex items-center justify-center text-center overflow-hidden"
  >
    <!-- Background with gradient overlay -->
    <div class="absolute inset-0 bg-sage-dark">
      <div class="absolute inset-0 bg-black/30"></div>
    </div>

    <!-- Top Controls -->
    <div class="absolute top-4 right-4 z-10 flex gap-2">
      <LanguageToggle />
      <DarkModeToggle />
      <MusicToggle />
    </div>

    <!-- Content -->
    <div class="relative text-white w-full px-6 py-12">
      <!-- Bismillah Calligraphy -->
      <div class="mb-6 sm:mb-8">
        <p
          class="font-heading text-xl sm:text-2xl md:text-3xl mb-2 leading-relaxed"
          dir="rtl"
        >
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <p class="font-body text-[10px] sm:text-xs md:text-sm opacity-80 leading-relaxed">
          {{ t.hero.bismillahTranslation }}
        </p>
      </div>

      <!-- Wedding Announcement -->
      <p
        class="font-body text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3 opacity-90"
      >
        {{ t.hero.weddingOf }}
      </p>

      <!-- Couple Names - Stacked -->
      <div class="mb-6 sm:mb-8">
        <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
          {{ coupleNames.bride }}
        </h1>
        <p class="font-heading text-xl sm:text-2xl md:text-3xl my-1 sm:my-2 opacity-80">
          &
        </p>
        <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
          {{ coupleNames.groom }}
        </h1>
      </div>

      <!-- Countdown Timer -->
      <CountdownTimer :target-date="weddingDate" />
    </div>
  </section>
</template>
