<script setup lang="ts">
  import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useGifts } from '@/composables/useGifts'
  import { interpolate } from '@/i18n/translations'
  import {
    DEFAULT_GIFT_TEMPLATES,
    getDefaultGiftCounts,
    type DefaultGiftTemplate,
  } from '@/constants/defaultGifts'
  import { GIFT_CATEGORIES, type GiftCategory, type CreateGiftRequest } from '@/types/gift'
  import ConfirmModal from './ConfirmModal.vue'

  const props = defineProps<{
    modelValue: boolean
    weddingId?: string
    canAddMore: boolean
    maxItems: number
    currentCount: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'giftsAdded', count: number): void
  }>()

  const { adminT } = useAdminLanguage()
  const { gifts, createGiftItem } = useGifts()

  // State
  const selectedGifts = ref<Set<string>>(new Set())
  const selectedCategory = ref<GiftCategory | 'all'>('all')
  const searchQuery = ref('')
  const isAdding = ref(false)
  const addProgress = ref({ current: 0, total: 0 })
  const addError = ref<string | null>(null)
  const addSuccess = ref<string | null>(null)
  const selectionWarning = ref<string | null>(null)
  let selectionWarningTimeout: ReturnType<typeof setTimeout> | null = null
  const showDiscardConfirm = ref(false)

  // Accordion state for collapsible categories
  const expandedCategories = ref<Set<GiftCategory>>(new Set())
  const isMobileDevice = ref(false)

  // Mobile filter section state
  const isFilterExpanded = ref(false)
  const isHintDismissed = ref(false)

  // View mode state (card/list)
  type BrowserViewMode = 'card' | 'list'
  const BROWSER_VIEW_KEY = 'wedding-admin-default-gift-view'

  const getInitialBrowserViewMode = (): BrowserViewMode => {
    const stored = localStorage.getItem(BROWSER_VIEW_KEY)
    if (stored === 'card' || stored === 'list') return stored
    return 'card'
  }

  const browserViewMode = ref<BrowserViewMode>(getInitialBrowserViewMode())

  const setBrowserViewMode = (mode: BrowserViewMode) => {
    browserViewMode.value = mode
    localStorage.setItem(BROWSER_VIEW_KEY, mode)
  }

  // Initialize accordion state based on screen size
  onMounted(() => {
    isMobileDevice.value = window.innerWidth < 640
    if (!isMobileDevice.value) {
      // Expand all categories on desktop
      expandedCategories.value = new Set(GIFT_CATEGORIES as readonly GiftCategory[])
    }
    // Check localStorage for hint dismissal
    isHintDismissed.value = localStorage.getItem('defaultGiftBrowser-hintDismissed') === 'true'
  })

  const dismissHint = () => {
    isHintDismissed.value = true
    localStorage.setItem('defaultGiftBrowser-hintDismissed', 'true')
  }

  const toggleFilterExpanded = () => {
    isFilterExpanded.value = !isFilterExpanded.value
  }

  const toggleCategory = (category: GiftCategory) => {
    const newSet = new Set(expandedCategories.value)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    expandedCategories.value = newSet
  }

  const isCategoryExpanded = (category: GiftCategory) => {
    return expandedCategories.value.has(category)
  }

  const expandAllCategories = () => {
    expandedCategories.value = new Set(categoriesWithTemplates.value)
  }

  const collapseAllCategories = () => {
    expandedCategories.value = new Set()
  }

  // Get selected count per category
  const getSelectedCountInCategory = (category: GiftCategory): number => {
    const templates = templatesByCategory.value[category] ?? []
    return templates.filter((t) => isSelected(t.id) && !isAlreadyAdded(t)).length
  }

  // Category labels
  const categoryLabels: Record<GiftCategory | 'all', string> = {
    all: 'All',
    home: 'Home',
    kitchen: 'Kitchen',
    electronics: 'Electronics',
    experiences: 'Experiences',
    other: 'Other',
  }

  // Get counts for each category
  const categoryCounts = computed(() => getDefaultGiftCounts())

  // Computed: check for duplicates based on English name (case-insensitive)
  const existingGiftNames = computed(() => {
    return new Set(gifts.value.map((g) => g.name.en.toLowerCase().trim()))
  })

  // Check if a default gift is already in registry
  const isAlreadyAdded = (template: DefaultGiftTemplate): boolean => {
    return existingGiftNames.value.has(template.name.en.toLowerCase().trim())
  }

  // Filtered templates by category and search
  const filteredTemplates = computed(() => {
    let templates =
      selectedCategory.value === 'all'
        ? DEFAULT_GIFT_TEMPLATES
        : DEFAULT_GIFT_TEMPLATES.filter((t) => t.category === selectedCategory.value)

    // Apply search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      templates = templates.filter(
        (t) =>
          t.name.en.toLowerCase().includes(query) || t.description.en.toLowerCase().includes(query)
      )
    }

    return templates
  })

  // Group by category for display
  const templatesByCategory = computed(() => {
    const grouped: Partial<Record<GiftCategory, DefaultGiftTemplate[]>> = {}
    for (const template of filteredTemplates.value) {
      if (!grouped[template.category]) {
        grouped[template.category] = []
      }
      grouped[template.category]!.push(template)
    }
    return grouped
  })

  // Categories with templates
  const categoriesWithTemplates = computed(() => {
    return (GIFT_CATEGORIES as readonly GiftCategory[]).filter(
      (cat) => (templatesByCategory.value[cat]?.length ?? 0) > 0
    )
  })

  // Available slots
  const availableSlots = computed(() => props.maxItems - props.currentCount)

  // Count selected that are NOT already added
  const validSelectedCount = computed(() => {
    let count = 0
    for (const id of selectedGifts.value) {
      const template = DEFAULT_GIFT_TEMPLATES.find((t) => t.id === id)
      if (template && !isAlreadyAdded(template)) {
        count++
      }
    }
    return count
  })

  // Check if there are unsaved selections
  const hasUnsavedSelections = computed(() => validSelectedCount.value > 0)

  // Can add selected based on selection count and available slots
  const canAddSelected = computed(() => {
    return (
      validSelectedCount.value > 0 &&
      validSelectedCount.value <= availableSlots.value &&
      !isAdding.value
    )
  })

  // Check if selection is at capacity (can't select more)
  const isAtSelectionCapacity = computed(() => {
    return validSelectedCount.value >= availableSlots.value
  })

  // Show warning with auto-dismiss
  const showSelectionWarning = (message: string) => {
    if (selectionWarningTimeout) {
      clearTimeout(selectionWarningTimeout)
    }
    selectionWarning.value = message
    selectionWarningTimeout = setTimeout(() => {
      selectionWarning.value = null
    }, 3000)
  }

  // Check if a card can be selected (not already added, not at capacity or already selected)
  const canSelectCard = (template: DefaultGiftTemplate): boolean => {
    if (isAlreadyAdded(template)) return false
    if (isSelected(template.id)) return true // Can always deselect
    return !isAtSelectionCapacity.value
  }

  // Is a gift selected
  const isSelected = (templateId: string): boolean => {
    return selectedGifts.value.has(templateId)
  }

  // Toggle selection
  const toggleSelection = (templateId: string) => {
    const template = DEFAULT_GIFT_TEMPLATES.find((t) => t.id === templateId)
    if (!template || isAlreadyAdded(template) || isAdding.value) return

    const newSet = new Set(selectedGifts.value)
    if (newSet.has(templateId)) {
      newSet.delete(templateId)
      selectionWarning.value = null // Clear warning when deselecting
    } else {
      // Check if we can add more
      if (validSelectedCount.value < availableSlots.value) {
        newSet.add(templateId)
      } else {
        // Show warning message
        showSelectionWarning(adminT.value.gifts.selectionLimitReached)
        return
      }
    }
    selectedGifts.value = newSet
  }

  // Select all visible that aren't already added
  const selectAll = () => {
    const newSet = new Set(selectedGifts.value)
    let added = 0
    for (const template of filteredTemplates.value) {
      if (!isAlreadyAdded(template) && !newSet.has(template.id)) {
        if (validSelectedCount.value + added < availableSlots.value) {
          newSet.add(template.id)
          added++
        }
      }
    }
    selectedGifts.value = newSet
  }

  // Deselect all
  const deselectAll = () => {
    selectedGifts.value = new Set()
  }

  // Add selected gifts
  const handleAddSelected = async () => {
    if (!canAddSelected.value) return

    isAdding.value = true
    addError.value = null
    addSuccess.value = null

    const selectedIds = Array.from(selectedGifts.value)
    const templates = selectedIds
      .map((id) => DEFAULT_GIFT_TEMPLATES.find((t) => t.id === id))
      .filter((t): t is DefaultGiftTemplate => t !== undefined && !isAlreadyAdded(t))

    addProgress.value = { current: 0, total: templates.length }

    let successCount = 0

    for (const template of templates) {
      const giftData: CreateGiftRequest = {
        name: template.name,
        description: template.description,
        category: template.category,
        priority: template.priority,
        priceRange: template.priceRange,
        externalLink: '',
        quantityTotal: template.quantityTotal,
      }

      try {
        const result = await createGiftItem(giftData, props.weddingId)
        if (result.success) {
          successCount++
        }
      } catch (err) {
        console.error('Failed to add gift:', template.name.en, err)
      }

      addProgress.value.current++
    }

    isAdding.value = false
    selectedGifts.value = new Set()

    if (successCount > 0) {
      addSuccess.value = interpolate(adminT.value.gifts.giftsAddedSuccess, {
        count: String(successCount),
      })
      emit('giftsAdded', successCount)

      // Clear success after delay
      setTimeout(() => {
        addSuccess.value = null
      }, 3000)
    } else if (templates.length === 0) {
      addError.value = adminT.value.gifts.noDuplicatesFound
    }
  }

  // Force close modal (bypasses confirmation)
  const forceClose = () => {
    selectedGifts.value = new Set()
    addError.value = null
    addSuccess.value = null
    showDiscardConfirm.value = false
    emit('update:modelValue', false)
  }

  // Attempt to close modal (shows confirmation if has unsaved selections)
  const attemptClose = () => {
    if (isAdding.value) return // Don't close while adding
    if (hasUnsavedSelections.value) {
      showDiscardConfirm.value = true
    } else {
      forceClose()
    }
  }

  // Handle discard confirmation
  const handleDiscardConfirm = () => {
    forceClose()
  }

  // Handle discard cancel (go back to selection)
  const handleDiscardCancel = () => {
    showDiscardConfirm.value = false
  }

  // Handle backdrop click
  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      attemptClose()
    }
  }

  // Handle ESC key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue && !showDiscardConfirm.value) {
      attemptClose()
    }
  }

  // Watch for modal open/close
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'
      } else {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
    if (selectionWarningTimeout) {
      clearTimeout(selectionWarningTimeout)
    }
  })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div
            class="bg-white dark:bg-dark-bg-secondary rounded-none sm:rounded-xl shadow-xl max-w-3xl w-full h-full sm:h-auto sm:max-h-[85vh] flex flex-col"
          >
            <!-- Header (sticky on mobile) -->
            <div
              class="px-4 sm:px-6 py-3 sm:py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-dark-bg-secondary shadow-sm sm:shadow-none sm:static"
            >
              <div>
                <h3
                  class="font-heading text-base sm:text-lg font-medium text-charcoal dark:text-dark-text"
                >
                  {{ adminT.gifts.defaultGifts }}
                </h3>
                <p
                  class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ currentCount }}/{{ maxItems }}
                  {{ adminT.gifts.itemsCount.replace('{count}', '') }}
                  <span v-if="validSelectedCount > 0" class="text-sage ml-2">
                    ({{
                      interpolate(adminT.gifts.selectedCount, {
                        count: String(validSelectedCount),
                      })
                    }})
                  </span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <!-- Filter toggle button (mobile only) -->
                <button
                  type="button"
                  class="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  :class="
                    isFilterExpanded
                      ? 'bg-sage text-white'
                      : 'bg-sand dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-sand-dark dark:hover:bg-dark-border'
                  "
                  @click="toggleFilterExpanded"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  {{ adminT.gifts.filters || 'Filters' }}
                </button>
                <!-- Card/List View Toggle -->
                <div
                  class="flex rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border"
                >
                  <button
                    type="button"
                    class="p-1.5 transition-colors cursor-pointer"
                    :class="
                      browserViewMode === 'card'
                        ? 'bg-sage text-white'
                        : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg'
                    "
                    :title="adminT.gifts.cardView"
                    @click="setBrowserViewMode('card')"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 transition-colors cursor-pointer"
                    :class="
                      browserViewMode === 'list'
                        ? 'bg-sage text-white'
                        : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg'
                    "
                    :title="adminT.gifts.listView"
                    @click="setBrowserViewMode('list')"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                  title="Close (ESC)"
                  @click="attemptClose"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Limit Reached Alert -->
            <div
              v-if="!canAddMore"
              class="px-4 sm:px-6 py-2 sm:py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 flex-shrink-0"
            >
              <div class="flex items-start gap-3">
                <svg
                  class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p class="font-body text-sm font-medium text-amber-800 dark:text-amber-200">
                    {{ adminT.gifts.limitReached }}
                  </p>
                  <p class="font-body text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    {{ adminT.gifts.limitReachedTooltip }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Hint Banner (dismissible) -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="!isHintDismissed"
                class="px-4 sm:px-6 py-2 sm:py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex-shrink-0"
              >
                <div class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p class="font-body text-xs text-blue-700 dark:text-blue-300 flex-1">
                    {{ adminT.gifts.defaultGiftsHint }}
                  </p>
                  <button
                    type="button"
                    class="p-0.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-200 cursor-pointer flex-shrink-0"
                    @click="dismissHint"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Collapsible Filter Section (collapsed on mobile by default, always visible on desktop) -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out overflow-hidden"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-40"
              leave-active-class="transition-all duration-150 ease-in overflow-hidden"
              leave-from-class="opacity-100 max-h-40"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-show="!isMobileDevice || isFilterExpanded" class="flex-shrink-0">
                <!-- Search Input -->
                <div
                  class="px-4 sm:px-6 py-2 sm:py-3 border-b border-sand-dark dark:border-dark-border"
                >
                  <div class="relative">
                    <!-- Search Icon -->
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                      <svg
                        class="w-4 h-4 text-charcoal-light dark:text-dark-text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      v-model="searchQuery"
                      type="text"
                      :placeholder="adminT.gifts.searchGifts"
                      class="w-full pl-10 pr-10 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage"
                    />
                    <!-- Clear Button -->
                    <button
                      v-if="searchQuery"
                      type="button"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      @click="searchQuery = ''"
                    >
                      <svg
                        class="w-4 h-4 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Category Filter -->
                <div
                  class="px-4 sm:px-6 py-2 sm:py-3 border-b border-sand-dark dark:border-dark-border"
                >
                  <div class="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      v-for="cat in ['all', ...GIFT_CATEGORIES] as const"
                      :key="cat"
                      type="button"
                      class="px-3 py-1.5 font-body text-xs font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
                      :class="
                        selectedCategory === cat
                          ? 'bg-sage text-white'
                          : 'bg-sand dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary hover:bg-sand-dark dark:hover:bg-dark-border'
                      "
                      @click="selectedCategory = cat"
                    >
                      {{ categoryLabels[cat] }} ({{ categoryCounts[cat] }})
                    </button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Messages -->
            <div
              v-if="addSuccess"
              class="px-4 sm:px-6 py-2 bg-green-50 dark:bg-green-900/20 flex-shrink-0"
            >
              <p class="font-body text-sm text-green-700 dark:text-green-300">{{ addSuccess }}</p>
            </div>
            <div
              v-if="addError"
              class="px-4 sm:px-6 py-2 bg-red-50 dark:bg-red-900/20 flex-shrink-0"
            >
              <p class="font-body text-sm text-red-700 dark:text-red-300">{{ addError }}</p>
            </div>
            <div v-if="isAdding" class="px-4 sm:px-6 py-2 bg-sage/10 dark:bg-sage/20 flex-shrink-0">
              <p class="font-body text-sm text-sage dark:text-sage-light">
                {{
                  interpolate(adminT.gifts.addingProgress, {
                    current: String(addProgress.current),
                    total: String(addProgress.total),
                  })
                }}
              </p>
            </div>
            <!-- Selection Limit Warning -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="selectionWarning"
                class="px-4 sm:px-6 py-2 bg-amber-50 dark:bg-amber-900/20 flex-shrink-0 flex items-center gap-2"
              >
                <svg
                  class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p class="font-body text-sm text-amber-700 dark:text-amber-300">
                  {{ selectionWarning }}
                </p>
              </div>
            </Transition>

            <!-- Selection Actions -->
            <div
              v-if="filteredTemplates.length > 0"
              class="px-4 sm:px-6 py-2 border-b border-sand-dark dark:border-dark-border flex items-center gap-3 flex-shrink-0"
            >
              <button
                type="button"
                class="font-body text-xs text-sage hover:text-sage-dark dark:hover:text-sage-light cursor-pointer"
                :disabled="isAdding"
                @click="selectAll"
              >
                Select All
              </button>
              <span class="text-charcoal-light/50">|</span>
              <button
                type="button"
                class="font-body text-xs text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                :disabled="isAdding"
                @click="deselectAll"
              >
                Deselect All
              </button>
            </div>

            <!-- Results Count (when searching) -->
            <div
              v-if="searchQuery.trim()"
              class="px-4 sm:px-6 py-2 text-xs font-body text-charcoal-light dark:text-dark-text-secondary flex-shrink-0"
            >
              {{
                interpolate(adminT.gifts.giftsFound, {
                  count: String(filteredTemplates.length),
                })
              }}
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto">
              <!-- Empty filtered results -->
              <div v-if="filteredTemplates.length === 0" class="text-center py-12 px-6">
                <svg
                  class="w-12 h-12 mx-auto mb-4 text-charcoal-light/30 dark:text-dark-text-secondary/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p class="font-body text-charcoal-light dark:text-dark-text-secondary mb-1">
                  {{
                    searchQuery.trim() ? adminT.gifts.noSearchResults : 'No gifts in this category'
                  }}
                </p>
                <p
                  v-if="searchQuery.trim()"
                  class="font-body text-sm text-charcoal-light/70 dark:text-dark-text-secondary/70"
                >
                  {{ adminT.gifts.tryDifferentSearch }}
                </p>
              </div>

              <!-- Gift Accordion -->
              <div v-else class="p-4">
                <!-- Expand/Collapse All (mobile only, when viewing all categories) -->
                <div
                  v-if="selectedCategory === 'all'"
                  class="flex justify-end gap-2 mb-3 sm:hidden"
                >
                  <button
                    type="button"
                    class="font-body text-xs text-sage hover:text-sage-dark cursor-pointer"
                    @click="expandAllCategories"
                  >
                    {{ adminT.gifts.expandAll }}
                  </button>
                  <span class="text-charcoal-light/50">|</span>
                  <button
                    type="button"
                    class="font-body text-xs text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                    @click="collapseAllCategories"
                  >
                    {{ adminT.gifts.collapseAll }}
                  </button>
                </div>

                <div v-for="category in categoriesWithTemplates" :key="category" class="mb-3">
                  <!-- Category Accordion Header (only when viewing all categories) -->
                  <button
                    v-if="selectedCategory === 'all'"
                    type="button"
                    class="w-full flex items-center justify-between p-3 bg-sand/50 dark:bg-dark-bg rounded-lg cursor-pointer hover:bg-sand dark:hover:bg-dark-bg/80 transition-colors"
                    :class="{ 'rounded-b-none': isCategoryExpanded(category) }"
                    :aria-expanded="isCategoryExpanded(category)"
                    @click="toggleCategory(category)"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                        {{ categoryLabels[category] }}
                      </span>
                      <span class="px-1.5 py-0.5 text-xs rounded-full bg-sage/20 text-sage">
                        {{ templatesByCategory[category]?.length ?? 0 }}
                      </span>
                      <!-- Show selected count in this category -->
                      <span
                        v-if="getSelectedCountInCategory(category) > 0"
                        class="px-1.5 py-0.5 text-xs rounded-full bg-sage text-white"
                      >
                        {{ getSelectedCountInCategory(category) }} selected
                      </span>
                    </div>
                    <svg
                      class="w-4 h-4 text-charcoal-light dark:text-dark-text-secondary transition-transform"
                      :class="{ 'rotate-180': isCategoryExpanded(category) }"
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

                  <!-- Category Content (collapsible when viewing all, always visible when filtered) -->
                  <Transition
                    enter-active-class="transition-all duration-200 ease-out overflow-hidden"
                    enter-from-class="opacity-0 max-h-0"
                    enter-to-class="opacity-100 max-h-[2000px]"
                    leave-active-class="transition-all duration-150 ease-in overflow-hidden"
                    leave-from-class="opacity-100 max-h-[2000px]"
                    leave-to-class="opacity-0 max-h-0"
                  >
                    <div
                      v-if="selectedCategory !== 'all' || isCategoryExpanded(category)"
                      :class="
                        selectedCategory === 'all'
                          ? 'border-x border-b border-sand-dark/50 dark:border-dark-border/50 rounded-b-lg'
                          : ''
                      "
                    >
                      <!-- Card View -->
                      <div
                        v-if="browserViewMode === 'card'"
                        class="p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
                        :class="{ 'pt-0': selectedCategory !== 'all' }"
                      >
                        <div
                          v-for="template in templatesByCategory[category]"
                          :key="template.id"
                          class="bg-white dark:bg-dark-bg rounded-lg border overflow-hidden cursor-pointer transition-all"
                          :class="[
                            isAlreadyAdded(template)
                              ? 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                              : isSelected(template.id)
                                ? 'border-sage ring-1 ring-sage'
                                : canSelectCard(template)
                                  ? 'border-sand-dark/50 dark:border-dark-border/50 hover:border-sage/50'
                                  : 'border-sand-dark/30 opacity-50 cursor-not-allowed',
                          ]"
                          :title="
                            !canSelectCard(template) && !isAlreadyAdded(template)
                              ? adminT.gifts.selectionLimitReached
                              : ''
                          "
                          @click="toggleSelection(template.id)"
                        >
                          <!-- Image Placeholder -->
                          <div
                            class="relative aspect-video bg-sand dark:bg-dark-bg-secondary flex items-center justify-center"
                          >
                            <svg
                              class="w-8 h-8 sm:w-10 sm:h-10 text-charcoal-light/30"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                              />
                            </svg>

                            <!-- Priority Badge -->
                            <span
                              v-if="template.priority === 'high'"
                              class="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-body rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            >
                              {{ adminT.gifts.needed }}
                            </span>

                            <!-- Selection Checkbox Overlay -->
                            <div class="absolute top-1 left-1">
                              <div
                                v-if="isAlreadyAdded(template)"
                                class="w-5 h-5 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30"
                              >
                                <svg
                                  class="w-3 h-3 text-green-600 dark:text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                              <div
                                v-else
                                class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                                :class="
                                  isSelected(template.id)
                                    ? 'bg-sage border-sage'
                                    : 'border-charcoal-light/30 dark:border-dark-text-secondary/30 bg-white/80 dark:bg-dark-bg/80'
                                "
                              >
                                <svg
                                  v-if="isSelected(template.id)"
                                  class="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <!-- Content -->
                          <div class="p-2">
                            <h4
                              class="font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text truncate"
                            >
                              {{ template.name.en }}
                            </h4>
                            <p
                              class="font-body text-[10px] sm:text-xs text-charcoal-light dark:text-dark-text-secondary"
                            >
                              {{ template.priceRange }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- List View -->
                      <div
                        v-else
                        class="p-3 grid grid-cols-2 gap-2"
                        :class="{ 'pt-0': selectedCategory !== 'all' }"
                      >
                        <!-- Compact gift cards -->
                        <div
                          v-for="template in templatesByCategory[category]"
                          :key="template.id"
                          class="flex items-center gap-2 sm:gap-3 p-2 rounded-lg border transition-all"
                          :class="[
                            isAlreadyAdded(template)
                              ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                              : isSelected(template.id)
                                ? 'border-sage bg-sage/5 dark:bg-sage/10 cursor-pointer'
                                : canSelectCard(template)
                                  ? 'border-sand-dark/50 dark:border-dark-border/50 hover:border-sage/50 cursor-pointer'
                                  : 'border-sand-dark/30 dark:border-dark-border/30 opacity-50 cursor-not-allowed',
                          ]"
                          :title="
                            !canSelectCard(template) && !isAlreadyAdded(template)
                              ? adminT.gifts.selectionLimitReached
                              : ''
                          "
                          @click="toggleSelection(template.id)"
                        >
                          <!-- Checkbox -->
                          <div class="flex-shrink-0">
                            <div
                              v-if="isAlreadyAdded(template)"
                              class="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center bg-green-100 dark:bg-green-900/30"
                            >
                              <svg
                                class="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <div
                              v-else
                              class="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors"
                              :class="
                                isSelected(template.id)
                                  ? 'bg-sage border-sage'
                                  : 'border-charcoal-light/30 dark:border-dark-text-secondary/30'
                              "
                            >
                              <svg
                                v-if="isSelected(template.id)"
                                class="w-3 h-3 sm:w-4 sm:h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>

                          <!-- Gift Info (compact) -->
                          <div class="flex-1 min-w-0">
                            <h4
                              class="font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text truncate"
                            >
                              {{ template.name.en }}
                            </h4>
                            <div class="flex items-center gap-1 sm:gap-2 mt-0.5 flex-wrap">
                              <span
                                class="text-[10px] sm:text-xs text-charcoal-light dark:text-dark-text-secondary"
                              >
                                {{ template.priceRange }}
                              </span>
                              <span
                                v-if="template.priority === 'high'"
                                class="px-1 py-0.5 text-[10px] sm:text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              >
                                {{ adminT.gifts.priorityHigh }}
                              </span>
                              <span
                                v-if="isAlreadyAdded(template)"
                                class="text-[10px] sm:text-xs text-green-600 dark:text-green-400 sm:hidden"
                              >
                                {{ adminT.gifts.alreadyInRegistry }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Footer (sticky on mobile) -->
            <div
              class="px-4 sm:px-6 py-3 sm:py-4 border-t border-sand-dark dark:border-dark-border flex items-center justify-between flex-shrink-0 sticky bottom-0 z-10 bg-white dark:bg-dark-bg-secondary shadow-[0_-2px_10px_rgba(0,0,0,0.05)] sm:shadow-none sm:static"
            >
              <button
                type="button"
                class="px-3 sm:px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                :disabled="isAdding"
                @click="attemptClose"
              >
                {{ adminT.common.cancel }}
              </button>
              <button
                type="button"
                :disabled="!canAddSelected"
                class="px-4 sm:px-6 py-2 font-body text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-sage text-white hover:bg-sage-dark"
                @click="handleAddSelected"
              >
                <span v-if="isAdding">{{ adminT.gifts.addingGifts }}</span>
                <span v-else>{{
                  interpolate(adminT.gifts.addSelectedGifts, { count: String(validSelectedCount) })
                }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Discard Selection Confirmation Modal -->
  <ConfirmModal
    :show="showDiscardConfirm"
    :title="adminT.gifts.discardSelectionTitle"
    :message="
      interpolate(adminT.gifts.discardSelectionMessage, { count: String(validSelectedCount) })
    "
    :confirm-text="adminT.gifts.discardSelectionConfirm"
    :cancel-text="adminT.gifts.discardSelectionCancel"
    variant="warning"
    @confirm="handleDiscardConfirm"
    @cancel="handleDiscardCancel"
  />
</template>
