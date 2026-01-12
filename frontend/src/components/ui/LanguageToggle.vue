<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useLanguage } from "@/composables/useLanguage";

interface Props {
  variant?: "dark" | "light";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "dark",
});

const { currentLanguage, currentLanguageName, setLanguage, languages } = useLanguage();

const buttonClasses = computed(() => {
  const base = "flex items-center gap-1 px-3 py-2 backdrop-blur-sm border rounded-full cursor-pointer transition-all duration-300 active:scale-95";
  if (props.variant === "light") {
    return `${base} bg-sage/10 border-sage/30 text-sage hover:bg-sage/20`;
  }
  return `${base} bg-white/20 border-white/30 text-white hover:bg-white/30`;
});

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = (): void => {
  isOpen.value = !isOpen.value;
};

const selectLanguage = (lang: "ms" | "en" | "zh" | "ta"): void => {
  setLanguage(lang);
  isOpen.value = false;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent): void => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      :class="buttonClasses"
      aria-label="Change language"
      @click="toggleDropdown"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
      <span class="font-body text-[10px] sm:text-xs font-medium uppercase tracking-wider">
        {{ currentLanguageName }}
      </span>
      <svg
        class="w-3 h-3 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-50 min-w-[80px]"
    >
      <button
        v-for="[code, name] in languages"
        :key="code"
        type="button"
        class="w-full px-4 py-2 text-left font-body text-sm transition-colors cursor-pointer"
        :class="
          currentLanguage === code
            ? 'bg-sage text-white'
            : 'text-charcoal hover:bg-sand'
        "
        @click="selectLanguage(code)"
      >
        {{ name }}
      </button>
    </div>
  </div>
</template>
