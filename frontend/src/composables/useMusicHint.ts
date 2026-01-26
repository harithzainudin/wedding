import { ref, computed } from 'vue'
import { useDesign } from './useDesign'

// Singleton state - shared across all components
const autoplayBlocked = ref(false)
const hasBeenDismissed = ref(false)
const hasUserEngaged = ref(false)
const hasTracks = ref(false)
const isCurrentlyPlaying = ref(false)

// Callback for triggering music play
let playCallback: (() => void) | null = null

const STORAGE_KEY = 'wedding-music-hint-dismissed'
const SCROLL_THRESHOLD = 100
const TIME_DELAY_MS = 5000

let scrollHandler: (() => void) | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null
let isSetupDone = false

export function useMusicHint() {
  const { designSettings } = useDesign()

  // Check if music feature is enabled in design settings
  const isMusicEnabled = computed(() => {
    const musicFeature = designSettings.value.backgroundFeatures?.find((f) => f.id === 'music')
    return musicFeature?.enabled ?? false
  })

  // Main computed for visibility
  const shouldShowHint = computed(() => {
    return (
      autoplayBlocked.value &&
      !hasBeenDismissed.value &&
      isMusicEnabled.value &&
      hasTracks.value &&
      !isCurrentlyPlaying.value &&
      hasUserEngaged.value
    )
  })

  // Load dismissed state from sessionStorage
  const loadDismissedState = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        hasBeenDismissed.value = true
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }

  // Save dismissed state to sessionStorage
  const saveDismissedState = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore sessionStorage errors
    }
  }

  // Called when autoplay is blocked by the browser
  const markAutoplayBlocked = () => {
    autoplayBlocked.value = true
  }

  // Called when tracks are loaded
  const setHasTracks = (value: boolean) => {
    hasTracks.value = value
  }

  // Called when music play state changes
  const setIsPlaying = (value: boolean) => {
    isCurrentlyPlaying.value = value
  }

  // Called when user navigates/interacts (for non-scroll layouts like slideshow)
  const markUserEngaged = () => {
    if (!hasUserEngaged.value) {
      hasUserEngaged.value = true
      cleanupEngagementDetection()
    }
  }

  // Dismiss the hint
  const dismissHint = () => {
    hasBeenDismissed.value = true
    saveDismissedState()
  }

  // Called when user starts music (auto-dismiss)
  const onMusicStarted = () => {
    if (shouldShowHint.value) {
      dismissHint()
    }
  }

  // Register a callback to be called when user wants to play music
  const registerPlayCallback = (callback: () => void) => {
    playCallback = callback
  }

  // Trigger music playback (called by MusicHint)
  const triggerPlay = () => {
    if (playCallback) {
      playCallback()
    }
  }

  // Setup engagement detection
  const setupEngagementDetection = () => {
    if (isSetupDone) return
    isSetupDone = true

    loadDismissedState()

    // Already dismissed, no need to track engagement
    if (hasBeenDismissed.value) return

    // Scroll detection
    scrollHandler = () => {
      if (window.scrollY >= SCROLL_THRESHOLD) {
        hasUserEngaged.value = true
        cleanupEngagementDetection()
      }
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })

    // Time-based detection
    timeoutId = setTimeout(() => {
      hasUserEngaged.value = true
      cleanupEngagementDetection()
    }, TIME_DELAY_MS)
  }

  // Cleanup engagement listeners
  const cleanupEngagementDetection = () => {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler)
      scrollHandler = null
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Reset state (for testing or when needed)
  const reset = () => {
    autoplayBlocked.value = false
    hasBeenDismissed.value = false
    hasUserEngaged.value = false
    hasTracks.value = false
    isCurrentlyPlaying.value = false
    isSetupDone = false
    playCallback = null
    cleanupEngagementDetection()
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }

  return {
    // State
    shouldShowHint,
    autoplayBlocked,

    // Actions
    markAutoplayBlocked,
    setHasTracks,
    setIsPlaying,
    markUserEngaged,
    dismissHint,
    onMusicStarted,
    registerPlayCallback,
    triggerPlay,
    setupEngagementDetection,
    cleanupEngagementDetection,
    reset,
  }
}
