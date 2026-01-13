<script setup lang="ts">
import DarkModeToggle from "@/components/ui/DarkModeToggle.vue";

defineProps<{
  username: string;
  password: string;
  showPassword: boolean;
  loginError: string;
  isLoggingIn: boolean;
}>();

const emit = defineEmits<{
  "update:username": [value: string];
  "update:password": [value: string];
  "update:showPassword": [value: boolean];
  submit: [];
}>();
</script>

<template>
  <div class="relative flex items-center justify-center min-h-screen px-4">
    <div class="absolute top-4 right-4">
      <DarkModeToggle variant="light" />
    </div>
    <div class="w-full max-w-sm p-6 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg">
      <h1 class="font-heading text-2xl text-center text-sage-dark dark:text-sage-light mb-6">Admin Login</h1>

      <form @submit.prevent="emit('submit')" class="space-y-4">
        <div>
          <label for="username" class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
            Username
          </label>
          <input
            id="username"
            :value="username"
            type="text"
            class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
            placeholder="Enter username"
            required
            autofocus
            @input="emit('update:username', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div>
          <label for="password" class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
            Password
          </label>
          <div class="relative">
            <input
              id="password"
              :value="password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full px-3 py-2.5 pr-10 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
              placeholder="Enter password"
              required
              @input="emit('update:password', ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
              @click="emit('update:showPassword', !showPassword)"
            >
              <svg v-if="showPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-center">
          Use "master" as username with the master password for initial setup.
        </p>

        <p v-if="loginError" class="text-red-600 dark:text-red-400 font-body text-sm text-center">
          {{ loginError }}
        </p>

        <button
          type="submit"
          class="w-full py-3 px-6 font-body text-base font-medium text-white bg-sage rounded-lg cursor-pointer transition-colors hover:bg-sage-dark disabled:opacity-70 disabled:cursor-not-allowed"
          :disabled="isLoggingIn"
        >
          {{ isLoggingIn ? "Logging in..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>
