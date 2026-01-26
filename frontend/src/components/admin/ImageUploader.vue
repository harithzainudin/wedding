<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { interpolate } from '@/i18n/translations'
  import VideoUploadOptions from './VideoUploadOptions.vue'

  const { adminT } = useAdminLanguage()

  const props = withDefaults(
    defineProps<{
      maxFileSize: number
      maxVideoSize?: number
      allowedFormats: string[]
      formatFileSize: (bytes: number) => string
      isVideoCompressionSupported?: boolean
    }>(),
    {
      maxVideoSize: 100 * 1024 * 1024, // 100MB default
      isVideoCompressionSupported: false,
    }
  )

  const emit = defineEmits<{
    filesSelected: [files: File[], compressVideos?: boolean]
  }>()

  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  // Video upload options dialog state
  const pendingVideoFile = ref<File | null>(null)
  const showVideoOptions = ref(false)

  // Format labels for display
  const imageFormatLabels: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  }

  const videoFormatLabels: Record<string, string> = {
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    'video/quicktime': 'MOV',
  }

  const isVideoFile = (file: File): boolean =>
    file.type.startsWith('video/') || file.type === 'video/quicktime'

  const imageFormatsLabel = computed(() =>
    props.allowedFormats
      .filter((f) => f.startsWith('image/'))
      .map((format) => imageFormatLabels[format] ?? format)
      .join(', ')
  )

  const videoFormatsLabel = computed(() =>
    props.allowedFormats
      .filter((f) => f.startsWith('video/'))
      .map((format) => videoFormatLabels[format] ?? format)
      .join(', ')
  )

  const hasVideoSupport = computed(() => props.allowedFormats.some((f) => f.startsWith('video/')))

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = (): void => {
    isDragging.value = false
  }

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault()
    isDragging.value = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const handleFileInputChange = (event: Event): void => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      processFiles(input.files)
      // Reset input so the same file can be selected again
      input.value = ''
    }
  }

  const processFiles = (fileList: FileList): void => {
    const files = Array.from(fileList).filter((file) => props.allowedFormats.includes(file.type))
    if (files.length === 0) return

    // Separate images and videos
    const imageFiles = files.filter((f) => !isVideoFile(f))
    const videoFiles = files.filter((f) => isVideoFile(f))

    // Emit images immediately (they are always compressed)
    if (imageFiles.length > 0) {
      emit('filesSelected', imageFiles)
    }

    // For videos, show options dialog for each one
    if (videoFiles.length > 0) {
      // Handle one video at a time
      const firstVideo = videoFiles[0]
      if (firstVideo) {
        pendingVideoFile.value = firstVideo
        showVideoOptions.value = true
      }
      // Note: For simplicity, we only handle one video at a time
      // Additional videos would need queuing logic
    }
  }

  const handleVideoOptionConfirm = (compress: boolean): void => {
    if (pendingVideoFile.value) {
      emit('filesSelected', [pendingVideoFile.value], compress)
    }
    pendingVideoFile.value = null
    showVideoOptions.value = false
  }

  const handleVideoOptionCancel = (): void => {
    pendingVideoFile.value = null
    showVideoOptions.value = false
  }

  const openFilePicker = (): void => {
    fileInput.value?.click()
  }
</script>

<template>
  <div
    class="relative p-4 sm:p-8 border-2 border-dashed rounded-xl transition-colors"
    :class="
      isDragging
        ? 'border-sage bg-sage/5 dark:bg-sage/10'
        : 'border-sand-dark dark:border-dark-border hover:border-sage'
    "
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="allowedFormats.join(',')"
      multiple
      class="hidden"
      @change="handleFileInputChange"
    />

    <div class="text-center cursor-pointer py-4 sm:py-8" @click="openFilePicker">
      <!-- Icons: Image and Video -->
      <div class="flex items-center justify-center gap-3 mb-4">
        <!-- Image icon -->
        <svg
          class="w-10 h-10 sm:w-12 sm:h-12 text-charcoal-light dark:text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <!-- Video icon (only show if videos are supported) -->
        <svg
          v-if="hasVideoSupport"
          class="w-10 h-10 sm:w-12 sm:h-12 text-charcoal-light dark:text-dark-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>

      <p class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text mb-2">
        {{ hasVideoSupport ? adminT.gallery.dragDropMedia : adminT.gallery.dragDropImages }}
      </p>

      <!-- File size info -->
      <div class="space-y-1">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{
            interpolate(adminT.gallery.upToSize, {
              formats: imageFormatsLabel,
              size: formatFileSize(maxFileSize),
            })
          }}
        </p>
        <p
          v-if="hasVideoSupport"
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
        >
          {{
            interpolate(adminT.gallery.upToSize, {
              formats: videoFormatsLabel,
              size: formatFileSize(maxVideoSize),
            })
          }}
        </p>
      </div>
    </div>

    <!-- Video upload options dialog (overlay) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showVideoOptions && pendingVideoFile"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="handleVideoOptionCancel"
        >
          <VideoUploadOptions
            :file="pendingVideoFile"
            :format-file-size="formatFileSize"
            :is-compression-supported="isVideoCompressionSupported"
            @confirm="handleVideoOptionConfirm"
            @cancel="handleVideoOptionCancel"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
