<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import type {
    HeroMediaType,
    UploadMode,
    DeviceType,
    HeroMediaItem,
    OverlayColor,
  } from '@/types/heroBackground'
  import { formatFileSize, formatDimensions, getMimeTypeDisplay } from '@/types/heroBackground'
  import {
    useHeroBackground,
    getMediaDimensions,
    getMediaRecommendation,
    checkVideoDuration,
    formatAspectRatio,
  } from '@/composables/useHeroBackground'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    weddingId?: string
  }>()

  const { adminT } = useAdminLanguage()
  const {
    heroBackground,
    isLoading,
    isSaving,
    loadError,
    saveError,
    activeUploads,
    maxImageSize,
    maxVideoSize,
    fetchHeroBackground,
    updateSettings,
    uploadMedia,
    deleteMedia,
    clearUploadError,
  } = useHeroBackground()

  // Local state for UI
  const localMediaType = ref<HeroMediaType>('none')
  const localUploadMode = ref<UploadMode>('single')
  const localOverlayEnabled = ref(true)
  const localOverlayColor = ref<OverlayColor>('black')
  const localOverlayOpacity = ref(30)

  // File input refs
  const desktopFileInput = ref<HTMLInputElement | null>(null)
  const mobileFileInput = ref<HTMLInputElement | null>(null)
  const universalFileInput = ref<HTMLInputElement | null>(null)

  // Media info state (after upload)
  const mediaInfoDesktop = ref<{
    dimensions: { width: number; height: number; aspectRatio: string; duration?: number }
    recommendation: { status: string; message: string }
    durationWarning?: string
  } | null>(null)
  const mediaInfoMobile = ref<typeof mediaInfoDesktop.value>(null)
  const mediaInfoUniversal = ref<typeof mediaInfoDesktop.value>(null)

  // Loading states per device type
  const uploadingDevice = ref<DeviceType | null>(null)
  const deletingDevice = ref<DeviceType | null>(null)

  // Get upload progress for a specific device type
  const getUploadProgress = (deviceType: DeviceType): number => {
    // activeUploads has IDs like "universal-{timestamp}", "desktop-{timestamp}", etc.
    const upload = activeUploads.value.find((u) => u.id.startsWith(`${deviceType}-`))
    return upload?.progress ?? 0
  }

  // Loading states for settings changes
  const changingMediaType = ref(false)
  const changingUploadMode = ref(false)

  // Sync local state with fetched settings
  watch(
    () => heroBackground.value,
    (settings) => {
      if (!settings) return
      localMediaType.value = settings.mediaType
      localUploadMode.value = settings.uploadMode
      localOverlayEnabled.value = settings.overlay.enabled
      localOverlayColor.value = settings.overlay.color
      localOverlayOpacity.value = settings.overlay.opacity
    },
    { immediate: true }
  )

  // Helper to check if a media item's mime type matches the selected media type
  const mediaMatchesType = (media: HeroMediaItem | undefined, type: HeroMediaType): boolean => {
    if (!media || type === 'none') return false
    const isImageMedia = media.mimeType.startsWith('image/')
    const isVideoMedia = media.mimeType.startsWith('video/')
    if (type === 'image') return isImageMedia
    if (type === 'video') return isVideoMedia
    return false
  }

  // Computed - only true if media exists AND matches current media type
  const hasDesktop = computed(
    () =>
      !!heroBackground.value?.desktop &&
      mediaMatchesType(heroBackground.value.desktop, localMediaType.value)
  )
  const hasMobile = computed(
    () =>
      !!heroBackground.value?.mobile &&
      mediaMatchesType(heroBackground.value.mobile, localMediaType.value)
  )
  const hasUniversal = computed(
    () =>
      !!heroBackground.value?.universal &&
      mediaMatchesType(heroBackground.value.universal, localMediaType.value)
  )
  // Check if there's existing media that won't display due to type mismatch OR upload mode conflict
  const hasHiddenMedia = computed(() => {
    if (localMediaType.value === 'none') return false
    const settings = heroBackground.value
    if (!settings) return false

    // Check for media type mismatches
    const checkTypeMismatch = (media: HeroMediaItem | undefined) => {
      if (!media) return false
      return !mediaMatchesType(media, localMediaType.value)
    }

    // Check for upload mode conflicts
    // In "single" mode: desktop/mobile are hidden
    // In "separate" mode: universal is hidden
    const checkModeConflict = () => {
      if (localUploadMode.value === 'single') {
        // Check if there's desktop/mobile media that matches current type
        const desktopMatches =
          settings.desktop && mediaMatchesType(settings.desktop, localMediaType.value)
        const mobileMatches =
          settings.mobile && mediaMatchesType(settings.mobile, localMediaType.value)
        return desktopMatches || mobileMatches
      } else {
        // separate mode - check if there's universal media that matches current type
        return settings.universal && mediaMatchesType(settings.universal, localMediaType.value)
      }
    }

    return (
      checkTypeMismatch(settings.desktop) ||
      checkTypeMismatch(settings.mobile) ||
      checkTypeMismatch(settings.universal) ||
      checkModeConflict()
    )
  })

  // Get details about hidden media for the notice
  const hiddenMediaDetails = computed(() => {
    if (!hasHiddenMedia.value) return null
    const settings = heroBackground.value
    if (!settings) return null

    const hidden: string[] = []

    // Helper to add media info
    const addMediaInfo = (media: HeroMediaItem | undefined, label: string, reason: string) => {
      if (!media) return
      const isImg = media.mimeType.startsWith('image/')
      hidden.push(`${label} (${isImg ? 'image' : 'video'}) - ${reason}`)
    }

    // Check each slot
    const checkSlot = (
      media: HeroMediaItem | undefined,
      label: string,
      isActiveInCurrentMode: boolean
    ) => {
      if (!media) return

      const matchesType = mediaMatchesType(media, localMediaType.value)

      if (!matchesType) {
        // Type mismatch - wrong media type for selected setting
        addMediaInfo(media, label, 'wrong type')
      } else if (!isActiveInCurrentMode) {
        // Mode conflict - media exists but not used in current mode
        addMediaInfo(media, label, 'not used in this mode')
      }
    }

    // Desktop and mobile are active in "separate" mode
    checkSlot(settings.desktop, 'Desktop', localUploadMode.value === 'separate')
    checkSlot(settings.mobile, 'Mobile', localUploadMode.value === 'separate')
    // Universal is active in "single" mode
    checkSlot(settings.universal, 'Universal', localUploadMode.value === 'single')

    return hidden
  })

  // Get accepted file types based on media type
  const acceptedTypes = computed(() => {
    if (localMediaType.value === 'image') {
      return 'image/jpeg,image/png,image/webp'
    }
    if (localMediaType.value === 'video') {
      return 'video/mp4,video/webm'
    }
    return ''
  })

  // Max file size text
  const maxFileSizeText = computed(() => {
    if (localMediaType.value === 'image') {
      return formatFileSize(maxImageSize.value)
    }
    if (localMediaType.value === 'video') {
      return formatFileSize(maxVideoSize.value)
    }
    return ''
  })

  // Load data on mount
  onMounted(async () => {
    await fetchHeroBackground(props.weddingId)
  })

  // Handlers
  const handleMediaTypeChange = async (type: HeroMediaType) => {
    if (changingMediaType.value) return
    changingMediaType.value = true
    localMediaType.value = type
    await updateSettings({ mediaType: type })
    changingMediaType.value = false
  }

  const handleUploadModeChange = async (mode: UploadMode) => {
    if (changingUploadMode.value) return

    // Check if current mode has media that would be hidden
    const settings = heroBackground.value
    if (settings && localMediaType.value !== 'none') {
      let hasMediaInCurrentMode = false
      let currentModeSlots: string[] = []

      if (localUploadMode.value === 'single' && mode === 'separate') {
        // Switching from single to separate - check universal
        if (settings.universal && mediaMatchesType(settings.universal, localMediaType.value)) {
          hasMediaInCurrentMode = true
          currentModeSlots = ['Universal']
        }
      } else if (localUploadMode.value === 'separate' && mode === 'single') {
        // Switching from separate to single - check desktop/mobile
        const hasDesktop =
          settings.desktop && mediaMatchesType(settings.desktop, localMediaType.value)
        const hasMobile = settings.mobile && mediaMatchesType(settings.mobile, localMediaType.value)
        if (hasDesktop || hasMobile) {
          hasMediaInCurrentMode = true
          currentModeSlots = [hasDesktop && 'Desktop', hasMobile && 'Mobile'].filter(
            Boolean
          ) as string[]
        }
      }

      if (hasMediaInCurrentMode) {
        const confirmMsg =
          adminT.value.heroBackground?.switchModeConfirm ??
          `You have media uploaded for ${currentModeSlots.join(' and ')}. Switching modes will hide this media (it won't be deleted). Continue?`
        if (!confirm(confirmMsg)) {
          return
        }
      }
    }

    changingUploadMode.value = true
    localUploadMode.value = mode
    await updateSettings({ uploadMode: mode })
    changingUploadMode.value = false
  }

  const handleOverlayChange = async () => {
    await updateSettings({
      overlay: {
        enabled: localOverlayEnabled.value,
        color: localOverlayColor.value,
        opacity: localOverlayOpacity.value,
      },
    })
  }

  // Overlay color setters (to avoid multiline @click handlers)
  const setOverlayBlack = () => {
    localOverlayColor.value = 'black'
    handleOverlayChange()
  }
  const setOverlayWhite = () => {
    localOverlayColor.value = 'white'
    handleOverlayChange()
  }
  const setOverlayTheme = () => {
    localOverlayColor.value = 'theme'
    handleOverlayChange()
  }

  const handleFileSelect = async (event: Event, deviceType: DeviceType) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    // Set uploading state
    uploadingDevice.value = deviceType

    // Get dimensions for info display
    try {
      const dimensions = await getMediaDimensions(file)
      const recommendation = getMediaRecommendation(dimensions, deviceType)
      const info = { dimensions, recommendation } as typeof mediaInfoDesktop.value

      // Check video duration
      if (file.type.startsWith('video/') && dimensions.duration !== undefined) {
        const durationCheck = checkVideoDuration(dimensions.duration)
        if (durationCheck.message) {
          info!.durationWarning = durationCheck.message
        }
      }

      // Store info based on device type
      if (deviceType === 'desktop') {
        mediaInfoDesktop.value = info
      } else if (deviceType === 'mobile') {
        mediaInfoMobile.value = info
      } else {
        mediaInfoUniversal.value = info
      }
    } catch (err) {
      console.error('Failed to get media dimensions:', err)
    }

    // Upload the file
    await uploadMedia(file, deviceType, localMediaType.value)

    // Clear uploading state
    uploadingDevice.value = null

    // Clear input
    input.value = ''
  }

  const handleDelete = async (deviceType: DeviceType) => {
    if (confirm(adminT.value.heroBackground?.confirmDelete ?? 'Delete this background media?')) {
      // Set deleting state
      deletingDevice.value = deviceType

      await deleteMedia(deviceType)

      // Clear deleting state
      deletingDevice.value = null

      // Clear info
      if (deviceType === 'desktop') {
        mediaInfoDesktop.value = null
      } else if (deviceType === 'mobile') {
        mediaInfoMobile.value = null
      } else {
        mediaInfoUniversal.value = null
      }
    }
  }

  const triggerFileInput = (deviceType: DeviceType) => {
    if (deviceType === 'desktop') {
      desktopFileInput.value?.click()
    } else if (deviceType === 'mobile') {
      mobileFileInput.value?.click()
    } else {
      universalFileInput.value?.click()
    }
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
        {{ adminT.heroBackground?.title ?? 'Hero Background' }}
      </h3>
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.heroBackground?.subtitle ?? 'Add an image or video behind your wedding info' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sage"></div>
    </div>

    <!-- Error State -->
    <div
      v-if="loadError || saveError"
      class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <p class="font-body text-sm text-red-700 dark:text-red-300">
        {{ loadError || saveError }}
      </p>
    </div>

    <template v-if="!isLoading">
      <!-- Media Type Selection -->
      <div class="border border-sand-dark dark:border-dark-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <label class="block font-body text-sm text-charcoal dark:text-dark-text">
            {{ adminT.heroBackground?.mediaType ?? 'Media Type' }}
          </label>
          <svg
            v-if="changingMediaType"
            class="animate-spin h-4 w-4 text-sage"
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
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-4 py-2 font-body text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              localMediaType === 'none'
                ? 'bg-sage text-white'
                : 'bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated'
            "
            :disabled="changingMediaType"
            @click="handleMediaTypeChange('none')"
          >
            {{ adminT.heroBackground?.none ?? 'None (Solid Color)' }}
          </button>
          <button
            type="button"
            class="px-4 py-2 font-body text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              localMediaType === 'image'
                ? 'bg-sage text-white'
                : 'bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated'
            "
            :disabled="changingMediaType"
            @click="handleMediaTypeChange('image')"
          >
            {{ adminT.heroBackground?.image ?? 'Image' }}
          </button>
          <button
            type="button"
            class="px-4 py-2 font-body text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              localMediaType === 'video'
                ? 'bg-sage text-white'
                : 'bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated'
            "
            :disabled="changingMediaType"
            @click="handleMediaTypeChange('video')"
          >
            {{ adminT.heroBackground?.video ?? 'Video' }}
          </button>
        </div>
      </div>

      <!-- Upload Mode Selection (only shown when media type is not 'none') -->
      <div
        v-if="localMediaType !== 'none'"
        class="border border-sand-dark dark:border-dark-border rounded-lg p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <label class="block font-body text-sm text-charcoal dark:text-dark-text">
            {{ adminT.heroBackground?.uploadMode ?? 'Upload Mode' }}
          </label>
          <svg
            v-if="changingUploadMode"
            class="animate-spin h-4 w-4 text-sage"
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
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <div class="space-y-2">
          <label
            class="flex items-center gap-3"
            :class="changingUploadMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
          >
            <input
              type="radio"
              name="uploadMode"
              value="single"
              :checked="localUploadMode === 'single'"
              :disabled="changingUploadMode"
              class="w-4 h-4 text-sage border-sand-dark focus:ring-sage disabled:cursor-not-allowed"
              @change="handleUploadModeChange('single')"
            />
            <div>
              <span class="font-body text-sm text-charcoal dark:text-dark-text">
                {{ adminT.heroBackground?.singleUpload ?? 'Single upload for both devices' }}
              </span>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{
                  adminT.heroBackground?.singleUploadDesc ??
                  'Quick option - one media works everywhere'
                }}
              </p>
            </div>
          </label>
          <label
            class="flex items-center gap-3"
            :class="changingUploadMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
          >
            <input
              type="radio"
              name="uploadMode"
              value="separate"
              :checked="localUploadMode === 'separate'"
              :disabled="changingUploadMode"
              class="w-4 h-4 text-sage border-sand-dark focus:ring-sage disabled:cursor-not-allowed"
              @change="handleUploadModeChange('separate')"
            />
            <div>
              <span class="font-body text-sm text-charcoal dark:text-dark-text">
                {{
                  adminT.heroBackground?.separateUpload ?? 'Separate uploads for desktop & mobile'
                }}
              </span>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{
                  adminT.heroBackground?.separateUploadDesc ??
                  'Best quality - optimized for each device'
                }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Hidden Media Notice -->
      <div
        v-if="hasHiddenMedia && hiddenMediaDetails"
        class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <div class="flex items-start gap-2">
          <svg
            class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
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
          <div>
            <p class="font-body text-sm text-amber-700 dark:text-amber-300">
              {{
                adminT.heroBackground?.hiddenMediaTitle ??
                "You have existing media that won't be displayed"
              }}
            </p>
            <p class="font-body text-xs text-amber-600 dark:text-amber-400 mt-1">
              {{
                adminT.heroBackground?.hiddenMediaDesc ??
                "The following media exists but won't show because you selected a different media type:"
              }}
              {{ hiddenMediaDetails.join(', ') }}
            </p>
            <p class="font-body text-xs text-amber-600 dark:text-amber-400 mt-1">
              {{
                adminT.heroBackground?.hiddenMediaHint ??
                'Switch back to the original media type to see it, or upload new media of the selected type.'
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Upload Areas -->
      <template v-if="localMediaType !== 'none'">
        <!-- Single Upload Mode -->
        <div
          v-if="localUploadMode === 'single'"
          class="border border-sand-dark dark:border-dark-border rounded-lg p-4"
        >
          <h4 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2">
            {{ adminT.heroBackground?.universalBackground ?? 'Universal Background' }}
          </h4>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3">
            {{
              adminT.heroBackground?.universalRecommend ??
              'Recommended: 1920x1440px (4:3) or square'
            }}
            (max {{ maxFileSizeText }})
          </p>

          <!-- Preview or Upload Area -->
          <div v-if="hasUniversal" class="relative">
            <!-- Preview -->
            <div
              class="relative aspect-video bg-sand dark:bg-dark-bg-secondary rounded-lg overflow-hidden"
            >
              <img
                v-if="heroBackground.mediaType === 'image' && heroBackground.universal"
                :src="heroBackground.universal.url"
                class="w-full h-full object-cover"
                alt="Universal background"
              />
              <video
                v-else-if="heroBackground.mediaType === 'video' && heroBackground.universal"
                :src="heroBackground.universal.url"
                class="w-full h-full object-cover"
                muted
                loop
                autoplay
                playsinline
              />
              <!-- Deleting Overlay -->
              <div
                v-if="deletingDevice === 'universal'"
                class="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <div class="flex flex-col items-center gap-2">
                  <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span class="text-white text-sm font-body">{{
                    adminT.heroBackground?.deleting ?? 'Deleting...'
                  }}</span>
                </div>
              </div>
            </div>
            <!-- Info -->
            <div
              v-if="heroBackground.universal"
              class="mt-2 p-2 bg-sand dark:bg-dark-bg-secondary rounded text-xs"
            >
              <div class="grid grid-cols-2 gap-2 text-charcoal-light dark:text-dark-text-secondary">
                <span
                  >{{ adminT.heroBackground?.resolution ?? 'Resolution' }}:
                  {{ formatDimensions(heroBackground.universal.dimensions) }}</span
                >
                <span
                  >{{ adminT.heroBackground?.size ?? 'Size' }}:
                  {{ formatFileSize(heroBackground.universal.fileSize) }}</span
                >
                <span
                  >{{ adminT.heroBackground?.format ?? 'Format' }}:
                  {{ getMimeTypeDisplay(heroBackground.universal.mimeType) }}</span
                >
                <span
                  >{{ adminT.heroBackground?.aspectRatio ?? 'Aspect' }}:
                  {{ formatAspectRatio(heroBackground.universal.dimensions.aspectRatio) }}</span
                >
              </div>
            </div>
            <!-- Delete Button -->
            <button
              type="button"
              class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="deletingDevice === 'universal'"
              @click="handleDelete('universal')"
            >
              <svg
                v-if="deletingDevice !== 'universal'"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </button>
          </div>
          <div v-else-if="uploadingDevice === 'universal'">
            <!-- Uploading State with Progress Bar -->
            <div class="border-2 border-sage rounded-lg p-6 bg-sage/5">
              <div class="flex items-center gap-3 mb-3">
                <svg
                  class="w-8 h-8 text-sage animate-spin flex-shrink-0"
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
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <p class="font-body text-sm text-sage font-medium">
                      {{ adminT.heroBackground?.uploading ?? 'Uploading...' }}
                    </p>
                    <span class="font-body text-sm text-sage font-medium"
                      >{{ getUploadProgress('universal') }}%</span
                    >
                  </div>
                  <div class="h-2 bg-sand dark:bg-dark-bg-secondary rounded-full overflow-hidden">
                    <div
                      class="h-full bg-sage transition-all duration-300 ease-out rounded-full"
                      :style="{ width: `${getUploadProgress('universal')}%` }"
                    />
                  </div>
                </div>
              </div>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{
                  adminT.heroBackground?.pleaseWait ??
                  'Please wait while your file is being uploaded'
                }}
              </p>
            </div>
          </div>
          <div v-else>
            <!-- Upload Dropzone -->
            <div
              class="border-2 border-dashed border-sand-dark dark:border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-sage transition-colors"
              @click="triggerFileInput('universal')"
            >
              <svg
                class="mx-auto w-10 h-10 text-charcoal-light dark:text-dark-text-secondary mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p class="font-body text-sm text-charcoal dark:text-dark-text">
                {{ adminT.heroBackground?.clickToUpload ?? 'Click to upload' }}
              </p>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1">
                {{ localMediaType === 'image' ? 'JPG, PNG, WebP' : 'MP4, WebM' }}
              </p>
            </div>
            <input
              ref="universalFileInput"
              type="file"
              :accept="acceptedTypes"
              class="hidden"
              @change="(e) => handleFileSelect(e, 'universal')"
            />
          </div>
        </div>

        <!-- Separate Upload Mode -->
        <template v-if="localUploadMode === 'separate'">
          <!-- Desktop Upload -->
          <div class="border border-sand-dark dark:border-dark-border rounded-lg p-4">
            <h4 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2">
              {{ adminT.heroBackground?.desktopBackground ?? 'Desktop Background' }}
            </h4>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3">
              {{
                adminT.heroBackground?.desktopRecommend ??
                'Recommended: 1920x1080px (16:9 landscape)'
              }}
              (max {{ maxFileSizeText }})
            </p>

            <div v-if="hasDesktop" class="relative">
              <div
                class="relative aspect-video bg-sand dark:bg-dark-bg-secondary rounded-lg overflow-hidden"
              >
                <img
                  v-if="heroBackground.mediaType === 'image' && heroBackground.desktop"
                  :src="heroBackground.desktop.url"
                  class="w-full h-full object-cover"
                  alt="Desktop background"
                />
                <video
                  v-else-if="heroBackground.mediaType === 'video' && heroBackground.desktop"
                  :src="heroBackground.desktop.url"
                  class="w-full h-full object-cover"
                  muted
                  loop
                  autoplay
                  playsinline
                />
                <!-- Deleting Overlay -->
                <div
                  v-if="deletingDevice === 'desktop'"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <div class="flex flex-col items-center gap-2">
                    <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span class="text-white text-sm font-body">{{
                      adminT.heroBackground?.deleting ?? 'Deleting...'
                    }}</span>
                  </div>
                </div>
              </div>
              <div
                v-if="heroBackground.desktop"
                class="mt-2 p-2 bg-sand dark:bg-dark-bg-secondary rounded text-xs"
              >
                <div
                  class="grid grid-cols-2 gap-2 text-charcoal-light dark:text-dark-text-secondary"
                >
                  <span>{{ formatDimensions(heroBackground.desktop.dimensions) }}</span>
                  <span>{{ formatFileSize(heroBackground.desktop.fileSize) }}</span>
                  <span>{{ getMimeTypeDisplay(heroBackground.desktop.mimeType) }}</span>
                  <span>{{
                    formatAspectRatio(heroBackground.desktop.dimensions.aspectRatio)
                  }}</span>
                </div>
              </div>
              <button
                type="button"
                class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="deletingDevice === 'desktop'"
                @click="handleDelete('desktop')"
              >
                <svg
                  v-if="deletingDevice !== 'desktop'"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </button>
            </div>
            <div v-else-if="uploadingDevice === 'desktop'">
              <!-- Uploading State with Progress Bar -->
              <div class="border-2 border-sage rounded-lg p-6 bg-sage/5">
                <div class="flex items-center gap-3 mb-3">
                  <svg
                    class="w-8 h-8 text-sage animate-spin flex-shrink-0"
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
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                      <p class="font-body text-sm text-sage font-medium">
                        {{ adminT.heroBackground?.uploading ?? 'Uploading...' }}
                      </p>
                      <span class="font-body text-sm text-sage font-medium"
                        >{{ getUploadProgress('desktop') }}%</span
                      >
                    </div>
                    <div class="h-2 bg-sand dark:bg-dark-bg-secondary rounded-full overflow-hidden">
                      <div
                        class="h-full bg-sage transition-all duration-300 ease-out rounded-full"
                        :style="{ width: `${getUploadProgress('desktop')}%` }"
                      />
                    </div>
                  </div>
                </div>
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                  {{
                    adminT.heroBackground?.pleaseWait ??
                    'Please wait while your file is being uploaded'
                  }}
                </p>
              </div>
            </div>
            <div v-else>
              <div
                class="border-2 border-dashed border-sand-dark dark:border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-sage transition-colors"
                @click="triggerFileInput('desktop')"
              >
                <svg
                  class="mx-auto w-10 h-10 text-charcoal-light dark:text-dark-text-secondary mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p class="font-body text-sm text-charcoal dark:text-dark-text">
                  {{ adminT.heroBackground?.uploadDesktop ?? 'Upload desktop background' }}
                </p>
              </div>
              <input
                ref="desktopFileInput"
                type="file"
                :accept="acceptedTypes"
                class="hidden"
                @change="(e) => handleFileSelect(e, 'desktop')"
              />
            </div>
          </div>

          <!-- Mobile Upload -->
          <div class="border border-sand-dark dark:border-dark-border rounded-lg p-4">
            <h4 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2">
              {{ adminT.heroBackground?.mobileBackground ?? 'Mobile Background' }}
            </h4>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3">
              {{
                adminT.heroBackground?.mobileRecommend ?? 'Recommended: 1080x1920px (9:16 portrait)'
              }}
              (max {{ maxFileSizeText }})
            </p>

            <div v-if="hasMobile" class="relative">
              <div
                class="relative aspect-[9/16] max-w-[200px] bg-sand dark:bg-dark-bg-secondary rounded-lg overflow-hidden"
              >
                <img
                  v-if="heroBackground.mediaType === 'image' && heroBackground.mobile"
                  :src="heroBackground.mobile.url"
                  class="w-full h-full object-cover"
                  alt="Mobile background"
                />
                <video
                  v-else-if="heroBackground.mediaType === 'video' && heroBackground.mobile"
                  :src="heroBackground.mobile.url"
                  class="w-full h-full object-cover"
                  muted
                  loop
                  autoplay
                  playsinline
                />
                <!-- Deleting Overlay -->
                <div
                  v-if="deletingDevice === 'mobile'"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <div class="flex flex-col items-center gap-2">
                    <svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span class="text-white text-xs font-body">{{
                      adminT.heroBackground?.deleting ?? 'Deleting...'
                    }}</span>
                  </div>
                </div>
              </div>
              <div
                v-if="heroBackground.mobile"
                class="mt-2 p-2 bg-sand dark:bg-dark-bg-secondary rounded text-xs max-w-[200px]"
              >
                <div class="space-y-1 text-charcoal-light dark:text-dark-text-secondary">
                  <span class="block">{{
                    formatDimensions(heroBackground.mobile.dimensions)
                  }}</span>
                  <span class="block">{{ formatFileSize(heroBackground.mobile.fileSize) }}</span>
                </div>
              </div>
              <button
                type="button"
                class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="deletingDevice === 'mobile'"
                @click="handleDelete('mobile')"
              >
                <svg
                  v-if="deletingDevice !== 'mobile'"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </button>
            </div>
            <div v-else-if="uploadingDevice === 'mobile'">
              <!-- Uploading State with Progress Bar -->
              <div class="border-2 border-sage rounded-lg p-4 bg-sage/5 max-w-[200px]">
                <div class="flex items-center gap-2 mb-2">
                  <svg
                    class="w-6 h-6 text-sage animate-spin flex-shrink-0"
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
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span class="font-body text-sm text-sage font-medium"
                    >{{ getUploadProgress('mobile') }}%</span
                  >
                </div>
                <div class="h-2 bg-sand dark:bg-dark-bg-secondary rounded-full overflow-hidden">
                  <div
                    class="h-full bg-sage transition-all duration-300 ease-out rounded-full"
                    :style="{ width: `${getUploadProgress('mobile')}%` }"
                  />
                </div>
                <p class="font-body text-xs text-sage mt-2">
                  {{ adminT.heroBackground?.uploading ?? 'Uploading...' }}
                </p>
              </div>
            </div>
            <div v-else>
              <div
                class="border-2 border-dashed border-sand-dark dark:border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-sage transition-colors max-w-[200px]"
                @click="triggerFileInput('mobile')"
              >
                <svg
                  class="mx-auto w-10 h-10 text-charcoal-light dark:text-dark-text-secondary mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p class="font-body text-sm text-charcoal dark:text-dark-text">
                  {{ adminT.heroBackground?.uploadMobile ?? 'Upload mobile background' }}
                </p>
              </div>
              <input
                ref="mobileFileInput"
                type="file"
                :accept="acceptedTypes"
                class="hidden"
                @change="(e) => handleFileSelect(e, 'mobile')"
              />
            </div>
          </div>
        </template>
      </template>

      <!-- Overlay Settings -->
      <div
        v-if="localMediaType !== 'none'"
        class="border border-sand-dark dark:border-dark-border rounded-lg p-4"
      >
        <h4 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.heroBackground?.overlaySettings ?? 'Overlay Settings' }}
        </h4>
        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="localOverlayEnabled"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
              @change="handleOverlayChange"
            />
            <div>
              <span class="font-body text-sm text-charcoal dark:text-dark-text">
                {{ adminT.heroBackground?.enableOverlay ?? 'Enable overlay' }}
              </span>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ adminT.heroBackground?.overlayHelp ?? 'Recommended for text readability' }}
              </p>
            </div>
          </label>

          <div v-if="localOverlayEnabled" class="space-y-3 pl-7">
            <div>
              <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-2">
                {{ adminT.heroBackground?.overlayColor ?? 'Color' }}
              </label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="w-8 h-8 rounded-full border-2 transition-all"
                  :class="
                    localOverlayColor === 'black' ? 'border-sage scale-110' : 'border-transparent'
                  "
                  style="background-color: #000"
                  @click="setOverlayBlack"
                />
                <button
                  type="button"
                  class="w-8 h-8 rounded-full border-2 transition-all"
                  :class="
                    localOverlayColor === 'white' ? 'border-sage scale-110' : 'border-sand-dark'
                  "
                  style="background-color: #fff"
                  @click="setOverlayWhite"
                />
                <button
                  type="button"
                  class="w-8 h-8 rounded-full border-2 transition-all bg-sage"
                  :class="
                    localOverlayColor === 'theme' ? 'border-sage scale-110' : 'border-transparent'
                  "
                  @click="setOverlayTheme"
                />
              </div>
            </div>

            <div>
              <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-2">
                {{ adminT.heroBackground?.overlayOpacity ?? 'Opacity' }}: {{ localOverlayOpacity }}%
              </label>
              <input
                v-model.number="localOverlayOpacity"
                type="range"
                min="0"
                max="80"
                class="w-full h-2 bg-sand dark:bg-dark-bg-secondary rounded-lg appearance-none cursor-pointer"
                @change="handleOverlayChange"
              />
              <div
                class="flex justify-between text-xs text-charcoal-light dark:text-dark-text-secondary mt-1"
              >
                <span>0%</span>
                <span>80%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Progress -->
      <div v-if="activeUploads.length > 0" class="space-y-2">
        <div
          v-for="upload in activeUploads"
          :key="upload.id"
          class="p-3 bg-sand dark:bg-dark-bg-secondary rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ upload.filename }}
            </span>
            <span
              class="font-body text-xs"
              :class="
                upload.status === 'error'
                  ? 'text-red-500'
                  : 'text-charcoal-light dark:text-dark-text-secondary'
              "
            >
              {{ upload.status === 'error' ? upload.error : `${upload.progress}%` }}
            </span>
          </div>
          <div class="h-2 bg-sand-dark dark:bg-dark-bg-elevated rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-300"
              :class="upload.status === 'error' ? 'bg-red-500' : 'bg-sage'"
              :style="{ width: `${upload.progress}%` }"
            />
          </div>
          <button
            v-if="upload.status === 'error'"
            type="button"
            class="mt-2 font-body text-xs text-sage hover:text-sage-dark cursor-pointer"
            @click="clearUploadError(upload.id)"
          >
            {{ adminT.common.dismiss ?? 'Dismiss' }}
          </button>
        </div>
      </div>

      <!-- Saving Indicator -->
      <div
        v-if="isSaving"
        class="flex items-center gap-2 text-charcoal-light dark:text-dark-text-secondary"
      >
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span class="font-body text-sm">{{ adminT.common.saving ?? 'Saving...' }}</span>
      </div>
    </template>
  </div>
</template>
