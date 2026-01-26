import { ref } from 'vue'

// Singleton state - shared across all components
let goToFirstSectionFn: (() => void) | null = null
let onSectionChangeFn: ((index: number) => void) | null = null
const currentSectionIndex = ref(0)

/**
 * Layout Navigation Composable
 *
 * Allows layouts to register their navigation functions,
 * and other components (like MusicHint) to trigger navigation.
 *
 * Different layouts have different navigation methods:
 * - ClassicScrollLayout: window.scrollTo()
 * - PageSlideshowLayout: goToSlide() with CSS transform
 * - StorybookLayout: containerRef.scrollTo() with scroll-snap
 */
export function useLayoutNavigation() {
  /**
   * Register the "go to first section" function
   * Called by layouts on mount
   */
  const registerGoToFirstSection = (fn: () => void) => {
    goToFirstSectionFn = fn
  }

  /**
   * Register section change callback
   * Called by layouts when the current section/page changes
   */
  const registerOnSectionChange = (fn: (index: number) => void) => {
    onSectionChangeFn = fn
  }

  /**
   * Navigate to the first section
   * Uses the registered function, falls back to window.scrollTo
   */
  const goToFirstSection = () => {
    if (goToFirstSectionFn) {
      goToFirstSectionFn()
    } else {
      // Default fallback for classic scroll layout
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  /**
   * Notify that section has changed
   * Called by layouts when user navigates to a different section
   */
  const notifySectionChange = (index: number) => {
    currentSectionIndex.value = index
    if (onSectionChangeFn) {
      onSectionChangeFn(index)
    }
  }

  /**
   * Get current section index
   */
  const getCurrentSectionIndex = () => currentSectionIndex.value

  /**
   * Check if user has moved past the first section
   * Used for engagement detection in non-scroll layouts
   */
  const hasNavigatedPastFirstSection = () => currentSectionIndex.value > 0

  /**
   * Reset navigation state (for testing or cleanup)
   */
  const reset = () => {
    goToFirstSectionFn = null
    onSectionChangeFn = null
    currentSectionIndex.value = 0
  }

  return {
    // For layouts to register
    registerGoToFirstSection,
    registerOnSectionChange,
    notifySectionChange,

    // For other components to use
    goToFirstSection,
    getCurrentSectionIndex,
    hasNavigatedPastFirstSection,
    currentSectionIndex,

    // Utility
    reset,
  }
}
