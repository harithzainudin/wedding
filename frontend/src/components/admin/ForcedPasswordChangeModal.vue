<script setup lang="ts">
  defineProps<{
    show: boolean
    newPassword: string
    confirmNewPassword: string
    showNewPassword: boolean
    showConfirmNewPassword: boolean
    error: string
    isSubmitting: boolean
  }>()

  const emit = defineEmits<{
    'update:newPassword': [value: string]
    'update:confirmNewPassword': [value: string]
    'update:showNewPassword': [value: boolean]
    'update:showConfirmNewPassword': [value: boolean]
    submit: []
  }>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 px-4"
  >
    <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
      <div class="text-center mb-6">
        <div
          class="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-7 h-7 text-amber-600 dark:text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h3 class="font-heading text-xl text-charcoal dark:text-dark-text mb-2">
          Password Change Required
        </h3>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          Your password has been reset by an administrator. You must set a new password to continue.
        </p>
      </div>

      <form @submit.prevent="emit('submit')" class="space-y-4">
        <div>
          <label
            for="forcedNewPassword"
            class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            New Password
          </label>
          <div class="relative">
            <input
              id="forcedNewPassword"
              :value="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="Enter new password"
              required
              minlength="6"
              autocomplete="new-password"
              @input="emit('update:newPassword', ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
              @click="emit('update:showNewPassword', !showNewPassword)"
            >
              <svg
                v-if="showNewPassword"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label
            for="forcedConfirmNewPassword"
            class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            Confirm New Password
          </label>
          <div class="relative">
            <input
              id="forcedConfirmNewPassword"
              :value="confirmNewPassword"
              :type="showConfirmNewPassword ? 'text' : 'password'"
              class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="Confirm new password"
              required
              minlength="6"
              autocomplete="new-password"
              @input="emit('update:confirmNewPassword', ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
              @click="emit('update:showConfirmNewPassword', !showConfirmNewPassword)"
            >
              <svg
                v-if="showConfirmNewPassword"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          Password must be at least 6 characters.
        </p>

        <p v-if="error" class="text-red-600 dark:text-red-400 font-body text-sm">
          {{ error }}
        </p>

        <button
          type="submit"
          class="w-full px-4 py-3 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Setting Password...' : 'Set New Password' }}
        </button>
      </form>
    </div>
  </div>
</template>
