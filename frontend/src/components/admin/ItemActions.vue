<script setup lang="ts">
  defineProps<{
    index: number
    totalItems: number
    layout?: 'vertical' | 'horizontal'
  }>()

  const emit = defineEmits<{
    moveUp: []
    moveDown: []
    edit: []
    delete: []
  }>()
</script>

<template>
  <div :class="layout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-1'">
    <button
      type="button"
      class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer disabled:opacity-50"
      :disabled="index === 0"
      title="Move up"
      @click="emit('moveUp')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
      </svg>
    </button>
    <button
      type="button"
      class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer disabled:opacity-50"
      :disabled="index === totalItems - 1"
      title="Move down"
      @click="emit('moveDown')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <button
      type="button"
      class="p-1.5 text-sage hover:text-sage-dark transition-colors cursor-pointer"
      title="Edit"
      @click="emit('edit')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </button>
    <button
      type="button"
      class="p-1.5 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
      title="Delete"
      @click="emit('delete')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  </div>
</template>
