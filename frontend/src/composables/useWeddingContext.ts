import { ref, computed, readonly } from 'vue'
import {
  getStoredPrimaryWeddingId,
  getStoredUserType,
  canAccessWedding,
} from '@/services/tokenManager'

// Singleton state for wedding context
const weddingSlug = ref<string | null>(null)
const weddingId = ref<string | null>(null)
const weddingName = ref<string | null>(null)
const isResolved = ref(false)
const resolveError = ref<string | null>(null)

// API URL for resolving slugs
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface WeddingMetadata {
  weddingId: string
  slug: string
  displayName: string
  status: string
}

interface ResolveSlugResponse {
  success: boolean
  data?: WeddingMetadata
  error?: { message: string }
}

/**
 * Composable for managing wedding context in a multi-tenant environment.
 *
 * For public pages: Uses wedding slug from URL to resolve wedding ID
 * For admin pages: Uses wedding ID from token or route
 */
export function useWeddingContext() {
  /**
   * Resolve a wedding slug to get wedding metadata
   * Called when loading a public wedding page
   */
  const resolveSlug = async (slug: string): Promise<boolean> => {
    if (!slug) {
      resolveError.value = 'Wedding slug is required'
      return false
    }

    try {
      // Use the venue endpoint to validate the wedding exists
      // The backend resolves the slug and returns data if valid
      const response = await fetch(`${API_URL}/${encodeURIComponent(slug)}/venue`)
      const result = (await response.json()) as ResolveSlugResponse

      if (response.ok && result.success) {
        weddingSlug.value = slug
        // For now, we get the weddingId from the settings endpoint
        // In a full implementation, we'd have a dedicated resolve endpoint
        isResolved.value = true
        resolveError.value = null
        return true
      }

      resolveError.value = result.error?.message ?? 'Wedding not found'
      return false
    } catch (error) {
      resolveError.value = 'Failed to resolve wedding'
      console.error('Failed to resolve wedding slug:', error)
      return false
    }
  }

  /**
   * Set wedding context for admin pages using wedding ID
   * Called when loading admin pages
   */
  const setWeddingId = (id: string): boolean => {
    if (!id) {
      resolveError.value = 'Wedding ID is required'
      return false
    }

    // Check if user has access to this wedding
    if (!canAccessWedding(id)) {
      resolveError.value = 'Access denied to this wedding'
      return false
    }

    weddingId.value = id
    isResolved.value = true
    resolveError.value = null
    return true
  }

  /**
   * Set wedding context using both slug and ID
   * Used when navigating from admin with full context
   */
  const setWeddingContext = (slug: string, id: string, name?: string) => {
    weddingSlug.value = slug
    weddingId.value = id
    if (name) {
      weddingName.value = name
    }
    isResolved.value = true
    resolveError.value = null
  }

  /**
   * Initialize wedding context from stored tokens
   * For admin users who have a primary wedding
   */
  const initFromToken = (): boolean => {
    const primaryId = getStoredPrimaryWeddingId()
    const userType = getStoredUserType()

    // Super admins need to select a wedding
    if (userType === 'super') {
      return false
    }

    // Legacy users - for backward compatibility
    if (userType === 'legacy') {
      isResolved.value = true
      return true
    }

    // Wedding owners get their primary wedding
    if (primaryId) {
      weddingId.value = primaryId
      isResolved.value = true
      return true
    }

    return false
  }

  /**
   * Clear wedding context (e.g., on logout)
   */
  const clearContext = () => {
    weddingSlug.value = null
    weddingId.value = null
    weddingName.value = null
    isResolved.value = false
    resolveError.value = null
  }

  /**
   * Check if we're in legacy mode (single wedding, backward compatible)
   */
  const isLegacyMode = computed(() => {
    return getStoredUserType() === 'legacy'
  })

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = computed(() => {
    return getStoredUserType() === 'super'
  })

  /**
   * Get the current wedding ID for API calls
   * In legacy mode, returns null (APIs use old routes)
   */
  const currentWeddingId = computed(() => {
    if (isLegacyMode.value) return null
    return weddingId.value
  })

  /**
   * Get the current wedding slug for public URLs
   */
  const currentWeddingSlug = computed(() => {
    return weddingSlug.value
  })

  return {
    // State (readonly)
    weddingSlug: readonly(weddingSlug),
    weddingId: readonly(weddingId),
    weddingName: readonly(weddingName),
    isResolved: readonly(isResolved),
    resolveError: readonly(resolveError),

    // Computed
    isLegacyMode,
    isSuperAdmin,
    currentWeddingId,
    currentWeddingSlug,

    // Actions
    resolveSlug,
    setWeddingId,
    setWeddingContext,
    initFromToken,
    clearContext,
  }
}
