<script setup lang="ts">
  import { watch, onUnmounted } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'

  const props = defineProps<{
    show: boolean
    tabLabel: string
    isSaving: boolean
    saveError: string | null
    saveSuccess: boolean
  }>()

  const emit = defineEmits<{
    save: []
    discard: []
  }>()

  const { adminT } = useAdminLanguage()

  // Handle Cmd/Ctrl+S keyboard shortcut
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (!props.isSaving && props.show) {
        emit('save')
      }
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
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="show"
        class="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-dark-bg-secondary border-t border-sand-dark dark:border-dark-border shadow-lg"
      >
        <div
          class="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          <!-- Status area (left side) -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <!-- Saving spinner -->
            <svg
              v-if="isSaving"
              class="w-4 h-4 text-sage animate-spin flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>

            <!-- Status icon for success/error -->
            <svg
              v-else-if="saveSuccess"
              class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>

            <svg
              v-else-if="saveError"
              class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0"
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

            <svg
              v-else
              class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0"
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

            <!-- Status text -->
            <span v-if="isSaving" class="font-body text-sm text-sage dark:text-sage-light truncate">
              {{ adminT.actionBar.saving }}
            </span>
            <span
              v-else-if="saveSuccess"
              class="font-body text-sm text-green-600 dark:text-green-400 truncate"
            >
              {{ adminT.actionBar.saved }}
            </span>
            <span
              v-else-if="saveError"
              class="font-body text-sm text-red-600 dark:text-red-400 truncate"
            >
              {{ saveError }}
            </span>
            <span v-else class="font-body text-sm text-amber-700 dark:text-amber-400 truncate">
              {{ interpolate(adminT.actionBar.unsavedChanges, { tab: tabLabel }) }}
            </span>
          </div>

          <!-- Buttons (right side) -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              :disabled="isSaving"
              class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              @click="emit('discard')"
            >
              {{ adminT.actionBar.discardChanges }}
            </button>
            <button
              type="button"
              :disabled="isSaving"
              class="px-6 py-2 font-body text-sm text-white bg-sage hover:bg-sage-dark rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              @click="emit('save')"
            >
              {{ isSaving ? adminT.actionBar.saving : adminT.actionBar.saveChanges }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
