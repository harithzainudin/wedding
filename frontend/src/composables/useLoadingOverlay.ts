import { ref, readonly } from 'vue'

// Configuration constants
const SHOW_DELAY_MS = 250 // Delay before showing (avoids flicker for fast APIs)
const MIN_DISPLAY_MS = 400 // Minimum display time once shown
const SUCCESS_DISPLAY_MS = 800 // How long to show success state

// Singleton state - shared across all component instances
const isVisible = ref(false)
const message = ref('')
const showSuccess = ref(false)

// Internal timing state
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let displayedAt: number | null = null

interface ShowLoadingOptions {
  message?: string
  immediate?: boolean // Skip delay for known slow operations
}

interface HideLoadingOptions {
  showSuccessState?: boolean
  successMessage?: string
}

interface WithLoadingOptions {
  message?: string
  successMessage?: string
  showSuccess?: boolean
  immediate?: boolean
}

const clearTimers = () => {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

/**
 * Show the loading overlay with optional message
 */
const showLoading = (options?: ShowLoadingOptions) => {
  clearTimers()

  message.value = options?.message ?? ''
  showSuccess.value = false

  if (options?.immediate) {
    // Show immediately for known slow operations
    isVisible.value = true
    displayedAt = Date.now()
  } else {
    // Delay showing to avoid flicker for fast operations
    showTimer = setTimeout(() => {
      isVisible.value = true
      displayedAt = Date.now()
    }, SHOW_DELAY_MS)
  }
}

/**
 * Hide the loading overlay
 * Respects minimum display time
 */
const hideLoading = (options?: HideLoadingOptions) => {
  // Clear show timer if it hasn't fired yet
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
    // Operation completed before delay - don't show at all
    if (!isVisible.value) {
      return
    }
  }

  const elapsedTime = displayedAt ? Date.now() - displayedAt : MIN_DISPLAY_MS
  const remainingTime = Math.max(0, MIN_DISPLAY_MS - elapsedTime)

  hideTimer = setTimeout(() => {
    if (options?.showSuccessState) {
      showSuccess.value = true
      message.value = options.successMessage ?? ''
      setTimeout(() => {
        isVisible.value = false
        showSuccess.value = false
        message.value = ''
        displayedAt = null
      }, SUCCESS_DISPLAY_MS)
    } else {
      isVisible.value = false
      showSuccess.value = false
      message.value = ''
      displayedAt = null
    }
  }, remainingTime)
}

/**
 * Wrap an async operation with loading overlay
 * Handles all timing automatically
 */
const withLoading = async <T>(
  operation: () => Promise<T>,
  options?: WithLoadingOptions
): Promise<T> => {
  showLoading({
    ...(options?.message && { message: options.message }),
    ...(options?.immediate && { immediate: options.immediate }),
  })

  try {
    const result = await operation()
    hideLoading({
      ...(options?.showSuccess && { showSuccessState: options.showSuccess }),
      ...(options?.successMessage && { successMessage: options.successMessage }),
    })
    return result
  } catch (error) {
    // On error, just hide the overlay without success state
    // Let the calling code handle the error display
    hideLoading()
    throw error
  }
}

/**
 * Force hide (for error cases or cleanup)
 */
const forceHide = () => {
  clearTimers()
  isVisible.value = false
  showSuccess.value = false
  message.value = ''
  displayedAt = null
}

export function useLoadingOverlay() {
  return {
    // Readonly state for component binding
    isVisible: readonly(isVisible),
    message: readonly(message),
    showSuccess: readonly(showSuccess),

    // Methods
    showLoading,
    hideLoading,
    withLoading,
    forceHide,
  }
}
