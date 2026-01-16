<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface Props {
  targetDate: Date;
}

const props = defineProps<Props>();

const now = ref(new Date());
let intervalId: ReturnType<typeof setInterval> | undefined;

const timeLeft = computed(() => {
  const diff = props.targetDate.getTime() - now.value.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
});

const formatNumber = (num: number): string => {
  return num.toString().padStart(2, "0");
};

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div class="flex items-center justify-center gap-1 sm:gap-3">
    <!-- Days -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span
        class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none"
      >
        {{ formatNumber(timeLeft.days) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        Hari
      </span>
    </div>

    <span class="text-lg sm:text-xl md:text-2xl font-light opacity-60 -mt-4"
      >:</span
    >

    <!-- Hours -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span
        class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none"
      >
        {{ formatNumber(timeLeft.hours) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        Jam
      </span>
    </div>

    <span class="text-lg sm:text-xl md:text-2xl font-light opacity-60 -mt-4"
      >:</span
    >

    <!-- Minutes -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span
        class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none"
      >
        {{ formatNumber(timeLeft.minutes) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        Minit
      </span>
    </div>

    <span class="text-lg sm:text-xl md:text-2xl font-light opacity-60 -mt-4"
      >:</span
    >

    <!-- Seconds -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span
        class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none"
      >
        {{ formatNumber(timeLeft.seconds) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        Saat
      </span>
    </div>
  </div>
</template>
