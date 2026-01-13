<script setup lang="ts">
import DarkModeToggle from "@/components/ui/DarkModeToggle.vue";

defineProps<{
  currentUser: string;
  isMasterUser: boolean;
}>();

const emit = defineEmits<{
  changePassword: [];
  logout: [];
}>();
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">Admin Dashboard</h1>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
        Logged in as: <span class="font-medium">{{ currentUser }}</span>
        <span v-if="isMasterUser" class="ml-2 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Master</span>
      </p>
    </div>
    <div class="flex items-center gap-3">
      <DarkModeToggle variant="light" />
      <button
        v-if="!isMasterUser"
        type="button"
        class="flex items-center gap-2 px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="emit('changePassword')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Change Password
      </button>
      <button
        type="button"
        class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded-lg hover:bg-charcoal dark:hover:bg-dark-bg-elevated hover:text-white dark:hover:text-dark-text transition-colors cursor-pointer"
        @click="emit('logout')"
      >
        Logout
      </button>
    </div>
  </div>
</template>
