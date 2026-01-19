<script setup lang="ts">
  import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'

  withDefaults(
    defineProps<{
      modelValue: boolean
      loading?: boolean
      disabled?: boolean
      label: string
      description?: string
    }>(),
    {
      loading: false,
      disabled: false,
    }
  )

  defineEmits<{
    'update:modelValue': [value: boolean]
  }>()
</script>

<template>
  <div
    class="flex items-center justify-between py-3 px-4 bg-sand/50 dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border mb-6"
  >
    <div>
      <label class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
        {{ label }}
      </label>
      <p
        v-if="description"
        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5"
      >
        {{ description }}
      </p>
    </div>
    <ToggleSwitch
      :model-value="modelValue"
      :loading="loading"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>
