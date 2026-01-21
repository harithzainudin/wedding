<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { usePublicGifts } from '@/composables/usePublicGifts'
  import { useLanguage } from '@/composables/useLanguage'
  import type { GiftItem, ReserveGiftRequest, GiftCategory } from '@/types/gift'

  const route = useRoute()
  const router = useRouter()
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })

  const { t, currentLanguage } = useLanguage()
  const {
    gifts,
    isEnabled,
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

  // Selected category filter
  const selectedCategory = ref<string>('all')

  // Max gifts to show in preview
  const MAX_GIFTS_PREVIEW = 6

  // Get localized text
  const getLocalizedText = (text: Record<string, string>): string => {
    return text[currentLanguage.value] || text.en || ''
  }

  // Group gifts by category for counting
  const giftsByCategory = computed(() => {
    const grouped: Record<string, GiftItem[]> = {}
    for (const gift of gifts.value) {
      const category = gift.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category]!.push(gift)
    }
    return grouped
  })

  // Categories with their counts
  const categoryOrder: GiftCategory[] = ['home', 'kitchen', 'electronics', 'experiences', 'other']
  const categoriesWithCounts = computed(() => {
    const result: Array<{ value: string; count: number }> = [
      { value: 'all', count: gifts.value.length },
    ]
    for (const cat of categoryOrder) {
      const count = giftsByCategory.value[cat]?.length ?? 0
      if (count > 0) {
        result.push({ value: cat, count })
      }
    }
    return result
  })

  // Filter gifts by selected category
  const filteredGifts = computed(() => {
    if (selectedCategory.value === 'all') {
      return gifts.value
    }
    return gifts.value.filter((g) => g.category === selectedCategory.value)
  })

  // Get preview gifts (max 6)
  const previewGifts = computed(() => {
    return filteredGifts.value.slice(0, MAX_GIFTS_PREVIEW)
  })

  // Check if there are more gifts than shown
  const hasMoreGifts = computed(() => {
    return filteredGifts.value.length > MAX_GIFTS_PREVIEW
  })

  // Get remaining count
  const remainingCount = computed(() => {
    return filteredGifts.value.length - MAX_GIFTS_PREVIEW
  })

  // Get category label from translations
  const getCategoryLabel = (category: string): string => {
    const categories = t.value.wishlist?.categories as Record<string, string> | undefined
    return categories?.[category] || category
  }

  // Navigate to full gifts page with current category filter
  const goToGiftsPageWithCategory = () => {
    const basePath = weddingSlug.value ? `/${weddingSlug.value}/gifts` : '/gifts'
    if (selectedCategory.value !== 'all') {
      router.push({ path: basePath, query: { category: selectedCategory.value } })
    } else {
      router.push(basePath)
    }
  }

  // Navigate to full gifts page (always shows all gifts)
  const goToGiftsPage = () => {
    const basePath = weddingSlug.value ? `/${weddingSlug.value}/gifts` : '/gifts'
    router.push(basePath)
  }

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

  // Horizontal scroll for cards
  const cardsContainer = ref<HTMLElement | null>(null)

  const scrollCardsLeft = () => {
    if (cardsContainer.value) {
      cardsContainer.value.scrollBy({ left: -280, behavior: 'smooth' })
    }
  }

  const scrollCardsRight = () => {
    if (cardsContainer.value) {
      cardsContainer.value.scrollBy({ left: 280, behavior: 'smooth' })
    }
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
</script>

<template>
  <section
    v-if="isEnabled"
    id="wishlist"
    class="py-12 sm:py-16 px-4 sm:px-6 bg-sand dark:bg-dark-bg transition-colors duration-300"
  >
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 sm:mb-10">
        <h2
          class="font-heading text-xl sm:text-2xl md:text-3xl text-sage-dark dark:text-sage-light mb-2"
        >
          {{ t.wishlist?.title || 'Gift Wishlist' }}
        </h2>
        <p
          class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary max-w-2xl mx-auto"
        >
          {{
            t.wishlist?.subtitle ||
            "If you'd like to bless us with a gift, here are some ideas. Your presence is the greatest gift!"
          }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div
          class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="mt-2 font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ t.wishlist?.loading || 'Loading wishlist...' }}
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-8">
        <p class="font-body text-sm text-red-500 dark:text-red-400">
          {{ t.wishlist?.errorLoading || 'Failed to load wishlist.' }}
        </p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasGifts" class="text-center py-8">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ t.wishlist?.noItems || 'No gifts in the wishlist at the moment.' }}
        </p>
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Category Filter Tabs (horizontal scroll) -->
        <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:-mx-0 sm:px-0">
          <button
            v-for="cat in categoriesWithCounts"
            :key="cat.value"
            @click="selectedCategory = cat.value"
            :class="[
              'flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm font-body rounded-full transition-colors cursor-pointer whitespace-nowrap',
              selectedCategory === cat.value
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sage-light dark:hover:bg-sage/20',
            ]"
          >
            {{ getCategoryLabel(cat.value) }}
            <span class="ml-1 opacity-70">({{ cat.count }})</span>
          </button>
        </div>

        <!-- Cards Section -->
        <div class="relative group">
          <!-- Left Arrow (desktop) -->
          <button
            @click="scrollCardsLeft"
            class="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white dark:bg-dark-bg-secondary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sand dark:hover:bg-dark-bg cursor-pointer"
          >
            <svg
              class="w-5 h-5 text-charcoal dark:text-dark-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <!-- Gift Cards Container -->
          <div
            ref="cardsContainer"
            class="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4 sm:-mx-0 sm:px-0"
          >
            <!-- Gift Cards -->
            <div
              v-for="gift in previewGifts"
              :key="gift.id"
              :class="[
                'flex-shrink-0 w-64 sm:w-72 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg overflow-hidden flex flex-col transition-all duration-300',
                !isGiftAvailable(gift) && 'opacity-60 grayscale',
              ]"
            >
              <!-- Image -->
              <div class="relative aspect-video bg-sand-dark dark:bg-dark-bg">
                <img
                  v-if="gift.imageUrl"
                  :src="gift.imageUrl"
                  :alt="getLocalizedText(gift.name)"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg
                    class="w-10 h-10 text-charcoal-light/30"
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
                    'absolute top-2 right-2 px-2 py-0.5 text-xs font-body rounded-full',
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
                    class="px-3 py-1.5 bg-charcoal/80 text-white text-xs font-body rounded-full"
                  >
                    {{ t.wishlist?.fullyReserved || 'Fully Reserved' }}
                  </span>
                </div>
              </div>

              <!-- Content -->
              <div class="p-3 flex-1 flex flex-col">
                <h4
                  class="font-heading text-sm sm:text-base text-charcoal dark:text-dark-text mb-1 line-clamp-1"
                >
                  {{ getLocalizedText(gift.name) }}
                </h4>
                <p
                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2 line-clamp-2"
                >
                  {{ getLocalizedText(gift.description) }}
                </p>

                <!-- Price & Availability -->
                <div class="mt-auto space-y-1">
                  <p
                    v-if="gift.priceRange"
                    class="font-body text-xs text-charcoal dark:text-dark-text"
                  >
                    {{ gift.priceRange }}
                  </p>
                  <p
                    :class="[
                      'font-body text-xs',
                      isGiftAvailable(gift)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400',
                    ]"
                  >
                    {{ getAvailabilityText(gift) }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="mt-3 flex gap-2">
                  <a
                    v-if="gift.externalLink"
                    :href="gift.externalLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 py-1.5 px-2 text-xs font-body text-center text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors cursor-pointer"
                  >
                    {{ t.wishlist?.viewOnStore || 'View' }}
                  </a>
                  <button
                    @click="openReserveModal(gift)"
                    :disabled="!isGiftAvailable(gift)"
                    :class="[
                      'flex-1 py-1.5 px-2 text-xs font-body rounded-lg transition-colors cursor-pointer',
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

            <!-- See More Card (if more gifts) - goes to current category -->
            <button
              v-if="hasMoreGifts"
              @click="goToGiftsPageWithCategory()"
              class="flex-shrink-0 w-32 sm:w-40 bg-white/50 dark:bg-dark-bg-secondary/50 rounded-xl border-2 border-dashed border-sage/30 dark:border-sage/20 flex flex-col items-center justify-center gap-2 hover:bg-sage/5 dark:hover:bg-sage/10 transition-colors cursor-pointer"
            >
              <div
                class="w-10 h-10 rounded-full bg-sage/10 dark:bg-sage/20 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <span class="font-body text-xs text-sage">
                +{{ remainingCount }}
                {{ t.wishlist?.more || 'more' }}
              </span>
            </button>
          </div>

          <!-- Right Arrow (desktop) -->
          <button
            @click="scrollCardsRight"
            class="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white dark:bg-dark-bg-secondary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sand dark:hover:bg-dark-bg cursor-pointer"
          >
            <svg
              class="w-5 h-5 text-charcoal dark:text-dark-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <!-- View All Gifts Button -->
        <div class="text-center pt-4">
          <button
            @click="goToGiftsPage()"
            class="inline-flex items-center gap-2 px-6 py-2.5 font-body text-sm bg-sage text-white rounded-full hover:bg-sage-dark transition-colors cursor-pointer"
          >
            {{ t.wishlist?.viewAllGifts || 'View All Gifts' }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>

        <!-- Footer Note -->
        <p
          class="mt-4 text-center font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary italic"
        >
          {{
            t.wishlist?.footerNote ||
            'Feel free to give any gift from the heart - this list is just to help avoid duplicates!'
          }}
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
                class="px-6 py-2 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
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
                    class="flex-1 py-2.5 px-4 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-gray-600 rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                  >
                    {{ t.wishlist?.cancel || 'Cancel' }}
                  </button>
                  <button
                    type="submit"
                    :disabled="
                      isReserving || !formData.guestName.trim() || !formData.guestPhone.trim()
                    "
                    class="flex-1 py-2.5 px-4 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
</style>
