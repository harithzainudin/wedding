<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    loading?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    loading: false,
    disabled: false,
    size: 'md',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const handleClick = () => {
  if (isDisabled.value) return
  emit('update:modelValue', !props.modelValue)
}

// Size classes
const sizeClasses = computed(() => {
  if (props.size === 'sm') {
    return {
      track: 'h-5 w-9',
      thumb: 'h-3.5 w-3.5',
      thumbTranslate: props.modelValue ? 'translate-x-4' : 'translate-x-0.5',
      spinner: 'h-2.5 w-2.5',
    }
  }
  return {
    track: 'h-6 w-11',
    thumb: 'h-4 w-4',
    thumbTranslate: props.modelValue ? 'translate-x-6' : 'translate-x-1',
    spinner: 'h-3 w-3',
  }
})
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-busy="loading"
    :disabled="isDisabled"
    class="relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 dark:focus:ring-offset-dark-bg"
    :class="[
      sizeClasses.track,
      modelValue ? 'bg-sage' : 'bg-gray-300 dark:bg-gray-600',
      isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    @click="handleClick"
  >
    <!-- Thumb -->
    <span
      class="inline-flex items-center justify-center transform rounded-full bg-white shadow transition-transform"
      :class="[sizeClasses.thumb, sizeClasses.thumbTranslate]"
    >
      <!-- Loading Spinner -->
      <svg
        v-if="loading"
        class="animate-spin text-sage"
        :class="sizeClasses.spinner"
        xmlns="http://www.w3.org/2000/svg"
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
    </span>
  </button>
</template>
