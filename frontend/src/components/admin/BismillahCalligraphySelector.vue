<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import type { CalligraphyStyleId, BismillahCalligraphySettings } from '@/types/weddingDetails'
  import {
    calligraphyOptions,
    getCalligraphySvg,
    getCalligraphyByCategory,
  } from '@/assets/calligraphy/bismillah'

  const props = defineProps<{
    settings: BismillahCalligraphySettings
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    update: [settings: BismillahCalligraphySettings]
  }>()

  // Local state
  const selectedStyle = ref<CalligraphyStyleId>(props.settings.selectedStyle)
  const showTranslation = ref(props.settings.showTranslation)
  const loadedSvgs = ref<Record<string, string>>({})
  const previewStyle = ref<CalligraphyStyleId | null>(null)
  const isLoadingSvgs = ref(true)

  // Watch for prop changes
  watch(
    () => props.settings,
    (newSettings) => {
      selectedStyle.value = newSettings.selectedStyle
      showTranslation.value = newSettings.showTranslation
    },
    { deep: true }
  )

  // Group by category for display
  const groupedOptions = computed(() => getCalligraphyByCategory())

  // Current preview SVG (either hovered or selected)
  const currentPreviewSvg = computed(() => {
    const styleId = previewStyle.value || selectedStyle.value
    return loadedSvgs.value[styleId] || ''
  })

  // Category labels
  const categoryLabels: Record<string, string> = {
    traditional: 'Traditional Styles',
    ornate: 'Ornate Styles',
    modern: 'Modern Styles',
  }

  // Load all SVGs on mount for preview
  onMounted(async () => {
    isLoadingSvgs.value = true
    const loadPromises = calligraphyOptions.map(async (option) => {
      const svg = await getCalligraphySvg(option.id)
      loadedSvgs.value[option.id] = svg
    })
    await Promise.all(loadPromises)
    isLoadingSvgs.value = false
  })

  const handleSelect = (styleId: CalligraphyStyleId) => {
    if (props.disabled) return
    selectedStyle.value = styleId
    emitUpdate()
  }

  const handleToggleTranslation = () => {
    if (props.disabled) return
    showTranslation.value = !showTranslation.value
    emitUpdate()
  }

  const emitUpdate = () => {
    emit('update', {
      selectedStyle: selectedStyle.value,
      showTranslation: showTranslation.value,
    })
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Sticky Preview Section -->
    <div
      class="sticky top-0 z-10 bg-white dark:bg-dark-bg-secondary -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-4"
    >
      <div class="bg-sage-dark dark:bg-sage-dark/80 rounded-xl p-4 sm:p-6 text-center">
        <!-- Loading State -->
        <div
          v-if="isLoadingSvgs"
          class="animate-pulse h-16 sm:h-20 flex items-center justify-center"
        >
          <div class="h-8 sm:h-10 bg-white/20 rounded w-full max-w-sm"></div>
        </div>
        <!-- SVG Preview - Fixed height container to prevent jittering -->
        <div v-else class="flex flex-col items-center justify-center">
          <div
            class="text-white w-full max-w-sm sm:max-w-md h-10 sm:h-12 flex items-center justify-center [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-h-full"
            dir="rtl"
            v-html="currentPreviewSvg"
          />
          <div
            class="grid transition-all duration-300 ease-out"
            :class="showTranslation ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden min-h-0">
              <p class="text-white/80 text-[10px] sm:text-xs mt-1 font-body">
                In the Name of Allah, the Most Gracious, the Most Merciful
              </p>
            </div>
          </div>
          <!-- Preview indicator - always reserve space to prevent jittering -->
          <p
            class="text-[10px] mt-1 font-body h-4 transition-opacity"
            :class="previewStyle && previewStyle !== selectedStyle ? 'text-white/60' : 'opacity-0'"
          >
            {{
              previewStyle && previewStyle !== selectedStyle
                ? `Previewing: ${calligraphyOptions.find((o) => o.id === previewStyle)?.name}`
                : 'Selected'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Translation Toggle -->
    <div
      class="flex items-center justify-between py-3 px-4 bg-sand/50 dark:bg-dark-bg-elevated rounded-lg"
    >
      <div>
        <label class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
          Show Translation
        </label>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          Display English translation below calligraphy
        </p>
      </div>
      <button
        type="button"
        role="switch"
        :aria-checked="showTranslation"
        class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors cursor-pointer"
        :class="[
          showTranslation ? 'bg-sage' : 'bg-gray-300 dark:bg-gray-600',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        :disabled="disabled"
        @click="handleToggleTranslation"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5"
          :class="showTranslation ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'"
        />
      </button>
    </div>

    <!-- Style Selection Grid -->
    <div v-if="isLoadingSvgs" class="space-y-4">
      <div v-for="i in 3" :key="i" class="space-y-3">
        <div class="h-4 w-32 bg-sand dark:bg-dark-bg-elevated rounded animate-pulse"></div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="j in 4"
            :key="j"
            class="h-24 bg-sand dark:bg-dark-bg-elevated rounded-lg animate-pulse"
          ></div>
        </div>
      </div>
    </div>

    <div v-else v-for="(options, category) in groupedOptions" :key="category" class="space-y-3">
      <h4 class="font-heading text-sm font-medium text-charcoal dark:text-dark-text">
        {{ categoryLabels[category] }}
      </h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          v-for="option in options"
          :key="option.id"
          type="button"
          class="relative p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
          :class="[
            selectedStyle === option.id
              ? 'border-sage bg-sage/10 dark:bg-sage/20'
              : 'border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary hover:border-sage/50',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]"
          :disabled="disabled"
          @click="handleSelect(option.id)"
          @mouseenter="previewStyle = option.id"
          @mouseleave="previewStyle = null"
        >
          <!-- SVG Preview - Fixed height -->
          <div
            class="h-10 sm:h-12 flex items-center justify-center text-charcoal dark:text-dark-text overflow-hidden [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-h-full"
            dir="rtl"
            v-html="loadedSvgs[option.id]"
          />
          <!-- Label -->
          <div class="mt-2 text-center">
            <p class="font-body text-xs sm:text-sm text-charcoal dark:text-dark-text font-medium">
              {{ option.name }}
            </p>
            <p class="font-body text-[10px] text-charcoal-light dark:text-dark-text-secondary">
              {{ option.nameArabic }}
            </p>
          </div>
          <!-- Selection indicator -->
          <div
            v-if="selectedStyle === option.id"
            class="absolute top-2 right-2 w-5 h-5 bg-sage rounded-full flex items-center justify-center"
          >
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
