<script setup lang="ts">
import type { MultilingualText } from "@/types/contacts";

const props = defineProps<{
  modelValue: MultilingualText;
  label: string;
  placeholder?: string;
  requiredLanguages?: ("en" | "ms" | "zh" | "ta")[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: MultilingualText];
}>();

const languages = [
  { key: "en" as const, label: "English" },
  { key: "ms" as const, label: "Malay" },
  { key: "zh" as const, label: "Chinese" },
  { key: "ta" as const, label: "Tamil" },
];

const updateField = (key: keyof MultilingualText, value: string) => {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
};
</script>

<template>
  <div class="space-y-3">
    <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
      {{ label }}
    </p>
    <div v-for="lang in languages" :key="lang.key">
      <label
        class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
      >
        {{ lang.label }}
      </label>
      <input
        :value="modelValue[lang.key]"
        type="text"
        class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
        :placeholder="
          placeholder
            ? `${placeholder} (${lang.label})`
            : `${lang.label} ${label.toLowerCase()}`
        "
        :required="requiredLanguages?.includes(lang.key)"
        @input="
          updateField(lang.key, ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>
