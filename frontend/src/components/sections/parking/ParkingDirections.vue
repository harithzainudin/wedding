<script setup lang="ts">
  import type { ParkingStep, ParkingIcon } from '@/types/venue'

  interface Props {
    steps: ParkingStep[]
    title?: string
  }

  defineProps<Props>()

  const getIconPath = (icon?: ParkingIcon): string => {
    switch (icon) {
      case 'turn-left':
        return 'M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1zM13 3.6V1h-2v2.6l1-.9 1 .9z M3 12l1.41 1.41L6 11.83V16h2v-4.17l1.59 1.59L11 12 7 8l-4 4z'
      case 'turn-right':
        return 'M14 19v-5h-4v5c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-7H3.3c-.46 0-.68-.57-.33-.87l8.36-7.53c.38-.34.96-.34 1.34 0l8.36 7.53c.34.3.13.87-.33.87H19v7c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1zM11 3.6V1h2v2.6l-1-.9-1 .9z M21 12l-1.41 1.41L18 11.83V16h-2v-4.17l-1.59 1.59L13 12l4-4 4 4z'
      case 'straight':
        return 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z'
      case 'landmark':
        return 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22l-9-12z'
      case 'parking':
        return 'M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z'
      case 'entrance':
        return 'M11 3v2h6v14H5v-2H3v4h16V3h-8zM3 13h6v-2H3v2zm6 2v-2H3v2h6zm0-6H3v2h6V9zm1 3l5-4v3h4v2h-4v3l-5-4z'
      default:
        return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'
    }
  }
</script>

<template>
  <div>
    <p
      v-if="title"
      class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light dark:text-dark-text-secondary mb-2"
    >
      {{ title }}
    </p>
    <ol class="space-y-2">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        class="flex items-start gap-3 p-2 bg-white/70 dark:bg-dark-bg-secondary/70 rounded-lg"
      >
        <!-- Step number -->
        <div
          class="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sage text-white flex items-center justify-center"
        >
          <span class="font-heading text-xs sm:text-sm font-semibold">
            {{ index + 1 }}
          </span>
        </div>

        <!-- Icon (if provided) -->
        <div
          v-if="step.icon"
          class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-sage-dark dark:text-sage-light"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
            <path :d="getIconPath(step.icon)" />
          </svg>
        </div>

        <!-- Step text -->
        <p class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text flex-1">
          {{ step.text }}
        </p>
      </li>
    </ol>
  </div>
</template>
