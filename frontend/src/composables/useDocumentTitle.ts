import { watchEffect, onUnmounted } from 'vue'
import { usePublicWeddingData } from './usePublicWeddingData'
import { useNameOrder } from './useNameOrder'

type TitlePosition = 'prefix' | 'suffix'

interface TitleOptions {
  /** Text to show before or after the couple names */
  text: string
  /** Whether the text appears before (prefix) or after (suffix) the couple names */
  position: TitlePosition
  /** Fallback title to show while loading */
  fallback?: string
  /** If true, shows only the text without couple names */
  static?: boolean
}

/**
 * Composable to manage document title reactively based on couple names
 * Uses the display name order setting to determine the order of names
 *
 * @example
 * // Home page: "Aisyah & Ahmad | Wedding Ceremony" (if bride first)
 * useDocumentTitle({ text: "Wedding Ceremony", position: "suffix" });
 *
 * // Admin page: "CMS Admin | Aisyah & Ahmad"
 * useDocumentTitle({ text: "CMS Admin", position: "prefix" });
 *
 * // Static title: "Page Not Found"
 * useDocumentTitle({ text: "Page Not Found", position: "prefix", static: true });
 */
export function useDocumentTitle(options: TitleOptions): void {
  const { isLoadingWeddingDetails, hasLoaded } = usePublicWeddingData()
  const { getOrderedNicknamesString } = useNameOrder()

  const originalTitle = document.title

  const updateTitle = (): void => {
    if (options.static) {
      document.title = options.text
      return
    }

    const coupleTitle = getOrderedNicknamesString(' & ')

    // While loading, show fallback or just the text
    if (isLoadingWeddingDetails.value && !hasLoaded.value) {
      document.title = options.fallback || options.text
      return
    }

    // Build the full title based on position
    if (options.position === 'prefix') {
      document.title = `${options.text} | ${coupleTitle}`
    } else {
      document.title = `${coupleTitle} | ${options.text}`
    }
  }

  // Update title reactively when data changes
  watchEffect(() => {
    updateTitle()
  })

  // Restore original title on unmount
  onUnmounted(() => {
    document.title = originalTitle
  })
}
