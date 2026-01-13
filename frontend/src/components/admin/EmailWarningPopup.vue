<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  show: boolean;
  username: string;
  password: string;
  warningMessage: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const clipboardCopied = ref(false);

const copyCredentialsToClipboard = async (): Promise<void> => {
  const subject = "Wedding Admin Portal - Your Login Credentials";
  const body = `Hi there!

Your admin account for the Wedding Admin Portal has been created.

LOGIN CREDENTIALS
-----------------
Username: ${props.username}
Password: ${props.password}

LOGIN URL
---------
https://harithzainudin.github.io/wedding/admin

Please keep your credentials secure and consider changing your password after your first login.

Best regards,
Wedding Admin Team`;

  try {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    clipboardCopied.value = true;
    setTimeout(() => {
      clipboardCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
  }
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4">
    <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full shadow-xl">
      <div class="text-center">
        <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="font-heading text-lg text-charcoal dark:text-dark-text mb-2">Admin Created (Email Failed)</h3>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-2">
          User "{{ username }}" has been created successfully, but the welcome email could not be sent.
        </p>
        <p class="font-body text-xs text-red-600 mb-4">
          {{ warningMessage }}
        </p>

        <div class="bg-sand dark:bg-dark-bg-elevated rounded-lg p-3 mb-4 text-left">
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-2">Subject:</p>
          <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium mb-3">Wedding Admin Portal - Your Login Credentials</p>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">Click below to copy the full message with credentials:</p>
        </div>

        <div class="flex gap-3 justify-center">
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            @click="copyCredentialsToClipboard"
          >
            <svg v-if="!clipboardCopied" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {{ clipboardCopied ? "Copied!" : "Copy Credentials" }}
          </button>
          <button
            type="button"
            class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
            @click="emit('close')"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
