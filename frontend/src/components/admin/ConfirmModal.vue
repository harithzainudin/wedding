<script setup lang="ts">
  import { watch, onUnmounted } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    show: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
    variant?: 'danger' | 'warning' | 'default'
  }>()

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  const { adminT } = useAdminLanguage()

  // Handle ESC key to close modal
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !props.isLoading) {
      emit('cancel')
    }
  }

  // Add/remove keyboard listener based on show state
  watch(
    () => props.show,
    (isShown) => {
      if (isShown) {
        document.addEventListener('keydown', handleKeydown)
      } else {
        document.removeEventListener('keydown', handleKeydown)
      }
    },
    { immediate: true }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop - click to close -->
        <div class="absolute inset-0 bg-black/50" @click="!isLoading && emit('cancel')" />

        <!-- Modal -->
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
            v-if="show"
            class="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4"
          >
            <h3 class="font-heading text-lg font-semibold text-charcoal dark:text-dark-text">
              {{ title }}
            </h3>

            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ message }}
            </p>

            <!-- Actions -->
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                :disabled="isLoading"
                class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer disabled:opacity-50"
                @click="emit('cancel')"
              >
                {{ cancelText ?? adminT.common.cancel }}
              </button>
              <button
                type="button"
                :disabled="isLoading"
                class="px-4 py-2 font-body text-sm text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                :class="{
                  'bg-red-600 hover:bg-red-700': variant === 'danger',
                  'bg-amber-600 hover:bg-amber-700': variant === 'warning',
                  'bg-sage hover:bg-sage-dark': variant === 'default' || !variant,
                }"
                @click="emit('confirm')"
              >
                {{ isLoading ? adminT.modals.pleaseWait : (confirmText ?? adminT.common.confirm) }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
