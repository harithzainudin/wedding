<script setup lang="ts">
  import { ref, computed, watch, onUnmounted } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useGifts } from '@/composables/useGifts'
  import { interpolate } from '@/i18n/translations'
  import {
    DEFAULT_GIFT_TEMPLATES,
    getDefaultGiftCounts,
    type DefaultGiftTemplate,
  } from '@/constants/defaultGifts'
  import { GIFT_CATEGORIES, type GiftCategory, type CreateGiftRequest } from '@/types/gift'

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

  // Can add selected based on selection count and available slots
  const canAddSelected = computed(() => {
    return (
      validSelectedCount.value > 0 &&
      validSelectedCount.value <= availableSlots.value &&
      !isAdding.value
    )
  })

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
    } else {
      // Check if we can add more
      if (validSelectedCount.value < availableSlots.value) {
        newSet.add(templateId)
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

  // Close modal
  const close = () => {
    selectedGifts.value = new Set()
    addError.value = null
    addSuccess.value = null
    emit('update:modelValue', false)
  }

  // Handle backdrop click
  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  // Handle ESC key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue) {
      close()
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
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
            class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
          >
            <!-- Header -->
            <div
              class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between flex-shrink-0"
            >
              <div>
                <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                  {{ adminT.gifts.defaultGifts }}
                </h3>
                <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                  {{ currentCount }}/{{ maxItems }}
                  {{ adminT.gifts.itemsCount.replace('{count}', '') }}
                  <span v-if="validSelectedCount > 0" class="text-sage ml-2">
                    ({{
                      interpolate(adminT.gifts.selectedCount, {
                        count: String(validSelectedCount),
                      })
                    }})
                  </span>
                  <span v-if="!canAddMore" class="text-amber-600 dark:text-amber-400 ml-2">
                    ({{ adminT.gifts.limitReached }})
                  </span>
                </p>
              </div>
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                title="Close (ESC)"
                @click="close"
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

            <!-- Hint Banner -->
            <div
              class="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex-shrink-0"
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
                <p class="font-body text-xs text-blue-700 dark:text-blue-300">
                  {{ adminT.gifts.defaultGiftsHint }}
                </p>
              </div>
            </div>

            <!-- Search Input -->
            <div class="px-6 py-3 border-b border-sand-dark dark:border-dark-border flex-shrink-0">
              <div class="relative">
                <!-- Search Icon -->
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
            <div class="px-6 py-3 border-b border-sand-dark dark:border-dark-border flex-shrink-0">
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

            <!-- Messages -->
            <div v-if="addSuccess" class="px-6 py-2 bg-green-50 dark:bg-green-900/20 flex-shrink-0">
              <p class="font-body text-sm text-green-700 dark:text-green-300">{{ addSuccess }}</p>
            </div>
            <div v-if="addError" class="px-6 py-2 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
              <p class="font-body text-sm text-red-700 dark:text-red-300">{{ addError }}</p>
            </div>
            <div v-if="isAdding" class="px-6 py-2 bg-sage/10 dark:bg-sage/20 flex-shrink-0">
              <p class="font-body text-sm text-sage dark:text-sage-light">
                {{
                  interpolate(adminT.gifts.addingProgress, {
                    current: String(addProgress.current),
                    total: String(addProgress.total),
                  })
                }}
              </p>
            </div>

            <!-- Selection Actions -->
            <div
              v-if="filteredTemplates.length > 0"
              class="px-6 py-2 border-b border-sand-dark dark:border-dark-border flex items-center gap-3 flex-shrink-0"
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
              class="px-6 py-2 text-xs font-body text-charcoal-light dark:text-dark-text-secondary flex-shrink-0"
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

              <!-- Gift Grid -->
              <div v-else class="p-4">
                <div v-for="category in categoriesWithTemplates" :key="category" class="mb-6">
                  <!-- Category Header (only show when viewing all) -->
                  <div
                    v-if="selectedCategory === 'all'"
                    class="px-2 py-2 text-xs font-medium font-body text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wide mb-3"
                  >
                    {{ categoryLabels[category] }}
                  </div>

                  <!-- Gifts Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      v-for="template in templatesByCategory[category]"
                      :key="template.id"
                      class="relative border rounded-lg p-4 transition-all cursor-pointer"
                      :class="[
                        isAlreadyAdded(template)
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                          : isSelected(template.id)
                            ? 'border-sage bg-sage/5 dark:bg-sage/10 ring-1 ring-sage'
                            : 'border-sand-dark dark:border-dark-border hover:border-sage/50 dark:hover:border-sage/50',
                      ]"
                      @click="toggleSelection(template.id)"
                    >
                      <!-- Checkbox -->
                      <div class="absolute top-3 right-3">
                        <div
                          v-if="isAlreadyAdded(template)"
                          class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {{ adminT.gifts.alreadyInRegistry }}
                        </div>
                        <div
                          v-else
                          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                          :class="
                            isSelected(template.id)
                              ? 'bg-sage border-sage'
                              : 'border-charcoal-light/30 dark:border-dark-text-secondary/30'
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

                      <!-- Gift Info -->
                      <div class="pr-16">
                        <h4 class="font-body font-medium text-charcoal dark:text-dark-text mb-1">
                          {{ template.name.en }}
                        </h4>
                        <p
                          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary line-clamp-2 mb-2"
                        >
                          {{ template.description.en }}
                        </p>
                        <div class="flex items-center gap-2 flex-wrap">
                          <span
                            class="px-2 py-0.5 text-xs rounded-full bg-sand dark:bg-dark-bg text-charcoal-light dark:text-dark-text-secondary"
                          >
                            {{ template.priceRange }}
                          </span>
                          <span
                            class="px-2 py-0.5 text-xs rounded-full"
                            :class="
                              template.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : template.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            "
                          >
                            {{
                              template.priority === 'high'
                                ? adminT.gifts.priorityHigh
                                : template.priority === 'medium'
                                  ? adminT.gifts.priorityMedium
                                  : adminT.gifts.priorityLow
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="px-6 py-4 border-t border-sand-dark dark:border-dark-border flex items-center justify-between flex-shrink-0"
            >
              <button
                type="button"
                class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                :disabled="isAdding"
                @click="close"
              >
                {{ adminT.common.cancel }}
              </button>
              <button
                type="button"
                :disabled="!canAddSelected"
                class="px-6 py-2 font-body text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-sage text-white hover:bg-sage-dark"
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
</template>
