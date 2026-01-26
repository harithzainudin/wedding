<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted } from 'vue'
  import { useMusicHint } from '@/composables/useMusicHint'
  import { useLanguage } from '@/composables/useLanguage'
  import { useLayoutNavigation } from '@/composables/useLayoutNavigation'

  const { t } = useLanguage()
  const { shouldShowHint, dismissHint, setupEngagementDetection, cleanupEngagementDetection } =
    useMusicHint()
  const { goToFirstSection } = useLayoutNavigation()

  const isVisible = ref(false)
  const isAnimatingOut = ref(false)

  const AUTO_DISMISS_MS = 20000
  let autoDismissTimer: ReturnType<typeof setTimeout> | null = null

  // Handle visibility based on shouldShowHint
  watch(
    shouldShowHint,
    (show) => {
      if (show && !isVisible.value && !isAnimatingOut.value) {
        isVisible.value = true
        startAutoDismissTimer()
      }
    },
    { immediate: true }
  )

  const startAutoDismissTimer = () => {
    clearAutoDismissTimer()
    autoDismissTimer = setTimeout(() => {
      handleDismiss()
    }, AUTO_DISMISS_MS)
  }

  const clearAutoDismissTimer = () => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer)
      autoDismissTimer = null
    }
  }

  const handleDismiss = () => {
    clearAutoDismissTimer()
    isAnimatingOut.value = true
    setTimeout(() => {
      isVisible.value = false
      isAnimatingOut.value = false
      dismissHint()
    }, 200)
  }

  // Navigate to first section so user can see the music button, then dismiss
  const handleScrollToMusic = () => {
    clearAutoDismissTimer()

    // Use layout-specific navigation (works for all layout types)
    goToFirstSection()

    // Dismiss hint after navigation completes (give user time to see the music button)
    setTimeout(() => {
      handleDismiss()
    }, 800)
  }

  onMounted(() => {
    setupEngagementDetection()
  })

  onUnmounted(() => {
    clearAutoDismissTimer()
    cleanupEngagementDetection()
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="hint">
      <div
        v-if="isVisible && !isAnimatingOut"
        class="music-hint-container fixed bottom-24 left-4 z-[51] max-w-[300px] sm:max-w-[340px] p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        role="status"
        aria-live="polite"
      >
        <!-- Animated glow border -->
        <div
          class="absolute inset-0 rounded-2xl bg-gradient-to-r from-sage via-sage-light to-sage opacity-75 blur-sm animate-glow -z-10"
        />
        <div class="absolute inset-[1px] rounded-2xl bg-white dark:bg-gray-900" />

        <div class="relative flex items-start gap-3">
          <!-- Clickable area - scrolls to top to show music button -->
          <button
            type="button"
            class="flex items-start gap-3 flex-1 min-w-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
            @click="handleScrollToMusic"
          >
            <!-- Animated Music Icon -->
            <div
              class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-lg"
            >
              <div class="relative">
                <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                  />
                </svg>
                <!-- Sound waves animation -->
                <div class="absolute -right-1 top-0 flex flex-col gap-0.5">
                  <span
                    class="sound-wave w-1 h-2 bg-white/80 rounded-full"
                    style="animation-delay: 0s"
                  />
                  <span
                    class="sound-wave w-1 h-3 bg-white/80 rounded-full"
                    style="animation-delay: 0.2s"
                  />
                  <span
                    class="sound-wave w-1 h-2 bg-white/80 rounded-full"
                    style="animation-delay: 0.4s"
                  />
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="font-heading text-base font-semibold text-charcoal dark:text-white">
                {{ t.music.hintTitle }}
              </h3>
              <p class="font-body text-sm text-charcoal-light dark:text-gray-400 mt-1">
                {{ t.music.hintSubtitle }}
              </p>

              <!-- Direction indicator pointing to top-right corner -->
              <div class="mt-2 flex items-center gap-2 text-sage dark:text-sage-light">
                <!-- Arrow pointing diagonally to top-right -->
                <svg
                  class="w-4 h-4 animate-bounce-diagonal"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 17L17 7M17 7H7M17 7v10"
                  />
                </svg>
                <span class="font-body text-xs font-medium">{{ t.music.hintLocation }}</span>
                <!-- Mini music icon indicator showing what to look for -->
                <span
                  class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sage/20 dark:bg-sage/30"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </button>

          <!-- Dismiss Button -->
          <button
            type="button"
            class="flex-shrink-0 p-1.5 text-charcoal-light/40 hover:text-charcoal hover:bg-gray-100 dark:text-gray-600 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-full transition-all cursor-pointer"
            aria-label="Dismiss"
            @click="handleDismiss"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  /* Glowing border animation */
  @keyframes glow {
    0%,
    100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }

  /* Sound wave animation */
  @keyframes sound-wave {
    0%,
    100% {
      transform: scaleY(0.5);
      opacity: 0.5;
    }
    50% {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  .sound-wave {
    animation: sound-wave 0.8s ease-in-out infinite;
  }

  /* Bounce animation pointing diagonally to top-right */
  @keyframes bounce-diagonal {
    0%,
    100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(3px, -3px);
    }
  }

  .animate-bounce-diagonal {
    animation: bounce-diagonal 1s ease-in-out infinite;
  }

  /* Enter animation */
  .hint-enter-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .hint-leave-active {
    transition: all 0.25s ease-in;
  }

  .hint-enter-from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }

  .hint-leave-to {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }

  /* Respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    .hint-enter-active,
    .hint-leave-active {
      transition: opacity 0.15s ease;
    }

    .hint-enter-from,
    .hint-leave-to {
      transform: none;
    }

    .animate-glow {
      animation: none;
      opacity: 0.6;
    }

    .sound-wave {
      animation: none;
      transform: scaleY(0.8);
    }
  }
</style>
