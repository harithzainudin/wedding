import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

// Types for dirty tab tracking
export interface DirtyTabInfo {
  tabKey: string
  tabLabel: string
  save: () => Promise<{ success: boolean; error?: string }>
  discard: () => void
}

// Payload type for dirty state change event
export interface DirtyStateChangePayload {
  isDirty: boolean
  save: () => Promise<{ success: boolean; error?: string }>
  discard: () => void
}

export interface PendingNavigation {
  type: 'tab' | 'route'
  destination?: string
  routeLocation?: RouteLocationRaw
}

// Singleton state - shared across all component instances
const dirtyTabs = ref<Map<string, DirtyTabInfo>>(new Map())
const showModal = ref(false)
const pendingNavigation = ref<PendingNavigation | null>(null)
const isSaving = ref(false)
const saveError = ref<string | null>(null)

// Computed properties
const hasDirtyTabs = computed(() => dirtyTabs.value.size > 0)

const dirtyTabLabels = computed(() => {
  const labels: string[] = []
  dirtyTabs.value.forEach((info) => {
    labels.push(info.tabLabel)
  })
  return labels
})

const currentDirtyTabLabel = computed(() => {
  if (dirtyTabs.value.size === 0) return ''
  const firstEntry = dirtyTabs.value.entries().next().value
  return firstEntry ? firstEntry[1].tabLabel : ''
})

/**
 * Register a tab as having potential dirty state
 */
const registerTab = (info: DirtyTabInfo): void => {
  dirtyTabs.value.set(info.tabKey, info)
}

/**
 * Unregister a tab (when it no longer has dirty state)
 */
const unregisterTab = (tabKey: string): void => {
  dirtyTabs.value.delete(tabKey)
}

/**
 * Clear all dirty tabs (used when switching weddings)
 */
const clearAllDirtyTabs = (): void => {
  dirtyTabs.value.clear()
  showModal.value = false
  pendingNavigation.value = null
  isSaving.value = false
  saveError.value = null
}

/**
 * Check if navigation should proceed or be blocked
 * Returns true if navigation can proceed, false if blocked (modal will show)
 */
const beforeNavigate = (navigation: PendingNavigation): boolean => {
  if (!hasDirtyTabs.value) {
    return true // No dirty state, proceed
  }

  // Block navigation and show modal
  pendingNavigation.value = navigation
  showModal.value = true
  saveError.value = null
  return false
}

/**
 * Handle "Save & Continue" action
 * Saves all dirty tabs and proceeds with navigation if successful
 */
const handleSaveAndContinue = async (): Promise<{
  success: boolean
  proceedWithNavigation: PendingNavigation | null
}> => {
  isSaving.value = true
  saveError.value = null

  try {
    // Save all dirty tabs
    const dirtyTabEntries = Array.from(dirtyTabs.value.entries())

    for (const [, tabInfo] of dirtyTabEntries) {
      const result = await tabInfo.save()
      if (!result.success) {
        saveError.value = result.error ?? `Failed to save ${tabInfo.tabLabel}`
        isSaving.value = false
        return { success: false, proceedWithNavigation: null }
      }
    }

    // All saves successful
    const navToProceed = pendingNavigation.value
    showModal.value = false
    pendingNavigation.value = null
    isSaving.value = false

    return { success: true, proceedWithNavigation: navToProceed }
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Save failed'
    isSaving.value = false
    return { success: false, proceedWithNavigation: null }
  }
}

/**
 * Handle "Discard" action
 * Discards all changes and proceeds with navigation
 */
const handleDiscard = (): PendingNavigation | null => {
  // Discard all dirty tabs
  dirtyTabs.value.forEach((tabInfo) => {
    tabInfo.discard()
  })

  const navToProceed = pendingNavigation.value
  showModal.value = false
  pendingNavigation.value = null
  saveError.value = null

  return navToProceed
}

/**
 * Handle "Stay" action
 * Cancel navigation and stay on current page
 */
const handleStay = (): void => {
  pendingNavigation.value = null
  showModal.value = false
  saveError.value = null
}

/**
 * Save all dirty tabs without navigation (for action bar)
 * Returns success/error status
 */
const saveCurrentDirtyTabs = async (): Promise<{ success: boolean; error?: string }> => {
  isSaving.value = true
  saveError.value = null

  try {
    const dirtyTabEntries = Array.from(dirtyTabs.value.entries())

    for (const [, tabInfo] of dirtyTabEntries) {
      const result = await tabInfo.save()
      if (!result.success) {
        saveError.value = result.error ?? `Failed to save ${tabInfo.tabLabel}`
        isSaving.value = false
        return { success: false, error: saveError.value }
      }
    }

    // All saves successful
    isSaving.value = false
    return { success: true }
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Save failed'
    isSaving.value = false
    return { success: false, error: saveError.value }
  }
}

/**
 * Discard all dirty tabs without navigation (for action bar)
 */
const discardAllDirtyTabs = (): void => {
  dirtyTabs.value.forEach((tabInfo) => {
    tabInfo.discard()
  })
  saveError.value = null
}

/**
 * Browser beforeunload handler for preventing accidental tab/window close
 */
const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
  if (hasDirtyTabs.value) {
    e.preventDefault()
    // Modern browsers ignore custom messages, but we need to set returnValue
    e.returnValue = ''
  }
}

/**
 * Setup browser beforeunload listener
 * Call this in the AdminView component
 */
const setupBeforeUnloadListener = (): void => {
  window.addEventListener('beforeunload', handleBeforeUnload)
}

/**
 * Remove browser beforeunload listener
 * Call this when AdminView unmounts
 */
const removeBeforeUnloadListener = (): void => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
}

export function useUnsavedChanges() {
  return {
    // State (readonly for external access)
    hasDirtyTabs,
    dirtyTabLabels: readonly(dirtyTabLabels),
    currentDirtyTabLabel,
    showModal,
    pendingNavigation: readonly(pendingNavigation),
    isSaving: readonly(isSaving),
    saveError: readonly(saveError),

    // Registration methods
    registerTab,
    unregisterTab,
    clearAllDirtyTabs,

    // Navigation interception
    beforeNavigate,

    // Modal action handlers
    handleSaveAndContinue,
    handleDiscard,
    handleStay,

    // Action bar methods (no navigation)
    saveCurrentDirtyTabs,
    discardAllDirtyTabs,

    // Browser beforeunload
    setupBeforeUnloadListener,
    removeBeforeUnloadListener,
  }
}

/**
 * Hook to automatically setup/teardown beforeunload listener
 * Use this in AdminView.vue
 */
export function useBeforeUnloadWarning() {
  onMounted(() => {
    setupBeforeUnloadListener()
  })

  onUnmounted(() => {
    removeBeforeUnloadListener()
  })
}
