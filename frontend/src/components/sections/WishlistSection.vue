<script setup lang="ts">
  import { ref, onMounted, reactive } from 'vue'
  import { usePublicGifts } from '@/composables/usePublicGifts'
  import { useLanguage } from '@/composables/useLanguage'
  import type { GiftItem, ReserveGiftRequest } from '@/types/gift'

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

  // Category filter
  const selectedCategory = ref<string>('all')

  // Get localized text
  const getLocalizedText = (text: Record<string, string>): string => {
    return text[currentLanguage.value] || text.en || ''
  }

  // Filter gifts by category
  const filteredGifts = () => {
    if (selectedCategory.value === 'all') {
      return gifts.value
    }
    return gifts.value.filter((g) => g.category === selectedCategory.value)
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
    if (!selectedGift.value || !formData.guestName.trim() || !formData.guestPhone.trim()) {
      return
    }

    const trimmedMessage = formData.message?.trim()
    await reserveGiftItem(selectedGift.value.id, {
      guestName: formData.guestName.trim(),
      guestPhone: formData.guestPhone.trim(),
      quantity: formData.quantity ?? 1,
      ...(trimmedMessage ? { message: trimmedMessage } : {}),
    })

    // Keep modal open to show success/error state
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

  // Get category label from translations
  const getCategoryLabel = (category: string): string => {
    const categories = t.value.wishlist?.categories as Record<string, string> | undefined
    return categories?.[category] || category
  }

  onMounted(() => {
    fetchGifts()
  })
</script>

<template>
  <section
    v-if="isEnabled && hasGifts"
    id="wishlist"
    class="py-12 sm:py-16 px-4 sm:px-6 bg-sand dark:bg-dark-bg transition-colors duration-300"
  >
    <div class="max-w-4xl mx-auto">
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

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div
          class="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin"
        ></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="text-center py-8">
        <p class="text-red-500 dark:text-red-400">{{ loadError }}</p>
        <button
          @click="fetchGifts(true)"
          class="mt-4 px-4 py-2 text-sm font-body text-sage hover:text-sage-dark dark:text-sage-light"
        >
          {{ t.wishlist?.tryAgain || 'Try Again' }}
        </button>
      </div>

      <!-- Gifts Grid -->
      <div v-else>
        <!-- Category Filter -->
        <div class="flex flex-wrap justify-center gap-2 mb-6">
          <button
            @click="selectedCategory = 'all'"
            :class="[
              'px-3 py-1.5 text-xs sm:text-sm font-body rounded-full transition-colors',
              selectedCategory === 'all'
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sage-light dark:hover:bg-sage/20',
            ]"
          >
            {{ t.wishlist?.categories?.all || 'All' }}
          </button>
          <button
            v-for="cat in ['home', 'kitchen', 'electronics', 'experiences', 'other']"
            :key="cat"
            @click="selectedCategory = cat"
            :class="[
              'px-3 py-1.5 text-xs sm:text-sm font-body rounded-full transition-colors',
              selectedCategory === cat
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sage-light dark:hover:bg-sage/20',
            ]"
          >
            {{ getCategoryLabel(cat) }}
          </button>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="gift in filteredGifts()"
            :key="gift.id"
            :class="[
              'bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg overflow-hidden flex flex-col transition-all duration-300',
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
                  class="w-12 h-12 text-charcoal-light/30"
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
                  class="px-3 py-1.5 bg-charcoal/80 text-white text-xs sm:text-sm font-body rounded-full"
                >
                  {{ t.wishlist?.fullyReserved || 'Fully Reserved' }}
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text mb-1">
                {{ getLocalizedText(gift.name) }}
              </h3>
              <p
                class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary mb-2 line-clamp-2"
              >
                {{ getLocalizedText(gift.description) }}
              </p>

              <!-- Notes -->
              <p
                v-if="gift.notes"
                class="font-body text-xs text-sage-dark dark:text-sage-light italic mb-2"
              >
                {{ gift.notes }}
              </p>

              <!-- Price Range -->
              <p class="font-body text-sm text-charcoal dark:text-dark-text mb-3">
                {{ gift.priceRange }}
              </p>

              <!-- Availability -->
              <p
                :class="[
                  'font-body text-xs mb-3',
                  isGiftAvailable(gift)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400',
                ]"
              >
                {{ getAvailabilityText(gift) }}
              </p>

              <!-- Actions -->
              <div class="mt-auto flex gap-2">
                <a
                  :href="gift.externalLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 py-2 px-3 text-xs sm:text-sm font-body text-center text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors"
                >
                  {{ t.wishlist?.viewOnStore || 'View' }}
                </a>
                <button
                  @click="openReserveModal(gift)"
                  :disabled="!isGiftAvailable(gift)"
                  :class="[
                    'flex-1 py-2 px-3 text-xs sm:text-sm font-body rounded-lg transition-colors',
                    isGiftAvailable(gift)
                      ? 'bg-sage text-white hover:bg-sage-dark'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed',
                  ]"
                >
                  {{
                    isGiftAvailable(gift)
                      ? t.wishlist?.reserveButton || 'Reserve'
                      : t.wishlist?.fullyReserved || 'Reserved'
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <p
          class="mt-8 text-center font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary italic"
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
</style>
