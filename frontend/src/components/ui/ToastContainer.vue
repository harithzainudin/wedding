<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useToast, type Toast, type ToastType } from '@/composables/useToast'

  const { toasts, dismiss, pauseTimer, resumeTimer } = useToast()

  // Track touch/swipe state for each toast
  const touchState = ref<Map<string, { startX: number; currentX: number; swiping: boolean }>>(
    new Map()
  )

  // Swipe threshold to trigger dismiss (in pixels)
  const SWIPE_THRESHOLD = 100

  // Get toast icon based on type
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'check'
      case 'error':
        return 'x'
      case 'info':
      default:
        return 'info'
    }
  }

  // Get toast styling classes based on type
  const getToastClasses = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      case 'info':
      default:
        return 'bg-sand dark:bg-dark-bg-elevated border-sand-dark dark:border-dark-border text-charcoal dark:text-dark-text'
    }
  }

  // Get icon background classes based on type
  const getIconBgClasses = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400'
      case 'error':
        return 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400'
      case 'info':
      default:
        return 'bg-sand-dark/50 dark:bg-dark-border text-charcoal-light dark:text-dark-text-secondary'
    }
  }

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (toast: Toast, event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return

    touchState.value.set(toast.id, {
      startX: touch.clientX,
      currentX: touch.clientX,
      swiping: false,
    })
    pauseTimer(toast.id)
  }

  const handleTouchMove = (toast: Toast, event: TouchEvent) => {
    const state = touchState.value.get(toast.id)
    const touch = event.touches[0]
    if (!state || !touch) return

    const deltaX = touch.clientX - state.startX
    // Only allow swiping right (positive delta)
    if (deltaX > 10) {
      state.swiping = true
      state.currentX = touch.clientX
    }
  }

  const handleTouchEnd = (toast: Toast) => {
    const state = touchState.value.get(toast.id)
    if (!state) return

    const deltaX = state.currentX - state.startX
    if (deltaX > SWIPE_THRESHOLD) {
      // Swiped far enough, dismiss
      dismiss(toast.id)
    } else {
      // Reset position and resume timer
      resumeTimer(toast.id)
    }
    touchState.value.delete(toast.id)
  }

  // Get swipe transform style
  const getSwipeStyle = (toast: Toast): { transform: string; opacity: number } => {
    const state = touchState.value.get(toast.id)
    if (!state || !state.swiping) {
      return { transform: 'translateX(0)', opacity: 1 }
    }

    const deltaX = Math.max(0, state.currentX - state.startX)
    const opacity = Math.max(0.3, 1 - deltaX / (SWIPE_THRESHOLD * 2))
    return {
      transform: `translateX(${deltaX}px)`,
      opacity,
    }
  }

  // Computed: reverse toasts for display (newest at bottom)
  const displayToasts = computed(() => [...toasts.value].reverse())

  // Mouse handlers for pause on hover (desktop)
  const handleMouseEnter = (toast: Toast) => {
    pauseTimer(toast.id)
  }

  const handleMouseLeave = (toast: Toast) => {
    resumeTimer(toast.id)
  }
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup
        tag="div"
        class="flex flex-col gap-2"
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
        move-class="transition-all duration-300 ease-out"
      >
        <div
          v-for="toast in displayToasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto rounded-lg border shadow-lg p-3 flex items-start gap-3 touch-pan-y',
            getToastClasses(toast.type),
          ]"
          :style="getSwipeStyle(toast)"
          role="alert"
          @touchstart="handleTouchStart(toast, $event)"
          @touchmove="handleTouchMove(toast, $event)"
          @touchend="handleTouchEnd(toast)"
          @mouseenter="handleMouseEnter(toast)"
          @mouseleave="handleMouseLeave(toast)"
        >
          <!-- Icon -->
          <div
            :class="[
              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
              getIconBgClasses(toast.type),
            ]"
          >
            <!-- Success Icon (Checkmark) -->
            <svg
              v-if="getIcon(toast.type) === 'check'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>

            <!-- Error Icon (X) -->
            <svg
              v-else-if="getIcon(toast.type) === 'x'"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>

            <!-- Info Icon -->
            <svg
              v-else
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <!-- Message -->
          <p class="flex-1 font-body text-sm leading-snug pt-0.5">
            {{ toast.message }}
          </p>

          <!-- Dismiss Button -->
          <button
            type="button"
            class="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors -mr-1 -mt-1"
            aria-label="Dismiss notification"
            @click="dismiss(toast.id)"
          >
            <svg
              class="w-4 h-4 opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
