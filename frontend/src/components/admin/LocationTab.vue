<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useVenue } from '@/composables/useVenue'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import type { ParkingStep } from '@/types/venue'
  import LocationMapPicker from './LocationMapPicker.vue'
  import LocationForm from './LocationForm.vue'
  import LocationPreview from './LocationPreview.vue'
  import ParkingForm from './ParkingForm.vue'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()

  const route = useRoute()
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })
  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const {
    venue,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchVenue,
    updateVenue,
    generateGoogleMapsUrl,
    generateWazeUrl,
  } = useVenue()

  // Local form state (editable copy)
  const formData = ref({
    venueName: '',
    address: '',
    parkingInfo: '',
    parkingSteps: [] as ParkingStep[],
    parkingVideoUrl: '',
    showParkingImages: true,
    showParkingDirections: true,
    showParkingVideo: true,
    coordinates: { lat: 0, lng: 0 },
  })

  // Track if form has unsaved changes
  const hasChanges = computed(() => {
    const stepsChanged =
      JSON.stringify(formData.value.parkingSteps) !== JSON.stringify(venue.value.parkingSteps ?? [])
    return (
      formData.value.venueName !== venue.value.venueName ||
      formData.value.address !== venue.value.address ||
      formData.value.parkingInfo !== (venue.value.parkingInfo ?? '') ||
      stepsChanged ||
      formData.value.parkingVideoUrl !== (venue.value.parkingVideoUrl ?? '') ||
      formData.value.showParkingImages !== (venue.value.showParkingImages ?? true) ||
      formData.value.showParkingDirections !== (venue.value.showParkingDirections ?? true) ||
      formData.value.showParkingVideo !== (venue.value.showParkingVideo ?? true) ||
      formData.value.coordinates.lat !== venue.value.coordinates.lat ||
      formData.value.coordinates.lng !== venue.value.coordinates.lng
    )
  })

  // Preview URLs (computed from current coordinates)
  const previewGoogleMapsUrl = computed(() => {
    return generateGoogleMapsUrl(formData.value.coordinates.lat, formData.value.coordinates.lng)
  })

  const previewWazeUrl = computed(() => {
    return generateWazeUrl(formData.value.coordinates.lat, formData.value.coordinates.lng)
  })

  // Sync form data when venue is loaded
  const syncFormData = () => {
    formData.value = {
      venueName: venue.value.venueName,
      address: venue.value.address,
      parkingInfo: venue.value.parkingInfo ?? '',
      parkingSteps: venue.value.parkingSteps
        ? JSON.parse(JSON.stringify(venue.value.parkingSteps))
        : [],
      parkingVideoUrl: venue.value.parkingVideoUrl ?? '',
      showParkingImages: venue.value.showParkingImages ?? true,
      showParkingDirections: venue.value.showParkingDirections ?? true,
      showParkingVideo: venue.value.showParkingVideo ?? true,
      coordinates: { ...venue.value.coordinates },
    }
  }

  // Handle coordinate updates from map
  const handleCoordinatesUpdate = (coords: { lat: number; lng: number }) => {
    formData.value.coordinates = coords
  }

  // Handle address selection from search
  const handleAddressSelected = (address: string) => {
    formData.value.address = address
  }

  // Save changes
  const handleSave = async () => {
    const data: {
      venueName: string
      address: string
      coordinates: { lat: number; lng: number }
      parkingInfo?: string
      parkingSteps?: ParkingStep[]
      parkingVideoUrl?: string
      showParkingImages?: boolean
      showParkingDirections?: boolean
      showParkingVideo?: boolean
    } = {
      venueName: formData.value.venueName,
      address: formData.value.address,
      coordinates: formData.value.coordinates,
      showParkingImages: formData.value.showParkingImages,
      showParkingDirections: formData.value.showParkingDirections,
      showParkingVideo: formData.value.showParkingVideo,
    }
    if (formData.value.parkingInfo) {
      data.parkingInfo = formData.value.parkingInfo
    }
    if (formData.value.parkingSteps.length > 0) {
      data.parkingSteps = formData.value.parkingSteps
    }
    if (formData.value.parkingVideoUrl) {
      data.parkingVideoUrl = formData.value.parkingVideoUrl
    }

    await withLoading(
      async () => {
        const result = await updateVenue(data, weddingId.value ?? undefined)
        // Sync form data after successful save to ensure hasChanges is false
        if (result.success) {
          syncFormData()
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Watch for venue changes and sync form
  watch(
    () => venue.value,
    () => {
      if (!hasChanges.value) {
        syncFormData()
      }
    },
    { deep: true }
  )

  onMounted(async () => {
    if (weddingSlug.value) {
      await fetchVenue(weddingSlug.value)
    }
    syncFormData()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
        {{ adminT.venue.title }}
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
        {{ adminT.venue.subtitle }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.venue.loadingVenue }}
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-3"
      >
        <svg
          class="w-6 h-6 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="weddingSlug && fetchVenue(weddingSlug)"
      >
        {{ adminT.common.tryAgain }}
      </button>
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Map -->
      <div class="space-y-4">
        <div
          class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4"
        >
          <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3">
            {{ adminT.venue.selectLocation }}
          </h3>
          <LocationMapPicker
            :coordinates="formData.coordinates"
            :disabled="isSaving"
            @update:coordinates="handleCoordinatesUpdate"
            @address-selected="handleAddressSelected"
          />
        </div>

        <!-- Preview (shown below map on mobile) -->
        <div class="lg:hidden">
          <LocationPreview
            :venue-name="formData.venueName"
            :address="formData.address"
            :parking-info="formData.parkingInfo"
            :google-maps-url="previewGoogleMapsUrl"
            :waze-url="previewWazeUrl"
          />
        </div>
      </div>

      <!-- Right Column: Form & Preview -->
      <div class="space-y-4">
        <!-- Form -->
        <div
          class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4"
        >
          <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3">
            {{ adminT.venue.venueDetails }}
          </h3>
          <LocationForm
            v-model:venue-name="formData.venueName"
            v-model:address="formData.address"
            v-model:parking-info="formData.parkingInfo"
            :coordinates="formData.coordinates"
            :is-saving="isSaving"
          />
        </div>

        <!-- Preview (hidden on mobile, shown on desktop) -->
        <div class="hidden lg:block">
          <LocationPreview
            :venue-name="formData.venueName"
            :address="formData.address"
            :parking-info="formData.parkingInfo"
            :google-maps-url="previewGoogleMapsUrl"
            :waze-url="previewWazeUrl"
          />
        </div>
      </div>
    </div>

    <!-- Parking Guide Section (full width below the two columns) -->
    <div v-if="!isLoading && !loadError" class="mt-6">
      <ParkingForm
        v-model:parking-steps="formData.parkingSteps"
        v-model:parking-video-url="formData.parkingVideoUrl"
        v-model:show-parking-images="formData.showParkingImages"
        v-model:show-parking-directions="formData.showParkingDirections"
        v-model:show-parking-video="formData.showParkingVideo"
        :is-saving="isSaving"
      />
    </div>

    <!-- Bottom Save Section -->
    <div
      v-if="!isLoading && !loadError"
      class="mt-6 p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
    >
      <!-- Unsaved Changes Warning -->
      <div
        v-if="hasChanges && !isSaving"
        class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
      >
        <p class="font-body text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {{ adminT.messages.unsavedChanges }}
        </p>
      </div>

      <!-- Save Success -->
      <div v-if="saveSuccess" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p class="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {{ adminT.messages.savedSuccess }}
        </p>
      </div>

      <!-- Save Error -->
      <div v-if="saveError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p class="font-body text-sm text-red-600 dark:text-red-400">
          {{ saveError }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          type="button"
          :disabled="!hasChanges || isSaving"
          class="px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand/50 dark:hover:bg-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          @click="syncFormData"
        >
          {{ adminT.common.resetChanges }}
        </button>
        <button
          type="button"
          :disabled="!hasChanges || isSaving"
          class="flex-1 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          :class="
            hasChanges && !isSaving
              ? 'bg-sage text-white hover:bg-sage-dark'
              : 'bg-sand-dark dark:bg-dark-border text-charcoal-light dark:text-dark-text-secondary cursor-not-allowed'
          "
          @click="handleSave"
        >
          <svg v-if="isSaving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="3"
              class="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              class="opacity-75"
            />
          </svg>
          <span>{{ isSaving ? adminT.common.saving : adminT.common.saveAllChanges }}</span>
        </button>
      </div>
    </div>

    <!-- Last Updated Info -->
    <div
      v-if="!isLoading && !loadError && venue.updatedAt"
      class="mt-6 p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg"
    >
      <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.messages.lastUpdated }}: {{ new Date(venue.updatedAt).toLocaleString() }}
        <span v-if="venue.updatedBy"> {{ adminT.messages.by }} {{ venue.updatedBy }}</span>
      </p>
    </div>
  </div>
</template>
