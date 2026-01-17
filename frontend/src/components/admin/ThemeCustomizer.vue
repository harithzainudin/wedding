<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import type { CustomThemeData, ThemeColors, ThemeDarkColors } from '@/types/theme'
  import { FONT_PRESETS, DEFAULT_THEMES } from '@/constants/themes'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    customTheme?: CustomThemeData | undefined
  }>()

  const emit = defineEmits<{
    update: [theme: CustomThemeData]
  }>()

  // Initialize with custom theme or default values
  const getDefaultCustomTheme = (): CustomThemeData => {
    const baseTheme = DEFAULT_THEMES['earthy-minimalist']
    return {
      name: 'My Custom Theme',
      colors: {
        light: { ...baseTheme.colors.light },
        dark: { ...baseTheme.colors.dark },
      },
      fonts: { ...baseTheme.fonts },
    }
  }

  const localTheme = ref<CustomThemeData>(props.customTheme ?? getDefaultCustomTheme())

  // Watch for external changes
  watch(
    () => props.customTheme,
    (newTheme) => {
      if (newTheme) {
        localTheme.value = { ...newTheme }
      }
    },
    { deep: true }
  )

  // Emit updates when local theme changes
  const emitUpdate = (): void => {
    emit('update', { ...localTheme.value })
  }

  // Color update handlers
  const updateLightColor = (key: keyof ThemeColors, value: string): void => {
    localTheme.value.colors.light[key] = value
    emitUpdate()
  }

  const updateDarkColor = (key: keyof ThemeDarkColors, value: string): void => {
    localTheme.value.colors.dark[key] = value
    emitUpdate()
  }

  const updateName = (value: string): void => {
    localTheme.value.name = value
    emitUpdate()
  }

  // Font preset selection
  const selectedFontPreset = computed(() => {
    return FONT_PRESETS.findIndex(
      (p) => p.heading === localTheme.value.fonts.heading && p.body === localTheme.value.fonts.body
    )
  })

  const selectFontPreset = (index: number): void => {
    const preset = FONT_PRESETS[index]
    if (preset) {
      localTheme.value.fonts = {
        heading: preset.heading,
        body: preset.body,
        googleFontUrl: preset.googleFontUrl,
      }
      emitUpdate()
    }
  }

  // Sections expansion state
  const expandedSections = ref({
    lightColors: true,
    darkColors: false,
    fonts: false,
  })

  const toggleSection = (section: keyof typeof expandedSections.value): void => {
    expandedSections.value[section] = !expandedSections.value[section]
  }

  // Color field definitions (computed for translations)
  const lightColorFields = computed(() => [
    {
      key: 'primary' as keyof ThemeColors,
      label: adminT.value.theme.primary,
      description: adminT.value.theme.primaryDesc,
    },
    {
      key: 'primaryLight' as keyof ThemeColors,
      label: adminT.value.theme.primaryLight,
      description: adminT.value.theme.primaryLightDesc,
    },
    {
      key: 'primaryDark' as keyof ThemeColors,
      label: adminT.value.theme.primaryDark,
      description: adminT.value.theme.primaryDarkDesc,
    },
    {
      key: 'secondary' as keyof ThemeColors,
      label: adminT.value.theme.secondary,
      description: adminT.value.theme.secondaryDesc,
    },
    {
      key: 'secondaryDark' as keyof ThemeColors,
      label: adminT.value.theme.secondaryDark,
      description: adminT.value.theme.secondaryDarkDesc,
    },
    {
      key: 'text' as keyof ThemeColors,
      label: adminT.value.theme.text,
      description: adminT.value.theme.textDesc,
    },
    {
      key: 'textLight' as keyof ThemeColors,
      label: adminT.value.theme.textLight,
      description: adminT.value.theme.textLightDesc,
    },
    {
      key: 'background' as keyof ThemeColors,
      label: adminT.value.theme.background,
      description: adminT.value.theme.backgroundDesc,
    },
  ])

  const darkColorFields = computed(() => [
    {
      key: 'background' as keyof ThemeDarkColors,
      label: adminT.value.theme.background,
      description: adminT.value.theme.backgroundDesc,
    },
    {
      key: 'backgroundSecondary' as keyof ThemeDarkColors,
      label: adminT.value.theme.backgroundSecondary,
      description: adminT.value.theme.backgroundSecondaryDesc,
    },
    {
      key: 'backgroundElevated' as keyof ThemeDarkColors,
      label: adminT.value.theme.backgroundElevated,
      description: adminT.value.theme.backgroundElevatedDesc,
    },
    {
      key: 'border' as keyof ThemeDarkColors,
      label: adminT.value.theme.border,
      description: adminT.value.theme.borderDesc,
    },
    {
      key: 'text' as keyof ThemeDarkColors,
      label: adminT.value.theme.darkModeText,
      description: adminT.value.theme.darkModeTextDesc,
    },
    {
      key: 'textSecondary' as keyof ThemeDarkColors,
      label: adminT.value.theme.textSecondary,
      description: adminT.value.theme.textSecondaryDesc,
    },
  ])
</script>

<template>
  <div class="space-y-4">
    <!-- Theme Name -->
    <div>
      <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
        {{ adminT.theme.themeName }}
      </label>
      <input
        type="text"
        :value="localTheme.name"
        @input="updateName(($event.target as HTMLInputElement).value)"
        class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text focus:border-sage focus:outline-none"
        :placeholder="adminT.theme.myCustomTheme"
        maxlength="50"
      />
    </div>

    <!-- Light Mode Colors Section -->
    <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 bg-sand/50 dark:bg-dark-bg-secondary text-left cursor-pointer hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors"
        @click="toggleSection('lightColors')"
      >
        <span class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
          {{ adminT.theme.lightModeColors }}
        </span>
        <svg
          class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform"
          :class="{ 'rotate-180': expandedSections.lightColors }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="expandedSections.lightColors" class="p-4 space-y-3">
        <div v-for="field in lightColorFields" :key="field.key" class="flex items-center gap-3">
          <input
            type="color"
            :value="localTheme.colors.light[field.key]"
            @input="updateLightColor(field.key, ($event.target as HTMLInputElement).value)"
            class="w-10 h-10 rounded cursor-pointer border border-sand-dark dark:border-dark-border"
          />
          <div class="flex-1">
            <p class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ field.label }}
            </p>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              {{ field.description }}
            </p>
          </div>
          <input
            type="text"
            :value="localTheme.colors.light[field.key]"
            @input="updateLightColor(field.key, ($event.target as HTMLInputElement).value)"
            class="w-24 px-2 py-1 font-body text-xs border border-sand-dark dark:border-dark-border rounded bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text uppercase"
            maxlength="7"
          />
        </div>
      </div>
    </div>

    <!-- Dark Mode Colors Section -->
    <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 bg-sand/50 dark:bg-dark-bg-secondary text-left cursor-pointer hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors"
        @click="toggleSection('darkColors')"
      >
        <span class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
          {{ adminT.theme.darkModeColors }}
        </span>
        <svg
          class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform"
          :class="{ 'rotate-180': expandedSections.darkColors }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="expandedSections.darkColors" class="p-4 space-y-3">
        <div v-for="field in darkColorFields" :key="field.key" class="flex items-center gap-3">
          <input
            type="color"
            :value="localTheme.colors.dark[field.key]"
            @input="updateDarkColor(field.key, ($event.target as HTMLInputElement).value)"
            class="w-10 h-10 rounded cursor-pointer border border-sand-dark dark:border-dark-border"
          />
          <div class="flex-1">
            <p class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ field.label }}
            </p>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              {{ field.description }}
            </p>
          </div>
          <input
            type="text"
            :value="localTheme.colors.dark[field.key]"
            @input="updateDarkColor(field.key, ($event.target as HTMLInputElement).value)"
            class="w-24 px-2 py-1 font-body text-xs border border-sand-dark dark:border-dark-border rounded bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text uppercase"
            maxlength="7"
          />
        </div>
      </div>
    </div>

    <!-- Fonts Section -->
    <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 bg-sand/50 dark:bg-dark-bg-secondary text-left cursor-pointer hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors"
        @click="toggleSection('fonts')"
      >
        <span class="font-body text-sm font-medium text-charcoal dark:text-dark-text">{{
          adminT.theme.fonts
        }}</span>
        <svg
          class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform"
          :class="{ 'rotate-180': expandedSections.fonts }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="expandedSections.fonts" class="p-4 space-y-4">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.theme.selectFontPairing }}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(preset, index) in FONT_PRESETS"
            :key="preset.name"
            type="button"
            class="p-3 text-left rounded-lg border transition-colors cursor-pointer"
            :class="[
              selectedFontPreset === index
                ? 'border-sage bg-sage/10'
                : 'border-sand-dark dark:border-dark-border hover:border-sage/50',
            ]"
            @click="selectFontPreset(index)"
          >
            <span class="block text-base mb-1" :style="{ fontFamily: preset.heading + ', serif' }">
              {{ preset.name }}
            </span>
            <span
              class="block text-xs text-charcoal-light dark:text-dark-text-secondary"
              :style="{ fontFamily: preset.body + ', sans-serif' }"
            >
              {{ preset.heading }} + {{ preset.body }}
            </span>
          </button>
        </div>

        <!-- Current Font Display -->
        <div class="mt-4 p-3 bg-sand/50 dark:bg-dark-bg-secondary rounded-lg">
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">
            {{ adminT.theme.currentSelection }}
          </p>
          <p class="text-charcoal dark:text-dark-text">
            <span class="font-medium">{{ adminT.theme.headingFont }}</span>
            {{ localTheme.fonts.heading }}
          </p>
          <p class="text-charcoal dark:text-dark-text">
            <span class="font-medium">{{ adminT.theme.bodyFont }}</span> {{ localTheme.fonts.body }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  input[type='color'] {
    -webkit-appearance: none;
    padding: 0;
  }

  input[type='color']::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  input[type='color']::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
</style>
