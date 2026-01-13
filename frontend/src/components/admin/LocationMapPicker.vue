<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NominatimResult } from "@/types/venue";

const props = defineProps<{
  coordinates: { lat: number; lng: number };
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:coordinates": [coords: { lat: number; lng: number }];
  "address-selected": [address: string];
}>();

// Map refs
const mapContainer = ref<HTMLDivElement>();
let map: L.Map | null = null;
let marker: L.Marker | null = null;

// Search state
const searchQuery = ref("");
const searchResults = ref<NominatimResult[]>([]);
const isSearching = ref(false);
const showResults = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Fix Leaflet default icon paths
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

// Initialize map
const initMap = () => {
  if (!mapContainer.value || map) return;

  fixLeafletIcons();

  map = L.map(mapContainer.value).setView([props.coordinates.lat, props.coordinates.lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Add marker
  marker = L.marker([props.coordinates.lat, props.coordinates.lng], {
    draggable: !props.disabled,
  }).addTo(map);

  // Handle marker drag
  marker.on("dragend", () => {
    if (!marker) return;
    const latlng = marker.getLatLng();
    emit("update:coordinates", { lat: latlng.lat, lng: latlng.lng });
  });

  // Handle map click
  map.on("click", (e) => {
    if (props.disabled) return;
    const { lat, lng } = e.latlng;
    updateMarkerPosition(lat, lng);
    emit("update:coordinates", { lat, lng });
  });
};

// Update marker position
const updateMarkerPosition = (lat: number, lng: number) => {
  if (!marker || !map) return;
  marker.setLatLng([lat, lng]);
  map.panTo([lat, lng]);
};

// Search for locations using Nominatim
const searchLocation = async () => {
  if (searchQuery.value.length < 3) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }

  isSearching.value = true;
  showResults.value = true;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=5`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    const data = (await response.json()) as NominatimResult[];
    searchResults.value = data;
  } catch (error) {
    console.error("Search error:", error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

// Debounced search
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(searchLocation, 500);
};

// Select a search result
const selectResult = (result: NominatimResult) => {
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);

  updateMarkerPosition(lat, lng);
  emit("update:coordinates", { lat, lng });
  emit("address-selected", result.display_name);

  searchQuery.value = "";
  searchResults.value = [];
  showResults.value = false;
};

// Close results when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".search-container")) {
    showResults.value = false;
  }
};

// Watch for external coordinate changes
watch(
  () => props.coordinates,
  (newCoords) => {
    if (marker && map) {
      updateMarkerPosition(newCoords.lat, newCoords.lng);
    }
  },
  { deep: true }
);

// Watch for disabled state changes
watch(
  () => props.disabled,
  (disabled) => {
    if (marker) {
      if (disabled) {
        marker.dragging?.disable();
      } else {
        marker.dragging?.enable();
      }
    }
  }
);

onMounted(() => {
  initMap();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="space-y-3">
    <!-- Search Bar -->
    <div class="search-container relative">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search for a location..."
          :disabled="disabled"
          class="w-full px-4 py-2.5 pr-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 disabled:cursor-not-allowed"
          @input="handleSearchInput"
          @focus="showResults = searchResults.length > 0"
        />
        <div class="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            v-if="isSearching"
            class="w-5 h-5 text-sage animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
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
          <svg v-else class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Search Results Dropdown -->
      <div
        v-if="showResults && searchResults.length > 0"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <button
          v-for="result in searchResults"
          :key="result.place_id"
          type="button"
          class="w-full px-4 py-3 text-left hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors border-b border-sand-dark/30 dark:border-dark-border/30 last:border-b-0"
          @click="selectResult(result)"
        >
          <p class="font-body text-sm text-charcoal dark:text-dark-text line-clamp-2">
            {{ result.display_name }}
          </p>
        </button>
      </div>

      <!-- No Results -->
      <div
        v-else-if="showResults && !isSearching && searchQuery.length >= 3 && searchResults.length === 0"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-lg shadow-lg p-4"
      >
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary text-center">
          No locations found
        </p>
      </div>
    </div>

    <!-- Map Container -->
    <div
      ref="mapContainer"
      class="w-full h-64 md:h-80 rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden"
      :class="{ 'opacity-50 pointer-events-none': disabled }"
    />

    <!-- Instructions -->
    <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
      Click on the map or drag the marker to set the exact location
    </p>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
