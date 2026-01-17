<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import type { AdminLanguage } from '@/i18n/translations'

  const { currentAdminLanguage, currentAdminLanguageName, setAdminLanguage, adminLanguages } =
    useAdminLanguage()

  const isOpen = ref(false)
  const dropdownRef = ref<HTMLElement | null>(null)

  const toggleDropdown = (): void => {
    isOpen.value = !isOpen.value
  }

  const selectLanguage = (lang: AdminLanguage): void => {
    setAdminLanguage(lang)
    isOpen.value = false
  }

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent): void => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
      isOpen.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-3 py-2 bg-sage/10 border border-sage/30 text-sage hover:bg-sage/20 dark:bg-dark-bg-elevated/50 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-bg-elevated backdrop-blur-sm rounded-full cursor-pointer transition-all duration-300 active:scale-95"
      aria-label="Change admin language"
      @click="toggleDropdown"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
        />
      </svg>
      <span class="font-body text-xs font-medium uppercase tracking-wider">
        {{ currentAdminLanguageName }}
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
      class="absolute top-full right-0 mt-1 bg-white dark:bg-dark-bg-elevated rounded-lg shadow-lg dark:shadow-xl overflow-hidden z-50 min-w-[80px]"
    >
      <button
        v-for="[code, name] in adminLanguages"
        :key="code"
        type="button"
        class="w-full px-4 py-2 text-left font-body text-sm transition-colors cursor-pointer"
        :class="
          currentAdminLanguage === code
            ? 'bg-sage text-white'
            : 'text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-secondary'
        "
        @click="selectLanguage(code)"
      >
        {{ name }}
      </button>
    </div>
  </div>
</template>
