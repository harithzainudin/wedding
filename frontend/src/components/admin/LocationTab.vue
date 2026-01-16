<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useVenue } from "@/composables/useVenue";
import LocationMapPicker from "./LocationMapPicker.vue";
import LocationForm from "./LocationForm.vue";
import LocationPreview from "./LocationPreview.vue";

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
} = useVenue();

// Local form state (editable copy)
const formData = ref({
  venueName: "",
  address: "",
  parkingInfo: "",
  coordinates: { lat: 0, lng: 0 },
});

// Track if form has unsaved changes
const hasChanges = computed(() => {
  return (
    formData.value.venueName !== venue.value.venueName ||
    formData.value.address !== venue.value.address ||
    formData.value.parkingInfo !== (venue.value.parkingInfo ?? "") ||
    formData.value.coordinates.lat !== venue.value.coordinates.lat ||
    formData.value.coordinates.lng !== venue.value.coordinates.lng
  );
});

// Preview URLs (computed from current coordinates)
const previewGoogleMapsUrl = computed(() => {
  return generateGoogleMapsUrl(
    formData.value.coordinates.lat,
    formData.value.coordinates.lng,
  );
});

const previewWazeUrl = computed(() => {
  return generateWazeUrl(
    formData.value.coordinates.lat,
    formData.value.coordinates.lng,
  );
});

// Sync form data when venue is loaded
const syncFormData = () => {
  formData.value = {
    venueName: venue.value.venueName,
    address: venue.value.address,
    parkingInfo: venue.value.parkingInfo ?? "",
    coordinates: { ...venue.value.coordinates },
  };
};

// Handle coordinate updates from map
const handleCoordinatesUpdate = (coords: { lat: number; lng: number }) => {
  formData.value.coordinates = coords;
};

// Handle address selection from search
const handleAddressSelected = (address: string) => {
  formData.value.address = address;
};

// Save changes
const handleSave = async () => {
  const data: {
    venueName: string;
    address: string;
    coordinates: { lat: number; lng: number };
    parkingInfo?: string;
  } = {
    venueName: formData.value.venueName,
    address: formData.value.address,
    coordinates: formData.value.coordinates,
  };
  if (formData.value.parkingInfo) {
    data.parkingInfo = formData.value.parkingInfo;
  }
  const result = await updateVenue(data);
  // Sync form data after successful save to ensure hasChanges is false
  if (result.success) {
    syncFormData();
  }
};

// Watch for venue changes and sync form
watch(
  () => venue.value,
  () => {
    if (!hasChanges.value) {
      syncFormData();
    }
  },
  { deep: true },
);

onMounted(async () => {
  await fetchVenue();
  syncFormData();
});
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2
        class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text"
      >
        Location Management
      </h2>
      <p
        class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1"
      >
        Update the venue location for guests to find your wedding
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p
        class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3"
      >
        Loading venue settings...
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
        @click="fetchVenue"
      >
        Try Again
      </button>
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Map -->
      <div class="space-y-4">
        <div
          class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4"
        >
          <h3
            class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3"
          >
            Select Location
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
          <h3
            class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3"
          >
            Venue Details
          </h3>
          <LocationForm
            v-model:venue-name="formData.venueName"
            v-model:address="formData.address"
            v-model:parking-info="formData.parkingInfo"
            :coordinates="formData.coordinates"
            :is-saving="isSaving"
            :has-changes="hasChanges"
            @save="handleSave"
            @cancel="syncFormData"
          />

          <!-- Save Error -->
          <div
            v-if="saveError"
            class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
          >
            <p class="font-body text-sm text-red-600 dark:text-red-400">
              {{ saveError }}
            </p>
          </div>

          <!-- Save Success -->
          <div
            v-if="saveSuccess"
            class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <p
              class="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Location saved successfully!
            </p>
          </div>

          <!-- Unsaved Changes Warning -->
          <div
            v-if="hasChanges && !isSaving"
            class="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
          >
            <p
              class="font-body text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2"
            >
              <svg
                class="w-4 h-4"
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
              You have unsaved changes
            </p>
          </div>
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

        <!-- Last Updated Info -->
        <div
          v-if="venue.updatedAt"
          class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg"
        >
          <p
            class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
          >
            Last updated: {{ new Date(venue.updatedAt).toLocaleString() }}
            <span v-if="venue.updatedBy"> by {{ venue.updatedBy }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
