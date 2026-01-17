<script setup lang="ts">
  defineProps<{
    show: boolean
    username: string
    hasEmail: boolean
  }>()

  const emit = defineEmits<{
    close: []
  }>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
  >
    <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-sm w-full shadow-xl">
      <div class="text-center">
        <div
          class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-6 h-6 text-green-600 dark:text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">
          Admin Created Successfully
        </h3>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-4">
          User "{{ username }}" has been created
          <span v-if="hasEmail"> and a welcome email has been sent.</span>
          <span v-else>.</span>
        </p>
        <button
          type="button"
          class="px-6 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
