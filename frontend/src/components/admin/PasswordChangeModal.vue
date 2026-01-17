<script setup lang="ts">
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const { adminT } = useAdminLanguage()

  defineProps<{
    show: boolean
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
    showCurrentPassword: boolean
    showNewPassword: boolean
    showConfirmNewPassword: boolean
    passwordChangeError: string
    passwordChangeSuccess: boolean
    isChangingPassword: boolean
  }>()

  const emit = defineEmits<{
    'update:currentPassword': [value: string]
    'update:newPassword': [value: string]
    'update:confirmNewPassword': [value: string]
    'update:showCurrentPassword': [value: boolean]
    'update:showNewPassword': [value: boolean]
    'update:showConfirmNewPassword': [value: boolean]
    close: []
    submit: []
  }>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
    @click.self="emit('close')"
  >
    <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
      <div v-if="passwordChangeSuccess" class="text-center">
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
        <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">
          {{ adminT.auth.passwordChanged }}
        </h3>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.auth.passwordChangedSuccessMessage }}
        </p>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-heading text-lg text-charcoal">{{ adminT.auth.changePassword }}</h3>
          <button
            type="button"
            class="text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
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

        <form @submit.prevent="emit('submit')" class="space-y-4">
          <div>
            <label
              for="currentPassword"
              class="block font-body text-sm font-medium text-charcoal mb-1"
            >
              {{ adminT.auth.currentPassword }}
            </label>
            <div class="relative">
              <input
                id="currentPassword"
                :value="currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                :placeholder="adminT.auth.enterCurrentPassword"
                required
                @input="emit('update:currentPassword', ($event.target as HTMLInputElement).value)"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
                @click="emit('update:showCurrentPassword', !showCurrentPassword)"
              >
                <svg
                  v-if="showCurrentPassword"
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
            <label for="newPassword" class="block font-body text-sm font-medium text-charcoal mb-1">
              {{ adminT.auth.newPassword }}
            </label>
            <div class="relative">
              <input
                id="newPassword"
                :value="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                :placeholder="adminT.auth.enterNewPassword"
                required
                minlength="6"
                @input="emit('update:newPassword', ($event.target as HTMLInputElement).value)"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
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
              for="confirmNewPassword"
              class="block font-body text-sm font-medium text-charcoal mb-1"
            >
              {{ adminT.auth.confirmPassword }}
            </label>
            <div class="relative">
              <input
                id="confirmNewPassword"
                :value="confirmNewPassword"
                :type="showConfirmNewPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
                :placeholder="adminT.auth.confirmNewPassword"
                required
                minlength="6"
                @input="
                  emit('update:confirmNewPassword', ($event.target as HTMLInputElement).value)
                "
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
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

          <p class="font-body text-xs text-charcoal-light">
            {{ adminT.auth.passwordMinLength }}
          </p>

          <p v-if="passwordChangeError" class="text-red-600 font-body text-sm">
            {{ passwordChangeError }}
          </p>

          <div class="flex gap-3">
            <button
              type="submit"
              class="px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              :disabled="isChangingPassword"
            >
              {{ isChangingPassword ? adminT.auth.changingPassword : adminT.auth.changePassword }}
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
              @click="emit('close')"
            >
              {{ adminT.common.cancel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
