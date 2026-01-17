<script setup lang="ts">
  defineProps<{
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
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('cancel')"></div>

    <!-- Modal -->
    <div
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
          {{ cancelText ?? 'Cancel' }}
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
          {{ isLoading ? 'Please wait...' : (confirmText ?? 'Confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>
