<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  const emit = defineEmits<{
    addYouTube: [youtubeUrl: string]
  }>()

  const props = defineProps<{
    isLoading?: boolean
    error?: string
  }>()

  const youtubeUrl = ref('')

  // YouTube URL validation regex
  const youtubeUrlRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=|m\.youtube\.com\/watch\?v=)[\w-]{11}/

  const isValidUrl = computed(() => {
    if (!youtubeUrl.value.trim()) return false
    return youtubeUrlRegex.test(youtubeUrl.value.trim())
  })

  const handlePaste = (): void => {
    // Auto-trim on paste
    setTimeout(() => {
      youtubeUrl.value = youtubeUrl.value.trim()
    }, 0)
  }

  const handleAddClick = (): void => {
    if (isValidUrl.value && !props.isLoading) {
      emit('addYouTube', youtubeUrl.value.trim())
    }
  }

  const clearInput = (): void => {
    youtubeUrl.value = ''
  }

  // Clear the input when successfully added (parent will call this via ref)
  const clearOnSuccess = (): void => {
    youtubeUrl.value = ''
  }

  defineExpose({ clearOnSuccess })
</script>

<template>
  <div class="space-y-4">
    <!-- URL Input -->
    <div
      class="p-6 bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border"
    >
      <!-- YouTube Icon and Title -->
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <svg
            class="w-6 h-6 text-red-600 dark:text-red-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
            />
          </svg>
        </div>
        <div>
          <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text">
            {{ adminT.music.tabYouTube }}
          </h3>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.music.youtubeNote }}
          </p>
        </div>
      </div>

      <!-- URL Input Field -->
      <div class="relative">
        <input
          v-model="youtubeUrl"
          type="url"
          class="w-full px-4 py-3 pr-20 font-body text-sm bg-sand dark:bg-dark-bg border border-sand-dark dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage transition-colors"
          :class="[
            youtubeUrl && !isValidUrl
              ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
              : '',
          ]"
          :placeholder="adminT.music.youtubeUrlPlaceholder"
          @paste="handlePaste"
          @keyup.enter="handleAddClick"
        />

        <!-- Validation indicator -->
        <div v-if="youtubeUrl" class="absolute right-10 top-1/2 -translate-y-1/2">
          <svg
            v-if="isValidUrl"
            class="w-5 h-5 text-green-500"
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
            v-else
            class="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- Clear button -->
        <button
          v-if="youtubeUrl"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
          @click="clearInput"
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

      <!-- Validation error message -->
      <p
        v-if="youtubeUrl && !isValidUrl"
        class="mt-2 font-body text-xs text-red-500 dark:text-red-400"
      >
        {{ adminT.music.invalidYouTubeUrl }}
      </p>

      <!-- API error message -->
      <p v-if="props.error" class="mt-2 font-body text-xs text-red-500 dark:text-red-400">
        {{ props.error }}
      </p>

      <!-- Add Track Button -->
      <button
        type="button"
        class="mt-4 w-full py-3 font-body text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        :disabled="!isValidUrl || props.isLoading"
        @click="handleAddClick"
      >
        <svg v-if="props.isLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
        <span>{{
          props.isLoading ? adminT.music.fetchingYouTubeInfo : adminT.music.addYouTube
        }}</span>
      </button>

      <!-- Help text -->
      <div class="mt-4 p-3 bg-sand/50 dark:bg-dark-bg rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          <strong>{{ adminT.common.tip }}:</strong> {{ adminT.music.youtubeTip }}
        </p>
      </div>
    </div>
  </div>
</template>
