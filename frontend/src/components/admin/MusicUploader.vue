<script setup lang="ts">
  import { ref } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    maxFileSize: number
    formatFileSize: (bytes: number) => string
  }>()

  const emit = defineEmits<{
    filesSelected: [files: { file: File; title: string; artist?: string }[]]
  }>()

  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const pendingFiles = ref<{ file: File; title: string; artist: string }[]>([])

  const ALLOWED_MIME_TYPES = [
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
  ]

  const handleDragOver = (e: DragEvent): void => {
    e.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = (): void => {
    isDragging.value = false
  }

  const handleDrop = (e: DragEvent): void => {
    e.preventDefault()
    isDragging.value = false

    const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
      ALLOWED_MIME_TYPES.includes(f.type)
    )

    if (files.length > 0) {
      addPendingFiles(files)
    }
  }

  const handleFileSelect = (e: Event): void => {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files ?? [])

    if (files.length > 0) {
      addPendingFiles(files)
    }

    // Reset input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }

  const addPendingFiles = (files: File[]): void => {
    for (const file of files) {
      // Extract title from filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, '')
      pendingFiles.value.push({ file, title, artist: '' })
    }
  }

  const removePendingFile = (index: number): void => {
    pendingFiles.value.splice(index, 1)
  }

  const uploadAll = (): void => {
    if (pendingFiles.value.length === 0) return

    emit(
      'filesSelected',
      pendingFiles.value.map((p) => {
        const result: { file: File; title: string; artist?: string } = {
          file: p.file,
          title: p.title,
        }
        if (p.artist.trim()) {
          result.artist = p.artist
        }
        return result
      })
    )

    pendingFiles.value = []
  }

  const openFilePicker = (): void => {
    fileInput.value?.click()
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Drop Zone -->
    <div
      class="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
      :class="[
        isDragging
          ? 'border-sage bg-sage/5 dark:bg-sage/10'
          : 'border-sand-dark dark:border-dark-border hover:border-sage hover:bg-sand/50 dark:hover:bg-dark-bg-secondary',
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        accept="audio/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />

      <svg
        class="w-12 h-12 mx-auto text-charcoal-light/50 dark:text-dark-text-secondary/50 mb-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>

      <p class="font-body text-sm text-charcoal dark:text-dark-text mb-1">
        <span class="text-sage font-medium">{{ adminT.music.clickToUpload }}</span> {{ adminT.music.orDragAndDrop }}
      </p>
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ interpolate(adminT.music.formatInfo, { size: formatFileSize(maxFileSize) }) }}
      </p>
    </div>

    <!-- Pending Files -->
    <div v-if="pendingFiles.length > 0" class="space-y-4">
      <h3 class="font-heading text-sm font-medium text-charcoal dark:text-dark-text">
        {{ interpolate(adminT.music.filesToUpload, { count: String(pendingFiles.length) }) }}
      </h3>

      <div class="space-y-3">
        <div
          v-for="(pending, index) in pendingFiles"
          :key="index"
          class="p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
        >
          <div class="flex items-start gap-4">
            <div class="flex-1 space-y-3">
              <div>
                <label
                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                >
                  {{ adminT.music.trackTitle }}
                </label>
                <input
                  v-model="pending.title"
                  type="text"
                  class="w-full px-3 py-2 font-body text-sm bg-sand dark:bg-dark-bg border border-sand-dark dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
                  :placeholder="adminT.music.trackTitlePlaceholder"
                />
              </div>
              <div>
                <label
                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                >
                  {{ adminT.music.artistOptional }}
                </label>
                <input
                  v-model="pending.artist"
                  type="text"
                  class="w-full px-3 py-2 font-body text-sm bg-sand dark:bg-dark-bg border border-sand-dark dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
                  :placeholder="adminT.music.artistPlaceholder"
                />
              </div>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ pending.file.name }}
              </p>
            </div>
            <button
              type="button"
              class="p-2 text-charcoal-light hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 cursor-pointer"
              @click="removePendingFile(index)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="w-full py-3 font-body text-sm font-medium text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="pendingFiles.some((p) => !p.title.trim())"
        @click="uploadAll"
      >
        {{ interpolate(adminT.music.uploadTracks, { count: String(pendingFiles.length) }) }}
      </button>
    </div>
  </div>
</template>
