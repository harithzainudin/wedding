<script setup lang="ts">
import type { ThemeDefinition } from "@/types/theme";

const props = defineProps<{
  theme: ThemeDefinition;
  isSelected: boolean;
  isCustom?: boolean;
}>();

const emit = defineEmits<{
  select: [];
  preview: [];
}>();

const handleClick = (): void => {
  emit("select");
};

const handlePreview = (e: Event): void => {
  e.stopPropagation();
  emit("preview");
};
</script>

<template>
  <div
    class="relative rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md"
    :class="[
      isSelected
        ? 'border-sage bg-sage/5 dark:bg-sage/10'
        : 'border-sand-dark dark:border-dark-border hover:border-sage/50',
    ]"
    @click="handleClick"
  >
    <!-- Selected indicator -->
    <div
      v-if="isSelected"
      class="absolute top-2 right-2 w-6 h-6 bg-sage rounded-full flex items-center justify-center"
    >
      <svg
        class="w-4 h-4 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>

    <!-- Theme Name -->
    <h4
      class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-1 pr-8"
    >
      {{ theme.name }}
    </h4>

    <!-- Description -->
    <p
      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3"
    >
      {{ theme.description }}
    </p>

    <!-- Color Swatches -->
    <div class="flex gap-2 mb-3">
      <!-- Primary color -->
      <div
        class="w-8 h-8 rounded-full shadow-sm border border-white/20"
        :style="{ backgroundColor: theme.colors.light.primary }"
        :title="'Primary: ' + theme.colors.light.primary"
      />
      <!-- Primary Light -->
      <div
        class="w-8 h-8 rounded-full shadow-sm border border-white/20"
        :style="{ backgroundColor: theme.colors.light.primaryLight }"
        :title="'Primary Light: ' + theme.colors.light.primaryLight"
      />
      <!-- Secondary -->
      <div
        class="w-8 h-8 rounded-full shadow-sm border border-gray-200"
        :style="{ backgroundColor: theme.colors.light.secondary }"
        :title="'Secondary: ' + theme.colors.light.secondary"
      />
      <!-- Text -->
      <div
        class="w-8 h-8 rounded-full shadow-sm border border-white/20"
        :style="{ backgroundColor: theme.colors.light.text }"
        :title="'Text: ' + theme.colors.light.text"
      />
    </div>

    <!-- Font Preview -->
    <div class="flex items-baseline gap-2 mb-3">
      <span
        class="text-lg"
        :style="{ fontFamily: theme.fonts.heading + ', serif' }"
      >
        Aa
      </span>
      <span
        class="text-sm text-charcoal-light dark:text-dark-text-secondary"
        :style="{ fontFamily: theme.fonts.body + ', sans-serif' }"
      >
        {{ theme.fonts.heading }}
      </span>
    </div>

    <!-- Preview Button -->
    <button
      type="button"
      class="w-full py-1.5 px-3 text-xs font-body font-medium rounded transition-colors bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated cursor-pointer"
      @click="handlePreview"
    >
      Preview
    </button>
  </div>
</template>
