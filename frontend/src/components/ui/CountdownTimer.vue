<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { interpolate } from '@/i18n/translations'

  interface Props {
    targetDate: Date
  }

  const props = defineProps<Props>()
  const { t } = useLanguage()

  const now = ref(new Date())
  let intervalId: ReturnType<typeof setInterval> | undefined

  const isWeddingDay = computed(() => {
    const today = new Date(now.value)
    const target = new Date(props.targetDate)
    return (
      today.getFullYear() === target.getFullYear() &&
      today.getMonth() === target.getMonth() &&
      today.getDate() === target.getDate()
    )
  })

  const isPastDate = computed(() => {
    if (isWeddingDay.value) return false
    return props.targetDate.getTime() - now.value.getTime() < 0
  })

  const daysSinceWedding = computed(() => {
    if (!isPastDate.value) return 0
    const diff = now.value.getTime() - props.targetDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  })

  const timeLeft = computed(() => {
    const diff = props.targetDate.getTime() - now.value.getTime()

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  })

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0')
  }

  onMounted(() => {
    intervalId = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })
</script>

<template>
  <!-- State 1: Wedding Day -->
  <div v-if="isWeddingDay" class="text-center">
    <div class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold animate-pulse">
      {{ t.countdown.weddingDayMessage }}
    </div>
  </div>

  <!-- State 2: Past Wedding (Married) -->
  <div v-else-if="isPastDate" class="text-center">
    <div class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold">
      {{ t.countdown.marriedMessage }}
    </div>
    <div v-if="daysSinceWedding > 0" class="text-sm opacity-80 mt-2 font-body">
      {{ interpolate(t.countdown.daysSince, { days: daysSinceWedding }) }}
    </div>
  </div>

  <!-- State 3: Future (Countdown) -->
  <div v-else class="flex items-center justify-center gap-1 sm:gap-3">
    <!-- Days -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none">
        {{ formatNumber(timeLeft.days) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        {{ t.countdown.days }}
      </span>
    </div>

    <span class="text-lg sm:text-xl md:text-2xl font-light opacity-60 -mt-4">:</span>

    <!-- Hours -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none">
        {{ formatNumber(timeLeft.hours) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        {{ t.countdown.hours }}
      </span>
    </div>

    <span class="text-lg sm:text-xl md:text-2xl font-light opacity-60 -mt-4">:</span>

    <!-- Minutes -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none">
        {{ formatNumber(timeLeft.minutes) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        {{ t.countdown.minutes }}
      </span>
    </div>

    <span class="text-lg sm:text-xl md:text-2xl font-light opacity-60 -mt-4">:</span>

    <!-- Seconds -->
    <div class="flex flex-col items-center w-14 sm:w-16 md:w-20">
      <span class="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold leading-none">
        {{ formatNumber(timeLeft.seconds) }}
      </span>
      <span
        class="font-body text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80"
      >
        {{ t.countdown.seconds }}
      </span>
    </div>
  </div>
</template>
