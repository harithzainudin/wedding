<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useWeddingMetadata } from '@/composables/useWeddingMetadata'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import type { WeddingMetadata } from '@/services/api'

  const { adminT } = useAdminLanguage()
  const { currentWedding, assignedWeddings, hasMultipleWeddings, isLoading, error, switchWedding } =
    useWeddingMetadata()

  const showDropdown = ref(false)

  const toggleDropdown = (): void => {
    showDropdown.value = !showDropdown.value
  }

  const closeDropdown = (): void => {
    showDropdown.value = false
  }

  const handleSwitchWedding = (wedding: WeddingMetadata): void => {
    switchWedding(wedding)
    closeDropdown()
  }

  const statusLabel = computed(() => {
    if (!currentWedding.value) return ''
    switch (currentWedding.value.status) {
      case 'active':
        return adminT.value.weddingContext.statusActive
      case 'draft':
        return adminT.value.weddingContext.statusDraft
      case 'archived':
        return adminT.value.weddingContext.statusArchived
      default:
        return currentWedding.value.status
    }
  })

  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const otherWeddings = computed(() => {
    if (!currentWedding.value) return assignedWeddings.value
    return assignedWeddings.value.filter((w) => w.weddingId !== currentWedding.value?.weddingId)
  })
</script>

<template>
  <!-- Desktop only - hidden on mobile -->
  <div
    class="hidden sm:flex items-center justify-between py-2 px-4 bg-sand/50 dark:bg-dark-bg-secondary border-b border-sand-dark dark:border-dark-border mb-4 rounded-lg"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center gap-2">
      <div
        class="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin"
      ></div>
      <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.weddingContext.loading }}
      </span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center gap-2">
      <svg
        class="w-4 h-4 text-red-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span class="font-body text-sm text-red-600 dark:text-red-400">
        {{ adminT.weddingContext.errorLoading }}
      </span>
    </div>

    <!-- No Wedding Selected -->
    <div v-else-if="!currentWedding" class="flex items-center gap-2">
      <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.weddingContext.noWeddingSelected }}
      </span>
    </div>

    <!-- Wedding Info -->
    <div v-else class="flex items-center gap-3">
      <!-- Wedding Name -->
      <span class="font-heading text-sm font-medium text-charcoal dark:text-dark-text">
        {{ currentWedding.displayName }}
      </span>

      <!-- Status Badge -->
      <span
        class="px-2 py-0.5 text-xs font-medium rounded-full"
        :class="{
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
            currentWedding.status === 'active',
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
            currentWedding.status === 'draft',
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400':
            currentWedding.status === 'archived',
        }"
      >
        {{ statusLabel }}
      </span>

      <!-- Wedding Date -->
      <span
        v-if="currentWedding.weddingDate"
        class="text-xs text-charcoal-light dark:text-dark-text-secondary"
      >
        {{ formatDate(currentWedding.weddingDate) }}
      </span>
    </div>

    <!-- Wedding Switcher (for multi-wedding users) -->
    <div v-if="hasMultipleWeddings && !isLoading && !error" class="relative">
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-1.5 text-sm font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg-elevated hover:bg-sand dark:hover:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-lg transition-colors cursor-pointer"
        @click="toggleDropdown"
      >
        {{ adminT.weddingContext.switchWedding }}
        <svg
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': showDropdown }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- Dropdown -->
      <div
        v-if="showDropdown"
        class="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-dark-bg-elevated border border-sand-dark dark:border-dark-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
      >
        <div class="py-1">
          <button
            v-for="wedding in otherWeddings"
            :key="wedding.weddingId"
            type="button"
            class="w-full px-4 py-2 text-left hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
            @click="handleSwitchWedding(wedding)"
          >
            <div class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ wedding.displayName }}
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <span
                class="text-xs"
                :class="{
                  'text-green-600 dark:text-green-400': wedding.status === 'active',
                  'text-yellow-600 dark:text-yellow-400': wedding.status === 'draft',
                  'text-gray-500 dark:text-gray-400': wedding.status === 'archived',
                }"
              >
                {{ wedding.status }}
              </span>
              <span
                v-if="wedding.weddingDate"
                class="text-xs text-charcoal-light dark:text-dark-text-secondary"
              >
                {{ formatDate(wedding.weddingDate) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Backdrop to close dropdown -->
      <div v-if="showDropdown" class="fixed inset-0 z-40" @click="closeDropdown"></div>
    </div>
  </div>
</template>
