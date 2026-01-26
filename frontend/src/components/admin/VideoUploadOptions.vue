<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    file: File
    formatFileSize: (bytes: number) => string
    isCompressionSupported: boolean
  }>()

  const emit = defineEmits<{
    confirm: [compress: boolean]
    cancel: []
  }>()

  const choice = ref<'optimize' | 'original'>('optimize')

  const filename = computed(() => {
    const name = props.file.name
    // Truncate long filenames
    if (name.length > 30) {
      return name.slice(0, 15) + '...' + name.slice(-12)
    }
    return name
  })

  const handleConfirm = (): void => {
    emit('confirm', choice.value === 'optimize')
  }
</script>

<template>
  <div
    class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-sand-dark dark:border-dark-border p-4 sm:p-5 max-w-sm w-full"
  >
    <!-- Header with video icon and file info -->
    <div class="flex items-start gap-3 mb-4">
      <div
        class="flex-shrink-0 w-12 h-12 rounded-lg bg-sage/10 dark:bg-sage/20 flex items-center justify-center"
      >
        <svg
          class="w-6 h-6 text-sage dark:text-sage-light"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p
          class="font-body font-medium text-charcoal dark:text-dark-text truncate"
          :title="file.name"
        >
          {{ filename }}
        </p>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ formatFileSize(file.size) }}
        </p>
      </div>
    </div>

    <!-- Question -->
    <p class="font-body text-sm text-charcoal dark:text-dark-text mb-3">
      {{ adminT.gallery.howToUpload }}
    </p>

    <!-- Options -->
    <div class="space-y-2 mb-4">
      <!-- Optimize option -->
      <label
        class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
        :class="
          choice === 'optimize'
            ? 'border-sage bg-sage/5 dark:bg-sage/10'
            : 'border-sand-dark dark:border-dark-border hover:border-sage/50'
        "
      >
        <input
          v-model="choice"
          type="radio"
          value="optimize"
          class="mt-0.5 w-4 h-4 text-sage focus:ring-sage border-sand-dark"
          :disabled="!isCompressionSupported"
        />
        <div class="flex-1 min-w-0">
          <span class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
            {{ adminT.gallery.optimizeForWeb }}
          </span>
          <span
            v-if="isCompressionSupported"
            class="ml-1 text-xs font-medium text-sage dark:text-sage-light"
          >
            ({{ adminT.common.recommended }})
          </span>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5">
            {{ adminT.gallery.smallerFile }}
          </p>
          <p
            v-if="!isCompressionSupported"
            class="font-body text-xs text-amber-600 dark:text-amber-400 mt-1"
          >
            {{ adminT.gallery.compressionNotSupported }}
          </p>
        </div>
      </label>

      <!-- Original option -->
      <label
        class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
        :class="
          choice === 'original'
            ? 'border-sage bg-sage/5 dark:bg-sage/10'
            : 'border-sand-dark dark:border-dark-border hover:border-sage/50'
        "
      >
        <input
          v-model="choice"
          type="radio"
          value="original"
          class="mt-0.5 w-4 h-4 text-sage focus:ring-sage border-sand-dark"
        />
        <div class="flex-1 min-w-0">
          <span class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
            {{ adminT.gallery.uploadOriginal }}
          </span>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5">
            {{ adminT.gallery.fullQuality }}
          </p>
        </div>
      </label>
    </div>

    <!-- Buttons -->
    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 px-4 py-2 font-body text-sm font-medium text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors"
        @click="emit('cancel')"
      >
        {{ adminT.common.cancel }}
      </button>
      <button
        type="button"
        class="flex-1 px-4 py-2 font-body text-sm font-medium text-white bg-sage hover:bg-sage-dark rounded-lg transition-colors"
        @click="handleConfirm"
      >
        {{ adminT.gallery.upload }}
      </button>
    </div>
  </div>
</template>
