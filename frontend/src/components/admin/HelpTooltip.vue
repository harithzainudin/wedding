<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineProps<{
  title?: string;
}>();

const isOpen = ref(false);
const tooltipRef = ref<HTMLElement | null>(null);

const toggleTooltip = (): void => {
  isOpen.value = !isOpen.value;
};

const closeTooltip = (): void => {
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent): void => {
  if (tooltipRef.value && !tooltipRef.value.contains(event.target as Node)) {
    closeTooltip();
  }
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === "Escape" && isOpen.value) {
    closeTooltip();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div ref="tooltipRef" class="relative inline-block">
    <!-- Trigger Button -->
    <button
      type="button"
      class="p-1.5 rounded-full text-charcoal-light dark:text-dark-text-secondary hover:text-sage dark:hover:text-sage-light hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-label="isOpen ? 'Close help' : 'Open help'"
      @click.stop="toggleTooltip"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>

    <!-- Tooltip Content -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="transform opacity-0 scale-95 -translate-y-1"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        role="tooltip"
        class="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-sand-dark dark:border-dark-border p-4 z-50"
      >
        <!-- Arrow pointer -->
        <div class="absolute -top-2 left-4 w-4 h-4 bg-white dark:bg-dark-bg-secondary border-l border-t border-sand-dark dark:border-dark-border transform rotate-45" />

        <!-- Optional title -->
        <h4 v-if="title" class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3">
          {{ title }}
        </h4>

        <!-- Slot for content -->
        <slot />
      </div>
    </Transition>
  </div>
</template>
