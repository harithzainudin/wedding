import { ref, computed } from 'vue'
import type { GiftItem, ReserveGiftRequest } from '@/types/gift'
import { listGiftsCached, reserveGift, clearCache } from '@/services/api'
import { CACHE_KEYS } from '@/utils/apiCache'

// Singleton state for public gift list
const gifts = ref<GiftItem[]>([])
const isEnabled = ref(false)
const isLoading = ref(false)
const loadError = ref('')
const isReserving = ref(false)
const reserveError = ref('')
const reserveSuccess = ref(false)

export function usePublicGifts() {
  // Computed
  const sortedGifts = computed(() => [...gifts.value].sort((a, b) => a.order - b.order))

  const availableGifts = computed(() =>
    sortedGifts.value.filter((g) => g.quantityReserved < g.quantityTotal)
  )

  const hasGifts = computed(() => gifts.value.length > 0)

  // Get gifts by category
  const giftsByCategory = computed(() => {
    const categories: Record<string, GiftItem[]> = {}
    for (const gift of sortedGifts.value) {
      if (!categories[gift.category]) {
        categories[gift.category] = []
      }
      const categoryList = categories[gift.category]
      if (categoryList) {
        categoryList.push(gift)
      }
    }
    return categories
  })

  // Get gifts by priority
  const highPriorityGifts = computed(() =>
    sortedGifts.value.filter((g) => g.priority === 'high' && g.quantityReserved < g.quantityTotal)
  )

  // Fetch gifts
  const fetchGifts = async (forceRefresh = false): Promise<void> => {
    isLoading.value = true
    loadError.value = ''

    try {
      const response = await listGiftsCached(forceRefresh)
      gifts.value = response.gifts
      isEnabled.value = response.enabled
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load wishlist'
    } finally {
      isLoading.value = false
    }
  }

  // Reserve a gift
  const reserveGiftItem = async (
    giftId: string,
    data: ReserveGiftRequest
  ): Promise<{ success: boolean; error?: string }> => {
    isReserving.value = true
    reserveError.value = ''
    reserveSuccess.value = false

    try {
      await reserveGift(giftId, data)

      // Update local state
      const gift = gifts.value.find((g) => g.id === giftId)
      if (gift) {
        gift.quantityReserved += data.quantity ?? 1
      }

      // Clear cache to get fresh data next time
      clearCache(CACHE_KEYS.GIFTS)

      reserveSuccess.value = true
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve gift'
      reserveError.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isReserving.value = false
    }
  }

  // Check if a gift is available
  const isGiftAvailable = (gift: GiftItem): boolean => {
    return gift.quantityReserved < gift.quantityTotal
  }

  // Get availability text
  const getAvailabilityText = (gift: GiftItem): string => {
    const reserved = gift.quantityReserved
    const total = gift.quantityTotal
    const available = total - reserved

    if (available === 0) {
      return 'Fully reserved'
    }
    if (total === 1) {
      return 'Available'
    }
    return `${reserved} of ${total} reserved`
  }

  // Reset reserve state
  const resetReserveState = (): void => {
    reserveError.value = ''
    reserveSuccess.value = false
  }

  return {
    // State
    gifts: sortedGifts,
    isEnabled,
    isLoading,
    loadError,
    isReserving,
    reserveError,
    reserveSuccess,

    // Computed
    availableGifts,
    hasGifts,
    giftsByCategory,
    highPriorityGifts,

    // Methods
    fetchGifts,
    reserveGiftItem,
    isGiftAvailable,
    getAvailabilityText,
    resetReserveState,
  }
}
