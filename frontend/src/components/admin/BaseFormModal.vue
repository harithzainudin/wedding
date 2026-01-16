<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
  submitText?: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div
            v-if="show"
            class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div class="flex items-center justify-between mb-4">
              <h3
                class="font-heading text-lg text-charcoal dark:text-dark-text"
              >
                {{ title }}
              </h3>
              <button
                type="button"
                class="text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer"
                @click="emit('close')"
              >
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form class="space-y-4" @submit.prevent="emit('submit')">
              <slot />
              <div class="flex gap-3 pt-2">
                <button
                  type="submit"
                  class="flex-1 px-4 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
                >
                  {{ submitText ?? "Save" }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2.5 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-sand-dark dark:hover:bg-dark-border transition-colors cursor-pointer"
                  @click="emit('close')"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
