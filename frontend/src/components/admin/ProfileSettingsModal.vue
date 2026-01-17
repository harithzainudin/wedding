<script setup lang="ts">
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  defineProps<{
    show: boolean
    username: string
    email: string
    isMasterUser: boolean
    isLoading: boolean
    isSaving: boolean
    error: string
    success: boolean
  }>()

  const emit = defineEmits<{
    'update:email': [value: string]
    close: []
    save: []
    openPasswordChange: []
  }>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
    @click.self="emit('close')"
  >
    <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
      <div v-if="success" class="text-center">
        <div
          class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-6 h-6 text-green-600 dark:text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">{{ adminT.profile.profileUpdated }}</h3>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.profile.updateSuccess }}
        </p>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-heading text-lg text-charcoal dark:text-dark-text">{{ adminT.profile.title }}</h3>
          <button
            type="button"
            class="text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
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

        <div v-if="isLoading" class="text-center py-8">
          <div
            class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
          ></div>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
            {{ adminT.profile.loadingProfile }}
          </p>
        </div>

        <form v-else @submit.prevent="emit('save')" class="space-y-4">
          <div>
            <label
              class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
            >
              {{ adminT.profile.username }}
            </label>
            <div
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand-dark/30 dark:bg-dark-bg-elevated text-charcoal-light dark:text-dark-text-secondary"
            >
              {{ username }}
            </div>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
              {{ adminT.profile.usernameCannotChange }}
            </p>
          </div>

          <div v-if="!isMasterUser">
            <label
              for="profileEmail"
              class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
            >
              {{ adminT.profile.email }}
            </label>
            <input
              id="profileEmail"
              :value="email"
              type="email"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
              :placeholder="adminT.profile.emailPlaceholder"
              @input="emit('update:email', ($event.target as HTMLInputElement).value)"
            />
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
              {{ adminT.profile.emailRecoveryHint }}
            </p>
          </div>

          <div
            v-if="isMasterUser"
            class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <p class="font-body text-sm text-amber-700 dark:text-amber-300">
              Master account profile settings are managed through environment configuration.
            </p>
          </div>

          <div v-if="!isMasterUser" class="pt-2 border-t border-sand-dark dark:border-dark-border">
            <button
              type="button"
              class="flex items-center gap-2 font-body text-sm text-sage hover:text-sage-dark dark:hover:text-sage-light transition-colors cursor-pointer"
              @click="emit('openPasswordChange')"
            >
              <svg
                class="w-4 h-4"
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

          <p v-if="error" class="text-red-600 dark:text-red-400 font-body text-sm">
            {{ error }}
          </p>

          <div v-if="!isMasterUser" class="flex gap-3 pt-2">
            <button
              type="submit"
              class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              :disabled="isSaving"
            >
              {{ isSaving ? adminT.common.saving : adminT.common.saveChanges }}
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
              @click="emit('close')"
            >
              {{ adminT.common.cancel }}
            </button>
          </div>

          <div v-else class="flex justify-end pt-2">
            <button
              type="button"
              class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
              @click="emit('close')"
            >
              {{ adminT.common.close }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
