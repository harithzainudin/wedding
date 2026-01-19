<script setup lang="ts">
  import { watch, onUnmounted } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'

  const props = defineProps<{
    show: boolean
    tabLabel: string
    isSaving: boolean
    saveError: string | null
  }>()

  const emit = defineEmits<{
    'save-and-continue': []
    discard: []
    stay: []
  }>()

  const { adminT } = useAdminLanguage()

  // Handle ESC key to stay on page
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !props.isSaving) {
      emit('stay')
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
        <!-- Backdrop - click to stay -->
        <div class="absolute inset-0 bg-black/50" @click="!isSaving && emit('stay')" />

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
            class="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <!-- Warning icon and title -->
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 class="font-heading text-lg font-semibold text-charcoal dark:text-dark-text">
                {{ adminT.unsavedChanges.title }}
              </h3>
            </div>

            <!-- Message -->
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ interpolate(adminT.unsavedChanges.message, { tab: tabLabel }) }}
            </p>

            <!-- Error message -->
            <div
              v-if="saveError"
              class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p class="font-body text-sm text-red-600 dark:text-red-400">
                {{ saveError }}
              </p>
            </div>

            <!-- Actions - 3 buttons -->
            <div class="flex flex-col sm:flex-row gap-3 pt-2">
              <!-- Stay button (secondary) -->
              <button
                type="button"
                :disabled="isSaving"
                class="flex-1 px-4 py-2.5 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer disabled:opacity-50"
                @click="emit('stay')"
              >
                {{ adminT.unsavedChanges.stay }}
              </button>

              <!-- Discard button (warning) -->
              <button
                type="button"
                :disabled="isSaving"
                class="flex-1 px-4 py-2.5 font-body text-sm text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer disabled:opacity-50"
                @click="emit('discard')"
              >
                {{ adminT.unsavedChanges.discard }}
              </button>

              <!-- Save & Continue button (primary) -->
              <button
                type="button"
                :disabled="isSaving"
                class="flex-1 px-4 py-2.5 font-body text-sm text-white bg-sage hover:bg-sage-dark rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                @click="emit('save-and-continue')"
              >
                {{
                  isSaving ? adminT.unsavedChanges.saving : adminT.unsavedChanges.saveAndContinue
                }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
