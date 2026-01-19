import { ref, readonly } from 'vue'

// Configuration constants
const DEFAULT_DURATION_MS = 3500 // Auto-dismiss after 3.5 seconds
const MAX_VISIBLE_TOASTS = 5 // Maximum toasts visible at once

// Toast types
export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
  createdAt: number
}

export interface ShowToastOptions {
  type?: ToastType
  duration?: number // ms, default 3500
}

// Singleton state - shared across all component instances
const toasts = ref<Toast[]>([])

// Track timers for each toast
const timers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Generate unique ID for toast
 */
const generateId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Show a toast notification
 */
const show = (message: string, options?: ShowToastOptions): string => {
  const id = generateId()
  const duration = options?.duration ?? DEFAULT_DURATION_MS
  const type = options?.type ?? 'info'

  const toast: Toast = {
    id,
    type,
    message,
    duration,
    createdAt: Date.now(),
  }

  // Add to beginning of array (newest first, will be at bottom visually)
  toasts.value.unshift(toast)

  // Remove oldest if exceeding max
  if (toasts.value.length > MAX_VISIBLE_TOASTS) {
    const oldest = toasts.value.pop()
    if (oldest) {
      clearToastTimer(oldest.id)
    }
  }

  // Set auto-dismiss timer
  const timer = setTimeout(() => {
    dismiss(id)
  }, duration)
  timers.set(id, timer)

  return id
}

/**
 * Clear timer for a toast
 */
const clearToastTimer = (id: string): void => {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

/**
 * Dismiss a specific toast by ID
 */
const dismiss = (id: string): void => {
  clearToastTimer(id)
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

/**
 * Dismiss all toasts
 */
const dismissAll = (): void => {
  // Clear all timers
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  // Clear all toasts
  toasts.value = []
}

/**
 * Show a success toast
 */
const success = (message: string, duration?: number): string => {
  return show(message, { type: 'success', ...(duration !== undefined && { duration }) })
}

/**
 * Show an error toast
 */
const error = (message: string, duration?: number): string => {
  return show(message, { type: 'error', ...(duration !== undefined && { duration }) })
}

/**
 * Show an info toast
 */
const info = (message: string, duration?: number): string => {
  return show(message, { type: 'info', ...(duration !== undefined && { duration }) })
}

/**
 * Pause auto-dismiss timer (for hover/touch interaction)
 */
const pauseTimer = (id: string): void => {
  clearToastTimer(id)
}

/**
 * Resume auto-dismiss timer with remaining time
 */
const resumeTimer = (id: string): void => {
  const toast = toasts.value.find((t) => t.id === id)
  if (!toast) return

  const elapsed = Date.now() - toast.createdAt
  const remaining = Math.max(toast.duration - elapsed, 1000) // At least 1 second

  const timer = setTimeout(() => {
    dismiss(id)
  }, remaining)
  timers.set(id, timer)
}

export function useToast() {
  return {
    // Readonly state for component binding
    toasts: readonly(toasts),

    // Methods
    show,
    success,
    error,
    info,
    dismiss,
    dismissAll,
    pauseTimer,
    resumeTimer,
  }
}
