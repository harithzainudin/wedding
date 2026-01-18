<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import type { ThemeId, CustomThemeData, ThemeDefinition } from '@/types/theme'
  import { useTheme } from '@/composables/useTheme'
  import { useThemePreview } from '@/composables/useThemePreview'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import { DEFAULT_THEMES, PRESET_THEME_IDS } from '@/constants/themes'
  import ThemeCard from './ThemeCard.vue'
  import ThemeCustomizer from './ThemeCustomizer.vue'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()
  const route = useRoute()

  // Get wedding context from route and token
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })
  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const { themeSettings, isLoading, isSaving, error, loadTheme, saveTheme, restoreTheme } =
    useTheme()
  const { isPreviewMode, startPreview, endPreview } = useThemePreview()

  // Local state
  const selectedThemeId = ref<ThemeId>('earthy-minimalist')
  const customThemeData = ref<CustomThemeData | undefined>(undefined)
  const showCustomizer = ref(false)
  const saveError = ref<string | null>(null)
  const saveSuccess = ref(false)

  // Get preset themes as array
  const presetThemes = computed<ThemeDefinition[]>(() =>
    PRESET_THEME_IDS.map((id) => DEFAULT_THEMES[id])
  )

  // Check if there are unsaved changes
  const hasChanges = computed(() => {
    const savedId = themeSettings.value.activeThemeId
    const savedCustom = themeSettings.value.customTheme

    if (selectedThemeId.value !== savedId) return true

    if (selectedThemeId.value === 'custom' && customThemeData.value) {
      if (!savedCustom) return true
      // Deep compare custom themes
      return JSON.stringify(customThemeData.value) !== JSON.stringify(savedCustom)
    }

    return false
  })

  // Initialize from saved settings
  onMounted(async () => {
    const slug = weddingSlug.value
    if (slug) {
      await loadTheme(slug)
    }
    selectedThemeId.value = themeSettings.value.activeThemeId
    customThemeData.value = themeSettings.value.customTheme
    showCustomizer.value = themeSettings.value.activeThemeId === 'custom'
  })

  // Watch for settings changes (e.g., from other tabs)
  watch(
    () => themeSettings.value,
    (newSettings) => {
      if (!hasChanges.value) {
        selectedThemeId.value = newSettings.activeThemeId
        customThemeData.value = newSettings.customTheme
      }
    },
    { deep: true }
  )

  // Select a preset theme
  const selectTheme = (themeId: ThemeId): void => {
    selectedThemeId.value = themeId
    showCustomizer.value = themeId === 'custom'
    saveError.value = null
    saveSuccess.value = false

    // Start preview when selecting
    if (themeId === 'custom') {
      if (!customThemeData.value) {
        // Initialize custom theme from current earthy-minimalist
        customThemeData.value = {
          name: 'My Custom Theme',
          colors: { ...DEFAULT_THEMES['earthy-minimalist'].colors },
          fonts: { ...DEFAULT_THEMES['earthy-minimalist'].fonts },
        }
      }
      startPreview(
        'custom',
        customThemeData.value,
        themeSettings.value.activeThemeId,
        themeSettings.value.customTheme
      )
    } else {
      startPreview(
        themeId,
        undefined,
        themeSettings.value.activeThemeId,
        themeSettings.value.customTheme
      )
    }
  }

  // Preview a theme without selecting
  const previewTheme = (themeId: ThemeId): void => {
    if (themeId === 'custom') {
      startPreview(
        'custom',
        customThemeData.value,
        themeSettings.value.activeThemeId,
        themeSettings.value.customTheme
      )
    } else {
      startPreview(
        themeId,
        undefined,
        themeSettings.value.activeThemeId,
        themeSettings.value.customTheme
      )
    }
  }

  // Handle custom theme updates
  const handleCustomThemeUpdate = (theme: CustomThemeData): void => {
    customThemeData.value = theme
    saveError.value = null
    saveSuccess.value = false

    // Update preview in real-time
    if (selectedThemeId.value === 'custom') {
      startPreview(
        'custom',
        theme,
        themeSettings.value.activeThemeId,
        themeSettings.value.customTheme
      )
    }
  }

  // Cancel changes and restore saved theme
  const cancelChanges = (): void => {
    selectedThemeId.value = themeSettings.value.activeThemeId
    customThemeData.value = themeSettings.value.customTheme
    showCustomizer.value = themeSettings.value.activeThemeId === 'custom'
    saveError.value = null
    saveSuccess.value = false

    // End preview and restore saved theme
    endPreview()
    restoreTheme()
  }

  // Save theme
  const handleSave = async (): Promise<void> => {
    saveError.value = null
    saveSuccess.value = false

    const id = weddingId.value ?? undefined

    await withLoading(
      async () => {
        const result = await saveTheme(
          {
            activeThemeId: selectedThemeId.value,
            customTheme: selectedThemeId.value === 'custom' ? customThemeData.value : undefined,
          },
          id
        )

        if (result.success) {
          // End preview mode since we've saved
          endPreview()
        } else {
          saveError.value = result.error ?? 'Failed to save theme'
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Toggle custom theme section
  const toggleCustomizer = (): void => {
    if (selectedThemeId.value === 'custom') {
      showCustomizer.value = !showCustomizer.value
    } else {
      selectTheme('custom')
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="font-heading text-xl font-medium text-charcoal dark:text-dark-text mb-1">
        {{ adminT.theme.title }}
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.theme.subtitle }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
    </div>

    <template v-else>
      <!-- Preview Mode Banner -->
      <div
        v-if="isPreviewMode && hasChanges"
        class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between"
      >
        <p class="font-body text-sm text-amber-700 dark:text-amber-300">
          {{ adminT.theme.previewModeActive }}
        </p>
        <button
          type="button"
          class="px-3 py-1 font-body text-sm font-medium bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 rounded hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors cursor-pointer"
          @click="cancelChanges"
        >
          {{ adminT.theme.cancelPreview }}
        </button>
      </div>

      <!-- Preset Themes Grid -->
      <div>
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.theme.presetThemes }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ThemeCard
            v-for="theme in presetThemes"
            :key="theme.id"
            :theme="theme"
            :is-selected="selectedThemeId === theme.id"
            @select="selectTheme(theme.id)"
            @preview="previewTheme(theme.id)"
          />
        </div>
      </div>

      <!-- Custom Theme Section -->
      <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
        <button
          type="button"
          class="w-full flex items-center justify-between px-4 py-4 bg-sand/30 dark:bg-dark-bg-secondary text-left cursor-pointer hover:bg-sand/50 dark:hover:bg-dark-bg-elevated transition-colors"
          :class="{
            'bg-sage/10 dark:bg-sage/20': selectedThemeId === 'custom',
          }"
          @click="toggleCustomizer"
        >
          <div class="flex items-center gap-3">
            <!-- Selected indicator -->
            <div
              v-if="selectedThemeId === 'custom'"
              class="w-6 h-6 bg-sage rounded-full flex items-center justify-center flex-shrink-0"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div
              v-else
              class="w-6 h-6 border-2 border-sand-dark dark:border-dark-border rounded-full flex-shrink-0"
            />
            <div>
              <span class="font-heading text-base font-medium text-charcoal dark:text-dark-text">
                {{ adminT.theme.customTheme }}
              </span>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ adminT.theme.customThemeDescription }}
              </p>
            </div>
          </div>
          <svg
            class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform"
            :class="{
              'rotate-180': showCustomizer && selectedThemeId === 'custom',
            }"
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

        <!-- Custom Theme Editor -->
        <div
          v-show="showCustomizer && selectedThemeId === 'custom'"
          class="p-4 border-t border-sand-dark dark:border-dark-border"
        >
          <ThemeCustomizer :custom-theme="customThemeData" @update="handleCustomThemeUpdate" />
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="saveError || error"
        class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <p class="font-body text-sm text-red-700 dark:text-red-300">
          {{ saveError ?? error }}
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="saveSuccess"
        class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
      >
        <p class="font-body text-sm text-green-700 dark:text-green-300">
          {{ adminT.theme.savedSuccess }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 pt-4 border-t border-sand-dark dark:border-dark-border">
        <button
          v-if="hasChanges"
          type="button"
          class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
          @click="cancelChanges"
        >
          {{ adminT.common.cancel }}
        </button>
        <button
          type="button"
          class="px-4 py-2 font-body text-sm font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="!hasChanges || isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {{ adminT.common.saving }}
          </span>
          <span v-else>{{ adminT.theme.saveTheme }}</span>
        </button>
      </div>

      <!-- Last Updated Info -->
      <div v-if="themeSettings.updatedAt" class="text-right">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.messages.lastUpdated }}:
          {{ new Date(themeSettings.updatedAt).toLocaleString() }}
          <span v-if="themeSettings.updatedBy"
            >{{ adminT.messages.by }} {{ themeSettings.updatedBy }}</span
          >
        </p>
      </div>
    </template>
  </div>
</template>
