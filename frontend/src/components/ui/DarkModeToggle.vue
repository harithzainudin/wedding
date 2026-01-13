<script setup lang="ts">
import { computed } from "vue";
import { useDarkMode } from "@/composables/useDarkMode";

interface Props {
  variant?: "dark" | "light";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "dark",
});

const { isDark, toggleDarkMode } = useDarkMode();

const buttonClasses = computed(() => {
  const base =
    "flex items-center justify-center w-10 h-10 backdrop-blur-sm border rounded-full cursor-pointer transition-all duration-300 active:scale-95";
  if (props.variant === "light") {
    return `${base} bg-sage/10 border-sage/30 text-sage hover:bg-sage/20 dark:bg-dark-bg-elevated/50 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-bg-elevated`;
  }
  return `${base} bg-white/20 border-white/30 text-white hover:bg-white/30`;
});
</script>

<template>
  <button
    type="button"
    :class="buttonClasses"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleDarkMode"
  >
    <Transition name="icon-rotate" mode="out-in">
      <!-- Sun Icon (shown in dark mode) -->
      <svg
        v-if="isDark"
        key="sun"
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <!-- Moon Icon (shown in light mode) -->
      <svg
        v-else
        key="moon"
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </Transition>
  </button>
</template>

<style scoped>
/* Icon rotation transition */
.icon-rotate-enter-active,
.icon-rotate-leave-active {
  transition: all 0.25s ease;
}

.icon-rotate-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.icon-rotate-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
