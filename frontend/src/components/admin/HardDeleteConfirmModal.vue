<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import type { DeletionPreview } from '@/types/admin'

  const props = defineProps<{
    show: boolean
    weddingSlug: string
    weddingName: string
    preview: DeletionPreview | null
    isLoading: boolean
    isDeleting: boolean
  }>()

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  const { adminT } = useAdminLanguage()

  const confirmInput = ref('')

  const isConfirmValid = computed(() => {
    return confirmInput.value === props.weddingSlug
  })

  const totalItemCount = computed(() => {
    if (!props.preview) return 0
    return (
      props.preview.rsvpCount +
      props.preview.imageCount +
      props.preview.musicCount +
      props.preview.giftCount +
      props.preview.parkingCount +
      props.preview.qrCodeCount
    )
  })

  // Reset input when modal closes
  watch(
    () => props.show,
    (newValue) => {
      if (!newValue) {
        confirmInput.value = ''
      }
    }
  )

  const handleConfirm = () => {
    if (isConfirmValid.value && !props.isDeleting) {
      emit('confirm')
    }
  }

  const handleCancel = () => {
    confirmInput.value = ''
    emit('cancel')
  }
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60" @click="handleCancel"></div>

      <!-- Modal -->
      <div
        class="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <!-- Header with danger styling -->
        <div
          class="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800/30"
        >
          <div class="flex items-center gap-3">
            <!-- Warning Icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-heading text-lg font-semibold text-red-800 dark:text-red-200">
                {{ adminT.hardDelete.title }}
              </h3>
              <p class="text-sm text-red-600 dark:text-red-300">
                {{ weddingName }}
              </p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-5 space-y-4">
          <!-- Warning Message -->
          <div
            class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-3"
          >
            <p class="text-sm text-red-700 dark:text-red-300 font-medium">
              {{ adminT.hardDelete.warningMessage }}
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="flex items-center justify-center py-4">
            <svg
              class="animate-spin h-6 w-6 text-charcoal-light dark:text-dark-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span class="ml-2 text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.hardDelete.loadingPreview }}
            </span>
          </div>

          <!-- Deletion Summary -->
          <div v-else-if="preview" class="space-y-3">
            <p class="text-sm font-medium text-charcoal dark:text-dark-text">
              {{ adminT.hardDelete.deletionSummary }}
            </p>
            <div class="bg-sand/50 dark:bg-dark-bg rounded-lg p-3 space-y-2">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div v-if="preview.rsvpCount > 0" class="flex justify-between">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.rsvps
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.rsvpCount
                  }}</span>
                </div>
                <div v-if="preview.imageCount > 0" class="flex justify-between">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.images
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.imageCount
                  }}</span>
                </div>
                <div v-if="preview.musicCount > 0" class="flex justify-between">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.music
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.musicCount
                  }}</span>
                </div>
                <div v-if="preview.giftCount > 0" class="flex justify-between">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.gifts
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.giftCount
                  }}</span>
                </div>
                <div v-if="preview.parkingCount > 0" class="flex justify-between">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.parking
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.parkingCount
                  }}</span>
                </div>
                <div v-if="preview.qrCodeCount > 0" class="flex justify-between">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.qrCodes
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.qrCodeCount
                  }}</span>
                </div>
              </div>
              <div
                v-if="preview.s3ObjectCount > 0"
                class="pt-2 border-t border-sand-dark/30 dark:border-dark-border"
              >
                <div class="flex justify-between text-sm">
                  <span class="text-charcoal-light dark:text-dark-text-secondary">{{
                    adminT.hardDelete.files
                  }}</span>
                  <span class="font-medium text-charcoal dark:text-dark-text">{{
                    preview.s3ObjectCount
                  }}</span>
                </div>
              </div>
              <div
                v-if="totalItemCount === 0"
                class="text-sm text-charcoal-light dark:text-dark-text-secondary"
              >
                {{ adminT.hardDelete.noDataToDelete }}
              </div>
            </div>

            <!-- Confirmation Input -->
            <div class="space-y-2">
              <label class="block text-sm text-charcoal dark:text-dark-text">
                {{ adminT.hardDelete.confirmInstruction }}
                <code
                  class="px-1.5 py-0.5 bg-sand dark:bg-dark-bg rounded text-red-600 dark:text-red-400 font-mono text-sm"
                  >{{ weddingSlug }}</code
                >
              </label>
              <input
                v-model="confirmInput"
                type="text"
                :placeholder="weddingSlug"
                :disabled="isDeleting"
                class="w-full px-3 py-2 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                :class="{
                  'border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text focus:ring-red-500 focus:border-red-500':
                    !isConfirmValid,
                  'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-charcoal dark:text-dark-text focus:ring-green-500':
                    isConfirmValid,
                }"
                @keyup.enter="handleConfirm"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="px-6 py-4 bg-sand/30 dark:bg-dark-bg border-t border-sand-dark/20 dark:border-dark-border flex gap-3 justify-end"
        >
          <button
            type="button"
            :disabled="isDeleting"
            class="px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer disabled:opacity-50"
            @click="handleCancel"
          >
            {{ adminT.common.cancel }}
          </button>
          <button
            type="button"
            :disabled="!isConfirmValid || isDeleting || isLoading"
            class="px-4 py-2 font-body text-sm text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{
              'bg-red-600 hover:bg-red-700': isConfirmValid && !isDeleting,
              'bg-red-400': !isConfirmValid || isDeleting,
            }"
            @click="handleConfirm"
          >
            <span v-if="isDeleting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ adminT.hardDelete.deleting }}
            </span>
            <span v-else>{{ adminT.hardDelete.deleteButton }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
