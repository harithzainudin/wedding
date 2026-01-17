<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { v4 as uuidv4 } from 'uuid'
  import type { ParkingStep, ParkingIcon, ParkingImage } from '@/types/venue'
  import { useParkingImages } from '@/composables/useParkingImages'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import ImageUploader from './ImageUploader.vue'
  import UploadProgressBar from './UploadProgressBar.vue'

  const { adminT } = useAdminLanguage()

  const props = defineProps<{
    parkingSteps: ParkingStep[]
    parkingVideoUrl: string
    showParkingImages: boolean
    showParkingDirections: boolean
    showParkingVideo: boolean
    isSaving: boolean
  }>()

  const emit = defineEmits<{
    'update:parkingSteps': [value: ParkingStep[]]
    'update:parkingVideoUrl': [value: string]
    'update:showParkingImages': [value: boolean]
    'update:showParkingDirections': [value: boolean]
    'update:showParkingVideo': [value: boolean]
  }>()

  // Parking images composable
  const {
    images: parkingImages,
    isLoading: isLoadingImages,
    loadError: imagesLoadError,
    activeUploads,
    canUploadMore,
    remainingSlots,
    maxImages,
    maxFileSize,
    allowedMimeTypes,
    formatFileSize,
    fetchImages,
    uploadImage,
    cancelUpload,
    dismissUpload,
    removeImage,
  } = useParkingImages()

  // Icon options for parking steps
  const iconOptions = computed(() => [
    { value: '' as ParkingIcon | '', label: adminT.value.venue.iconNoIcon },
    { value: 'straight' as ParkingIcon, label: adminT.value.venue.iconGoStraight },
    { value: 'turn-left' as ParkingIcon, label: adminT.value.venue.iconTurnLeft },
    { value: 'turn-right' as ParkingIcon, label: adminT.value.venue.iconTurnRight },
    { value: 'landmark' as ParkingIcon, label: adminT.value.venue.iconLandmark },
    { value: 'parking' as ParkingIcon, label: adminT.value.venue.iconParking },
    { value: 'entrance' as ParkingIcon, label: adminT.value.venue.iconEntrance },
  ])

  // Video URL validation
  const videoUrlError = ref('')

  const validateVideoUrl = (url: string): boolean => {
    if (!url.trim()) {
      videoUrlError.value = ''
      return true
    }

    const youtubeRegex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    if (!youtubeRegex.test(url)) {
      videoUrlError.value = adminT.value.venue.validYoutubeUrl
      return false
    }

    videoUrlError.value = ''
    return true
  }

  // Extract YouTube video ID for embed preview
  const youtubeEmbedUrl = computed(() => {
    const url = props.parkingVideoUrl
    if (!url) return ''

    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
    return ''
  })

  // Step management
  const addStep = () => {
    const newStep: ParkingStep = {
      id: uuidv4(),
      text: '',
      icon: undefined,
    }
    emit('update:parkingSteps', [...props.parkingSteps, newStep])
  }

  const updateStep = (index: number, updates: Partial<ParkingStep>) => {
    const updated = [...props.parkingSteps]
    updated[index] = { ...updated[index], ...updates }
    emit('update:parkingSteps', updated)
  }

  const removeStep = (index: number) => {
    const updated = props.parkingSteps.filter((_, i) => i !== index)
    emit('update:parkingSteps', updated)
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= props.parkingSteps.length) return

    const updated = [...props.parkingSteps]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    emit('update:parkingSteps', updated)
  }

  // Image upload handling
  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      await uploadImage(file)
    }
  }

  const handleRemoveImage = async (imageId: string) => {
    await removeImage(imageId)
  }

  // Collapsible section state (collapsed by default)
  const isImagesExpanded = ref(false)
  const isStepsExpanded = ref(false)
  const isVideoExpanded = ref(false)

  // Load parking images on mount
  onMounted(() => {
    fetchImages()
  })
</script>

<template>
  <div class="space-y-6">
    <!-- Parking Images Section -->
    <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
      <div class="w-full px-3 sm:px-4 py-3 bg-sand/30 dark:bg-dark-bg-elevated">
        <!-- Mobile: Stacked layout, Desktop: Side by side -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <!-- Title row -->
          <button
            type="button"
            class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
            @click="isImagesExpanded = !isImagesExpanded"
          >
            <svg class="w-5 h-5 text-sage flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              />
            </svg>
            <span
              class="font-body text-sm font-medium text-charcoal dark:text-dark-text whitespace-nowrap"
            >
              {{ adminT.venue.parkingImages }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full bg-sage/20 text-sage text-xs font-medium whitespace-nowrap"
            >
              {{ parkingImages.length }}/{{ maxImages }}
            </span>
            <svg
              class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform flex-shrink-0"
              :class="{ 'rotate-180': isImagesExpanded }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <!-- Visibility Toggle -->
          <div class="flex items-center gap-2 pl-7 sm:pl-0">
            <span
              class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary whitespace-nowrap"
            >
              {{ adminT.venue.showOnWebsite }}
            </span>
            <button
              type="button"
              :disabled="isSaving"
              class="relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              :class="showParkingImages ? 'bg-sage' : 'bg-sand-dark dark:bg-dark-border'"
              @click.stop="emit('update:showParkingImages', !showParkingImages)"
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': showParkingImages }"
              />
            </button>
          </div>
        </div>
      </div>

      <div v-if="isImagesExpanded" class="p-4 space-y-4">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.venue.uploadParkingPhotosDesc }}
        </p>

        <!-- Loading State -->
        <div v-if="isLoadingImages" class="text-center py-4">
          <div
            class="inline-block w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin"
          />
        </div>

        <!-- Error State -->
        <div v-else-if="imagesLoadError" class="text-center py-4 text-red-500 font-body text-sm">
          {{ imagesLoadError }}
        </div>

        <!-- Images Grid -->
        <div v-else>
          <div v-if="parkingImages.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div
              v-for="image in parkingImages"
              :key="image.id"
              class="relative group aspect-video rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border"
            >
              <img
                :src="image.url"
                :alt="image.caption || image.filename"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <button
                  type="button"
                  class="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  :disabled="isSaving"
                  @click="handleRemoveImage(image.id)"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-if="image.caption"
                class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1"
              >
                <p class="text-white text-xs truncate">{{ image.caption }}</p>
              </div>
            </div>
          </div>

          <!-- Upload Progress -->
          <UploadProgressBar
            v-if="activeUploads.length > 0"
            :uploads="activeUploads"
            class="mb-4"
            @cancel="cancelUpload"
            @dismiss="dismissUpload"
          />

          <!-- Image Uploader -->
          <ImageUploader
            v-if="canUploadMore"
            :disabled="isSaving"
            :max-file-size="maxFileSize"
            :allowed-formats="allowedMimeTypes"
            :format-file-size="formatFileSize"
            @files-selected="handleFilesSelected"
          />
          <p
            v-else
            class="text-center py-4 font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
          >
            {{ adminT.venue.maxImagesReached.replace('{max}', String(maxImages)) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Step-by-Step Directions Section -->
    <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
      <div class="w-full px-3 sm:px-4 py-3 bg-sand/30 dark:bg-dark-bg-elevated">
        <!-- Mobile: Stacked layout, Desktop: Side by side -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <!-- Title row -->
          <button
            type="button"
            class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
            @click="isStepsExpanded = !isStepsExpanded"
          >
            <svg class="w-5 h-5 text-sage flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
              />
            </svg>
            <span
              class="font-body text-sm font-medium text-charcoal dark:text-dark-text whitespace-nowrap"
            >
              {{ adminT.venue.directionsTitle }}
            </span>
            <span
              v-if="parkingSteps.length > 0"
              class="px-2 py-0.5 rounded-full bg-sage/20 text-sage text-xs font-medium whitespace-nowrap"
            >
              {{ parkingSteps.length }}
              {{ parkingSteps.length > 1 ? adminT.venue.steps : adminT.venue.step }}
            </span>
            <svg
              class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform flex-shrink-0"
              :class="{ 'rotate-180': isStepsExpanded }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <!-- Visibility Toggle -->
          <div class="flex items-center gap-2 pl-7 sm:pl-0">
            <span
              class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary whitespace-nowrap"
            >
              {{ adminT.venue.showOnWebsite }}
            </span>
            <button
              type="button"
              :disabled="isSaving"
              class="relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              :class="showParkingDirections ? 'bg-sage' : 'bg-sand-dark dark:bg-dark-border'"
              @click.stop="emit('update:showParkingDirections', !showParkingDirections)"
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': showParkingDirections }"
              />
            </button>
          </div>
        </div>
      </div>

      <div v-if="isStepsExpanded" class="p-4 space-y-3">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.venue.addDirectionsDesc }}
        </p>

        <!-- Steps List -->
        <div v-if="parkingSteps.length > 0" class="space-y-2">
          <div
            v-for="(step, index) in parkingSteps"
            :key="step.id"
            class="flex gap-2 items-start p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg"
          >
            <!-- Step Number -->
            <div
              class="flex-shrink-0 w-6 h-6 rounded-full bg-sage text-white flex items-center justify-center font-body text-xs font-medium"
            >
              {{ index + 1 }}
            </div>

            <!-- Step Content -->
            <div class="flex-1 space-y-2">
              <input
                :value="step.text"
                type="text"
                maxlength="200"
                :placeholder="adminT.venue.enterDirectionPlaceholder"
                :disabled="isSaving"
                class="w-full px-3 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50"
                @input="
                  updateStep(index, {
                    text: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <select
                :value="step.icon || ''"
                :disabled="isSaving"
                class="w-full px-3 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50"
                @change="
                  updateStep(index, {
                    icon: (($event.target as HTMLSelectElement).value as ParkingIcon) || undefined,
                  })
                "
              >
                <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-1">
              <button
                type="button"
                :disabled="index === 0 || isSaving"
                class="p-1 rounded hover:bg-sand dark:hover:bg-dark-border transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                @click="moveStep(index, 'up')"
              >
                <svg
                  class="w-4 h-4 text-charcoal-light dark:text-dark-text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                :disabled="index === parkingSteps.length - 1 || isSaving"
                class="p-1 rounded hover:bg-sand dark:hover:bg-dark-border transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                @click="moveStep(index, 'down')"
              >
                <svg
                  class="w-4 h-4 text-charcoal-light dark:text-dark-text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                :disabled="isSaving"
                class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                @click="removeStep(index)"
              >
                <svg
                  class="w-4 h-4 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
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

        <!-- Add Step Button -->
        <button
          type="button"
          :disabled="isSaving || parkingSteps.length >= 10"
          class="w-full py-2 border-2 border-dashed border-sand-dark dark:border-dark-border rounded-lg font-body text-sm text-charcoal-light dark:text-dark-text-secondary hover:border-sage hover:text-sage transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          @click="addStep"
        >
          {{ adminT.venue.addStep }}
        </button>
        <p
          v-if="parkingSteps.length >= 10"
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary text-center"
        >
          {{ adminT.venue.maxStepsAllowed }}
        </p>
      </div>
    </div>

    <!-- Video URL Section -->
    <div class="border border-sand-dark dark:border-dark-border rounded-lg overflow-hidden">
      <div class="w-full px-3 sm:px-4 py-3 bg-sand/30 dark:bg-dark-bg-elevated">
        <!-- Mobile: Stacked layout, Desktop: Side by side -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <!-- Title row -->
          <button
            type="button"
            class="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
            @click="isVideoExpanded = !isVideoExpanded"
          >
            <svg class="w-5 h-5 text-sage flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              />
            </svg>
            <span
              class="font-body text-sm font-medium text-charcoal dark:text-dark-text whitespace-nowrap"
            >
              {{ adminT.venue.videoGuide }}
            </span>
            <span
              v-if="parkingVideoUrl"
              class="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium whitespace-nowrap"
            >
              {{ adminT.venue.added }}
            </span>
            <svg
              class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary transition-transform flex-shrink-0"
              :class="{ 'rotate-180': isVideoExpanded }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <!-- Visibility Toggle -->
          <div class="flex items-center gap-2 pl-7 sm:pl-0">
            <span
              class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary whitespace-nowrap"
            >
              {{ adminT.venue.showOnWebsite }}
            </span>
            <button
              type="button"
              :disabled="isSaving"
              class="relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
              :class="showParkingVideo ? 'bg-sage' : 'bg-sand-dark dark:bg-dark-border'"
              @click.stop="emit('update:showParkingVideo', !showParkingVideo)"
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': showParkingVideo }"
              />
            </button>
          </div>
        </div>
      </div>

      <div v-if="isVideoExpanded" class="p-4 space-y-3">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.venue.addVideoDesc }}
        </p>

        <div>
          <input
            :value="parkingVideoUrl"
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            :disabled="isSaving"
            class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50"
            :class="{ 'border-red-500': videoUrlError }"
            @input="
              (e: Event) => {
                const value = (e.target as HTMLInputElement).value
                validateVideoUrl(value)
                emit('update:parkingVideoUrl', value)
              }
            "
          />
          <p v-if="videoUrlError" class="mt-1 font-body text-xs text-red-500">
            {{ videoUrlError }}
          </p>
        </div>

        <!-- Video Preview -->
        <div
          v-if="youtubeEmbedUrl && !videoUrlError"
          class="aspect-video rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border"
        >
          <iframe
            :src="youtubeEmbedUrl"
            class="w-full h-full"
            frameborder="0"
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
            "
            allowfullscreen
          />
        </div>
      </div>
    </div>
  </div>
</template>
