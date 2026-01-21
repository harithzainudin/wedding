<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { usePublicGifts } from '@/composables/usePublicGifts'
  import { useLanguage } from '@/composables/useLanguage'
  import type { GiftItem, ReserveGiftRequest } from '@/types/gift'

  interface Props {
    initialCategory?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    initialCategory: 'all',
  })

  const route = useRoute()
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })

  const { t, currentLanguage } = useLanguage()
  const {
    gifts,
    isLoading,
    loadError,
    isReserving,
    reserveError,
    reserveSuccess,
    hasGifts,
    fetchGifts,
    reserveGiftItem,
    isGiftAvailable,
    getAvailabilityText,
    resetReserveState,
  } = usePublicGifts()

  // Modal state
  const showReserveModal = ref(false)
  const selectedGift = ref<GiftItem | null>(null)

  // Form data
  const formData = reactive<ReserveGiftRequest>({
    guestName: '',
    guestPhone: '',
    quantity: 1,
    message: '',
  })

  // Search and filter state
  const searchQuery = ref('')
  const selectedCategory = ref<string>(props.initialCategory)
  const sortBy = ref<'default' | 'priority' | 'availability' | 'newest'>('default')

  // Category options
  const categories: Array<{ value: string; key: string }> = [
    { value: 'all', key: 'all' },
    { value: 'home', key: 'home' },
    { value: 'kitchen', key: 'kitchen' },
    { value: 'electronics', key: 'electronics' },
    { value: 'experiences', key: 'experiences' },
    { value: 'other', key: 'other' },
  ]

  // Get localized text
  const getLocalizedText = (text: Record<string, string>): string => {
    return text[currentLanguage.value] || text.en || ''
  }

  // Get category label from translations
  const getCategoryLabel = (category: string): string => {
    const categoryTranslations = t.value.wishlist?.categories as Record<string, string> | undefined
    return categoryTranslations?.[category] || category
  }

  // Filter and sort gifts
  const filteredAndSortedGifts = computed(() => {
    let result = [...gifts.value]

    // Filter by category
    if (selectedCategory.value !== 'all') {
      result = result.filter((g) => g.category === selectedCategory.value)
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter((g) => {
        const name = getLocalizedText(g.name).toLowerCase()
        const description = getLocalizedText(g.description).toLowerCase()
        return name.includes(query) || description.includes(query)
      })
    }

    // Sort
    switch (sortBy.value) {
      case 'priority':
        result.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 }
          return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
        })
        break
      case 'availability':
        result.sort((a, b) => {
          const aAvailable = a.quantityTotal - a.quantityReserved
          const bAvailable = b.quantityTotal - b.quantityReserved
          return bAvailable - aAvailable
        })
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      default:
        // Keep original order
        break
    }

    return result
  })

  // Open reserve modal
  const openReserveModal = (gift: GiftItem) => {
    selectedGift.value = gift
    formData.guestName = ''
    formData.guestPhone = ''
    formData.quantity = 1
    formData.message = ''
    resetReserveState()
    showReserveModal.value = true
  }

  // Close modal
  const closeModal = () => {
    showReserveModal.value = false
    selectedGift.value = null
    resetReserveState()
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (
      !selectedGift.value ||
      !formData.guestName.trim() ||
      !formData.guestPhone.trim() ||
      !weddingSlug.value
    ) {
      return
    }

    const trimmedMessage = formData.message?.trim()
    await reserveGiftItem(weddingSlug.value, selectedGift.value.id, {
      guestName: formData.guestName.trim(),
      guestPhone: formData.guestPhone.trim(),
      quantity: formData.quantity ?? 1,
      ...(trimmedMessage ? { message: trimmedMessage } : {}),
    })
  }

  // Get priority badge color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
  }

  watch(
    weddingSlug,
    (slug) => {
      if (slug) {
        fetchGifts(slug)
      }
    },
    { immediate: true }
  )

  // Update category when initial category changes
  watch(
    () => props.initialCategory,
    (newCat) => {
      if (newCat) {
        selectedCategory.value = newCat
      }
    }
  )
</script>

<template>
  <section class="py-8 sm:py-12 bg-white dark:bg-dark-bg-secondary transition-colors duration-300">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <!-- Page Title -->
      <div class="text-center mb-6 sm:mb-8">
        <h2
          class="font-heading text-xl sm:text-2xl md:text-3xl text-sage-dark dark:text-sage-light mb-2"
        >
          {{ t.wishlist?.pageTitle || t.wishlist?.title || 'Gift Registry' }}
        </h2>
        <p
          class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary max-w-2xl mx-auto"
        >
          {{ t.wishlist?.subtitle }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div
          class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="mt-2 font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ t.wishlist?.loading || 'Loading...' }}
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-12">
        <p class="font-body text-sm text-red-500 dark:text-red-400">
          {{ t.wishlist?.errorLoading || 'Failed to load gifts.' }}
        </p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasGifts" class="text-center py-12">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ t.wishlist?.noItems || 'No gifts available.' }}
        </p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Search Bar (scrolls away) -->
        <div class="mb-4">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t.wishlist?.searchPlaceholder || 'Search gifts...'"
              class="w-full pl-10 pr-10 py-2.5 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
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
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text cursor-pointer"
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

        <!-- Sticky Category Tabs & Sort -->
        <div
          class="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 bg-white dark:bg-dark-bg-secondary transition-colors duration-300 sticky-filter-bar"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <!-- Category Tabs -->
            <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:-mx-0 sm:px-0">
              <button
                v-for="cat in categories"
                :key="cat.value"
                @click="selectedCategory = cat.value"
                :class="[
                  'flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm font-body rounded-full transition-colors whitespace-nowrap cursor-pointer',
                  selectedCategory === cat.value
                    ? 'bg-sage text-white'
                    : 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text hover:bg-sage-light dark:hover:bg-sage/20',
                ]"
              >
                {{ getCategoryLabel(cat.key) }}
              </button>
            </div>

            <!-- Sort Dropdown -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ t.wishlist?.sortBy || 'Sort by' }}:
              </span>
              <div class="relative">
                <select
                  v-model="sortBy"
                  class="appearance-none pl-3 pr-8 py-1.5 font-body text-xs sm:text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text focus:outline-none focus:border-sage cursor-pointer"
                >
                  <option value="default">{{ t.wishlist?.sortDefault || 'Default' }}</option>
                  <option value="priority">{{ t.wishlist?.sortPriority || 'Priority' }}</option>
                  <option value="availability">{{ t.wishlist?.sortAvailability || 'Availability' }}</option>
                  <option value="newest">{{ t.wishlist?.sortNewest || 'Newest' }}</option>
                </select>
                <svg
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light dark:text-dark-text-secondary pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Count -->
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-4">
          {{ filteredAndSortedGifts.length }} {{ t.wishlist?.itemsFound || 'items' }}
        </p>

        <!-- No Results -->
        <div v-if="filteredAndSortedGifts.length === 0" class="text-center py-12">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ t.wishlist?.noResults || 'No gifts found matching your criteria.' }}
          </p>
          <button
            @click="searchQuery = ''; selectedCategory = 'all'"
            class="mt-3 font-body text-sm text-sage hover:text-sage-dark dark:hover:text-sage-light cursor-pointer"
          >
            {{ t.wishlist?.clearFilters || 'Clear filters' }}
          </button>
        </div>

        <!-- Gift Grid -->
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        >
          <div
            v-for="gift in filteredAndSortedGifts"
            :key="gift.id"
            :class="[
              'bg-sand dark:bg-dark-bg rounded-xl shadow-sm dark:shadow-lg overflow-hidden flex flex-col transition-all duration-300',
              !isGiftAvailable(gift) && 'opacity-60 grayscale',
            ]"
          >
            <!-- Image -->
            <div class="relative aspect-video bg-sand-dark dark:bg-dark-bg-secondary">
              <img
                v-if="gift.imageUrl"
                :src="gift.imageUrl"
                :alt="getLocalizedText(gift.name)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg
                  class="w-8 h-8 sm:w-10 sm:h-10 text-charcoal-light/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </div>

              <!-- Priority Badge -->
              <span
                v-if="gift.priority === 'high' && isGiftAvailable(gift)"
                :class="[
                  'absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-body rounded-full',
                  getPriorityColor(gift.priority),
                ]"
              >
                {{ t.wishlist?.needed || 'Needed' }}
              </span>

              <!-- Fully Reserved Overlay -->
              <div
                v-if="!isGiftAvailable(gift)"
                class="absolute inset-0 bg-black/20 flex items-center justify-center"
              >
                <span
                  class="px-2 sm:px-3 py-1 bg-charcoal/80 text-white text-[10px] sm:text-xs font-body rounded-full"
                >
                  {{ t.wishlist?.fullyReserved || 'Reserved' }}
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-2.5 sm:p-4 flex-1 flex flex-col">
              <h3
                class="font-heading text-xs sm:text-sm lg:text-base text-charcoal dark:text-dark-text mb-1 line-clamp-2"
              >
                {{ getLocalizedText(gift.name) }}
              </h3>
              <p
                class="font-body text-[10px] sm:text-xs text-charcoal-light dark:text-dark-text-secondary mb-2 line-clamp-2 hidden sm:block"
              >
                {{ getLocalizedText(gift.description) }}
              </p>

              <!-- Notes (hidden on mobile) -->
              <p
                v-if="gift.notes"
                class="font-body text-[10px] sm:text-xs text-sage-dark dark:text-sage-light italic mb-2 hidden lg:block"
              >
                {{ gift.notes }}
              </p>

              <!-- Price & Availability -->
              <div class="mt-auto space-y-0.5 sm:space-y-1">
                <p
                  v-if="gift.priceRange"
                  class="font-body text-[10px] sm:text-xs text-charcoal dark:text-dark-text"
                >
                  {{ gift.priceRange }}
                </p>
                <p
                  :class="[
                    'font-body text-[10px] sm:text-xs',
                    isGiftAvailable(gift)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400',
                  ]"
                >
                  {{ getAvailabilityText(gift) }}
                </p>
              </div>

              <!-- Actions -->
              <div class="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                <a
                  v-if="gift.externalLink"
                  :href="gift.externalLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 text-[10px] sm:text-xs font-body text-center text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors cursor-pointer"
                >
                  {{ t.wishlist?.viewOnStore || 'View' }}
                </a>
                <button
                  @click="openReserveModal(gift)"
                  :disabled="!isGiftAvailable(gift)"
                  :class="[
                    'flex-1 py-1.5 sm:py-2 px-1.5 sm:px-3 text-[10px] sm:text-xs font-body rounded-lg transition-colors cursor-pointer',
                    isGiftAvailable(gift)
                      ? 'bg-sage text-white hover:bg-sage-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 !cursor-not-allowed',
                  ]"
                >
                  {{ t.wishlist?.reserveButton || 'Reserve' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <p
          class="mt-8 text-center font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary italic"
        >
          {{ t.wishlist?.footerNote }}
        </p>
      </div>
    </div>

    <!-- Reserve Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showReserveModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

          <!-- Modal Content -->
          <div
            class="relative w-full max-w-md bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <!-- Success State -->
            <div v-if="reserveSuccess" class="text-center py-6">
              <div
                class="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-3xl text-white bg-sage rounded-full"
              >
                ✓
              </div>
              <h3 class="font-heading text-xl text-sage-dark dark:text-sage-light mb-2">
                {{ t.wishlist?.thankYou || 'Thank You!' }}
              </h3>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-4">
                {{ t.wishlist?.reservationReceived || 'Your reservation has been received.' }}
              </p>
              <button
                @click="closeModal"
                class="px-6 py-2 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
              >
                {{ t.wishlist?.close || 'Close' }}
              </button>
            </div>

            <!-- Form State -->
            <div v-else>
              <h3 class="font-heading text-lg sm:text-xl text-charcoal dark:text-dark-text mb-1">
                {{ t.wishlist?.reserveTitle || 'Reserve Gift' }}
              </h3>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-4">
                {{ selectedGift ? getLocalizedText(selectedGift.name) : '' }}
              </p>

              <!-- Error -->
              <div
                v-if="reserveError"
                class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p class="text-sm text-red-600 dark:text-red-400">
                  {{ reserveError }}
                </p>
              </div>

              <form @submit.prevent="handleSubmit" class="space-y-4">
                <!-- Name -->
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    {{ t.wishlist?.yourName || 'Your Name' }} *
                  </label>
                  <input
                    v-model="formData.guestName"
                    type="text"
                    required
                    :placeholder="t.wishlist?.namePlaceholder || 'Your full name'"
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  />
                </div>

                <!-- Phone -->
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    {{ t.wishlist?.yourPhone || 'Phone Number' }} *
                  </label>
                  <input
                    v-model="formData.guestPhone"
                    type="tel"
                    required
                    :placeholder="t.wishlist?.phonePlaceholder || '012-3456789'"
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  />
                </div>

                <!-- Message -->
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    {{ t.wishlist?.optionalMessage || 'Message (Optional)' }}
                  </label>
                  <textarea
                    v-model="formData.message"
                    rows="2"
                    :placeholder="
                      t.wishlist?.messagePlaceholder || 'Leave a message for the couple...'
                    "
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text resize-none"
                  ></textarea>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    @click="closeModal"
                    class="flex-1 py-2.5 px-4 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-gray-600 rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors"
                  >
                    {{ t.wishlist?.cancel || 'Cancel' }}
                  </button>
                  <button
                    type="submit"
                    :disabled="
                      isReserving || !formData.guestName.trim() || !formData.guestPhone.trim()
                    "
                    class="flex-1 py-2.5 px-4 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {{
                      isReserving
                        ? t.wishlist?.submitting || 'Submitting...'
                        : t.wishlist?.submitReserve || 'Reserve Now'
                    }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Sticky filter bar - subtle shadow to indicate floating */
  .sticky-filter-bar {
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .sticky-filter-bar {
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.3);
  }
</style>
