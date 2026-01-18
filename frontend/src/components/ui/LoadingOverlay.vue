<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
import { useAdminLanguage } from '@/composables/useAdminLanguage'

const { isVisible, message, showSuccess } = useLoadingOverlay()
const { adminT } = useAdminLanguage()

// Simple professional rotating messages (indexes into translation keys)
const rotatingMessageKeys = ['workingOnIt', 'almostThere', 'justAMoment', 'processing2'] as const

// Rotate messages every 3 seconds when loading
const messageIndex = ref(0)
let messageInterval: ReturnType<typeof setInterval> | null = null

watch(isVisible, (visible) => {
  if (visible && !showSuccess.value) {
    messageIndex.value = 0
    messageInterval = setInterval(() => {
      messageIndex.value = (messageIndex.value + 1) % rotatingMessageKeys.length
    }, 3000)
  } else if (messageInterval) {
    clearInterval(messageInterval)
    messageInterval = null
  }
})

onUnmounted(() => {
  if (messageInterval) {
    clearInterval(messageInterval)
  }
})

const displayMessage = computed(() => {
  return message.value || adminT.value.loadingOverlay.loading
})

const rotatingMessage = computed(() => {
  const key = rotatingMessageKeys[messageIndex.value]
  return key ? adminT.value.loadingOverlay[key] : ''
})

const successMessage = computed(() => {
  return message.value || adminT.value.loadingOverlay.success
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        aria-busy="true"
        aria-live="polite"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 dark:bg-black/70" />

        <!-- Content Card -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div
            v-if="isVisible"
            class="relative bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
          >
            <!-- Success State -->
            <template v-if="showSuccess">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="font-heading text-lg text-charcoal dark:text-dark-text">
                {{ successMessage }}
              </p>
            </template>

            <!-- Loading State -->
            <template v-else>
              <div class="w-16 h-16 mx-auto mb-4">
                <svg class="animate-spin w-full h-full text-sage" viewBox="0 0 24 24" fill="none">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">
                {{ displayMessage }}
              </p>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                {{ rotatingMessage }}
              </p>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
