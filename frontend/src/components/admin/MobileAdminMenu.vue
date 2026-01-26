<script setup lang="ts">
  import { computed, ref } from 'vue'
  import AdminLanguageToggle from '@/components/admin/AdminLanguageToggle.vue'
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useWeddingMetadata } from '@/composables/useWeddingMetadata'
  import type { UserType } from '@/types/admin'
  import type { WeddingMetadata } from '@/services/api'

  const { adminT } = useAdminLanguage()
  const {
    currentWedding,
    assignedWeddings,
    hasMultipleWeddings,
    isLoading: isLoadingWeddings,
    switchWedding,
  } = useWeddingMetadata()

  const showWeddingList = ref(false)

  const props = defineProps<{
    isOpen: boolean
    username: string
    isMasterUser: boolean
    userType: UserType
    weddingSlug?: string
  }>()

  const viewSiteUrl = computed(() =>
    props.weddingSlug ? `/wedding/${props.weddingSlug}` : '/wedding/'
  )

  const emit = defineEmits<{
    close: []
    openProfile: []
    changePassword: []
    logout: []
  }>()

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase()
  }

  const handleAction = (action: 'profile' | 'changePassword' | 'logout'): void => {
    emit('close')
    if (action === 'profile') {
      emit('openProfile')
    } else if (action === 'changePassword') {
      emit('changePassword')
    } else {
      emit('logout')
    }
  }

  const toggleWeddingList = (): void => {
    showWeddingList.value = !showWeddingList.value
  }

  const handleSwitchWedding = (wedding: WeddingMetadata): void => {
    switchWedding(wedding)
    showWeddingList.value = false
    emit('close')
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
  <Transition name="overlay">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 z-[2000] sm:hidden"
      @click="emit('close')"
    />
  </Transition>

  <Transition name="slide">
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-dark-bg-secondary shadow-xl z-[2000] sm:hidden"
    >
      <div class="flex flex-col h-full">
        <div
          class="flex items-center justify-between p-4 border-b border-sand-dark dark:border-dark-border"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-sage flex items-center justify-center text-white font-body text-base font-medium"
            >
              {{ getInitial(username) }}
            </div>
            <div>
              <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                {{ username }}
              </p>
              <p v-if="isMasterUser" class="font-body text-xs text-amber-600 dark:text-amber-400">
                {{ adminT.header.masterAccount }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Wedding Context Section -->
        <div
          v-if="currentWedding || isLoadingWeddings"
          class="px-4 py-3 border-b border-sand-dark dark:border-dark-border bg-sand/30 dark:bg-dark-bg-elevated/50"
        >
          <!-- Loading State -->
          <div v-if="isLoadingWeddings" class="flex items-center gap-2">
            <div
              class="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin"
            ></div>
            <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.weddingContext.loading }}
            </span>
          </div>

          <!-- Wedding Info -->
          <div v-else-if="currentWedding">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text truncate">
                  {{ currentWedding.displayName }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="px-1.5 py-0.5 text-xs font-medium rounded"
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
                  <span
                    v-if="currentWedding.weddingDate"
                    class="text-xs text-charcoal-light dark:text-dark-text-secondary"
                  >
                    {{ formatDate(currentWedding.weddingDate) }}
                  </span>
                </div>
              </div>

              <!-- Toggle for wedding list (if multiple weddings) -->
              <button
                v-if="hasMultipleWeddings"
                type="button"
                class="p-1.5 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
                @click="toggleWeddingList"
              >
                <svg
                  class="w-5 h-5 transition-transform"
                  :class="{ 'rotate-180': showWeddingList }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <!-- Expandable wedding list -->
            <div
              v-if="showWeddingList && hasMultipleWeddings"
              class="mt-2 pt-2 border-t border-sand-dark/50 dark:border-dark-border/50 space-y-1"
            >
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                {{ adminT.weddingContext.switchWedding }}
              </p>
              <button
                v-for="wedding in otherWeddings"
                :key="wedding.weddingId"
                type="button"
                class="w-full px-2 py-1.5 text-left rounded hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
                @click="handleSwitchWedding(wedding)"
              >
                <p class="font-body text-sm text-charcoal dark:text-dark-text truncate">
                  {{ wedding.displayName }}
                </p>
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
        </div>

        <div class="flex-1 py-2">
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-sand-dark dark:border-dark-border"
          >
            <span class="font-body text-sm text-charcoal dark:text-dark-text">{{
              adminT.header.darkMode
            }}</span>
            <DarkModeToggle variant="light" />
          </div>

          <div
            class="flex items-center justify-between px-4 py-3 border-b border-sand-dark dark:border-dark-border"
          >
            <span class="font-body text-sm text-charcoal dark:text-dark-text">{{
              adminT.header.language
            }}</span>
            <AdminLanguageToggle />
          </div>

          <!-- Super Admin Dashboard link - only for super admins -->
          <a
            v-if="userType === 'super'"
            href="/wedding/superadmin"
            class="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
            @click="emit('close')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ adminT.common.superAdmin }}
          </a>

          <a
            :href="viewSiteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors text-left"
            @click="emit('close')"
          >
            <svg
              class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {{ adminT.common.viewSite }}
          </a>

          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
            @click="handleAction('profile')"
          >
            <svg
              class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {{ adminT.header.profileSettings }}
          </button>

          <button
            v-if="!isMasterUser"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
            @click="handleAction('changePassword')"
          >
            <svg
              class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {{ adminT.auth.changePassword }}
          </button>
        </div>

        <div class="border-t border-sand-dark dark:border-dark-border p-4">
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-body text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            @click="handleAction('logout')"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {{ adminT.common.logout }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  .overlay-enter-active,
  .overlay-leave-active {
    transition: opacity 0.2s ease;
  }

  .overlay-enter-from,
  .overlay-leave-to {
    opacity: 0;
  }

  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease;
  }

  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(100%);
  }
</style>
