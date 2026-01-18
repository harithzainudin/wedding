import { ref, computed, readonly } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getMyWeddings, type WeddingMetadata } from '@/services/api'

// Singleton state for wedding metadata
const assignedWeddings = ref<WeddingMetadata[]>([])
const primaryWeddingId = ref<string | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const hasFetched = ref(false)

/**
 * Composable for managing wedding metadata in the admin panel.
 * Fetches and caches assigned weddings for the current user.
 */
export function useWeddingMetadata() {
  const router = useRouter()
  const route = useRoute()

  /**
   * Fetch assigned weddings from the API
   * Only fetches once, then uses cached data
   */
  const fetchWeddings = async (force = false): Promise<void> => {
    if (hasFetched.value && !force) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await getMyWeddings()
      assignedWeddings.value = response.weddings
      primaryWeddingId.value = response.primaryWeddingId
      hasFetched.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch weddings'
      console.error('Failed to fetch wedding metadata:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get the current wedding based on URL slug
   */
  const currentWedding = computed((): WeddingMetadata | null => {
    const slug = route.params.weddingSlug
    if (!slug || typeof slug !== 'string') {
      // If no slug in URL, try to find by primaryWeddingId
      if (primaryWeddingId.value) {
        return assignedWeddings.value.find((w) => w.weddingId === primaryWeddingId.value) ?? null
      }
      return assignedWeddings.value[0] ?? null
    }
    return assignedWeddings.value.find((w) => w.slug === slug) ?? null
  })

  /**
   * Check if user has multiple weddings
   */
  const hasMultipleWeddings = computed(() => assignedWeddings.value.length > 1)

  /**
   * Switch to a different wedding by navigating to its admin URL
   * Preserves the current tab
   */
  const switchWedding = (wedding: WeddingMetadata): void => {
    const currentTab = (route.params.tab as string) ?? ''
    const newPath = currentTab ? `/${wedding.slug}/admin/${currentTab}` : `/${wedding.slug}/admin`
    router.push(newPath)
  }

  /**
   * Clear cached wedding data (e.g., on logout)
   */
  const clearWeddings = (): void => {
    assignedWeddings.value = []
    primaryWeddingId.value = null
    hasFetched.value = false
    error.value = null
  }

  /**
   * Refresh wedding data (force fetch)
   */
  const refreshWeddings = (): Promise<void> => {
    return fetchWeddings(true)
  }

  return {
    // State (readonly)
    assignedWeddings: readonly(assignedWeddings),
    primaryWeddingId: readonly(primaryWeddingId),
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasFetched: readonly(hasFetched),

    // Computed
    currentWedding,
    hasMultipleWeddings,

    // Actions
    fetchWeddings,
    switchWedding,
    clearWeddings,
    refreshWeddings,
  }
}
