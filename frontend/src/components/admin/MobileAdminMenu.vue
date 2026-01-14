<script setup lang="ts">
import DarkModeToggle from "@/components/ui/DarkModeToggle.vue";

defineProps<{
  isOpen: boolean;
  username: string;
  isMasterUser: boolean;
}>();

const emit = defineEmits<{
  close: [];
  openProfile: [];
  changePassword: [];
  logout: [];
}>();

const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

const handleAction = (action: "profile" | "changePassword" | "logout"): void => {
  emit("close");
  if (action === "profile") {
    emit("openProfile");
  } else if (action === "changePassword") {
    emit("changePassword");
  } else {
    emit("logout");
  }
};
</script>

<template>
  <Transition name="overlay">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 sm:hidden"
      @click="emit('close')"
    />
  </Transition>

  <Transition name="slide">
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-dark-bg-secondary shadow-xl z-50 sm:hidden"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between p-4 border-b border-sand-dark dark:border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-sage flex items-center justify-center text-white font-body text-base font-medium">
              {{ getInitial(username) }}
            </div>
            <div>
              <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                {{ username }}
              </p>
              <p v-if="isMasterUser" class="font-body text-xs text-amber-600 dark:text-amber-400">
                Master Account
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="flex-1 py-2">
          <div class="flex items-center justify-between px-4 py-3 border-b border-sand-dark dark:border-dark-border">
            <span class="font-body text-sm text-charcoal dark:text-dark-text">Dark Mode</span>
            <DarkModeToggle variant="light" />
          </div>

          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
            @click="handleAction('profile')"
          >
            <svg class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile Settings
          </button>

          <button
            v-if="!isMasterUser"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
            @click="handleAction('changePassword')"
          >
            <svg class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Change Password
          </button>
        </div>

        <div class="border-t border-sand-dark dark:border-dark-border p-4">
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 font-body text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            @click="handleAction('logout')"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
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
