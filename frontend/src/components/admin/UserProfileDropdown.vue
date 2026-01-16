<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineProps<{
  username: string;
  isMasterUser: boolean;
}>();

const emit = defineEmits<{
  openProfile: [];
  changePassword: [];
  logout: [];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = (): void => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = (): void => {
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent): void => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

const handleAction = (
  action: "profile" | "changePassword" | "logout",
): void => {
  closeDropdown();
  if (action === "profile") {
    emit("openProfile");
  } else if (action === "changePassword") {
    emit("changePassword");
  } else {
    emit("logout");
  }
};

const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
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
      class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
      @click="toggleDropdown"
    >
      <div
        class="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-white font-body text-sm font-medium"
      >
        {{ getInitial(username) }}
      </div>
      <span
        class="font-body text-sm text-charcoal dark:text-dark-text hidden sm:inline"
      >
        {{ username }}
      </span>
      <span
        v-if="isMasterUser"
        class="hidden sm:inline px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full"
      >
        Master
      </span>
      <svg
        class="w-4 h-4 text-charcoal-light dark:text-dark-text-secondary transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-sand-dark dark:border-dark-border py-1 z-50"
      >
        <div
          class="px-3 py-2 border-b border-sand-dark dark:border-dark-border"
        >
          <p
            class="font-body text-sm font-medium text-charcoal dark:text-dark-text truncate"
          >
            {{ username }}
          </p>
          <p
            v-if="isMasterUser"
            class="font-body text-xs text-amber-600 dark:text-amber-400"
          >
            Master Account
          </p>
        </div>

        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
          @click="handleAction('profile')"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile Settings
        </button>

        <button
          v-if="!isMasterUser"
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
          @click="handleAction('changePassword')"
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
          Change Password
        </button>

        <div
          class="border-t border-sand-dark dark:border-dark-border mt-1 pt-1"
        >
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 font-body text-sm text-red-600 dark:text-red-400 hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer text-left"
            @click="handleAction('logout')"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
