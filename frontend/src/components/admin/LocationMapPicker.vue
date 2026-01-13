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

const mapContainer = ref<HTMLDivElement>();
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const searchQuery = ref("");
const searchResults = ref<NominatimResult[]>([]);
const isSearching = ref(false);
const showResults = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

const initMap = () => {
  if (!mapContainer.value || map) return;

  fixLeafletIcons();

  map = L.map(mapContainer.value).setView([props.coordinates.lat, props.coordinates.lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  marker = L.marker([props.coordinates.lat, props.coordinates.lng], {
    draggable: !props.disabled,
  }).addTo(map);

  marker.on("dragend", () => {
    if (!marker) return;
    const latlng = marker.getLatLng();
    emit("update:coordinates", { lat: latlng.lat, lng: latlng.lng });
  });

  map.on("click", (e) => {
    if (props.disabled) return;
    const { lat, lng } = e.latlng;
    updateMarkerPosition(lat, lng);
    emit("update:coordinates", { lat, lng });
  });
};

const updateMarkerPosition = (lat: number, lng: number) => {
  if (!marker || !map) return;
  marker.setLatLng([lat, lng]);
  map.panTo([lat, lng]);
};

const searchLocation = async () => {
  showResults.value = searchQuery.value.length > 0;

  if (searchQuery.value.length < 3) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

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
  // Show dropdown immediately when typing (for instant feedback)
  showResults.value = searchQuery.value.length > 0;

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
    <!-- Search Bar (z-[1001] to create stacking context above Leaflet map) -->
    <div class="search-container relative z-[1001]">
      <label class="block font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary mb-1.5">
        Search Location
      </label>
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Type venue name or address..."
          :disabled="disabled"
          class="w-full pl-10 pr-10 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50 disabled:cursor-not-allowed"
          @input="handleSearchInput"
          @focus="showResults = true"
        />
        <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
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
        </div>
        <button
          v-else-if="searchQuery.length > 0"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text"
          @click="searchQuery = ''; searchResults = []; showResults = false"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search Dropdown (z-[1000] to appear above Leaflet map which uses z-index 400+) -->
      <div
        v-if="showResults && searchQuery.length > 0"
        class="absolute z-[1000] w-full mt-1 bg-white dark:bg-dark-bg-secondary border border-sand-dark dark:border-dark-border rounded-lg shadow-lg overflow-hidden"
      >
        <!-- Hint: Type more characters -->
        <div
          v-if="searchQuery.length < 3"
          class="px-4 py-3 flex items-center gap-2 text-charcoal-light dark:text-dark-text-secondary"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="font-body text-sm">
            Type at least 3 characters to search
          </p>
        </div>

        <!-- Searching indicator -->
        <div
          v-else-if="isSearching"
          class="px-4 py-4 flex items-center justify-center gap-2"
        >
          <svg
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
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            Searching for "{{ searchQuery }}"...
          </p>
        </div>

        <!-- Search Results -->
        <div
          v-else-if="searchResults.length > 0"
          class="max-h-60 overflow-y-auto"
        >
          <p class="px-4 py-2 font-body text-xs text-charcoal-light dark:text-dark-text-secondary bg-sand/50 dark:bg-dark-bg-elevated border-b border-sand-dark/30 dark:border-dark-border/30">
            {{ searchResults.length }} location{{ searchResults.length > 1 ? 's' : '' }} found
          </p>
          <button
            v-for="result in searchResults"
            :key="result.place_id"
            type="button"
            class="w-full px-4 py-3 text-left hover:bg-sage/10 dark:hover:bg-sage/20 transition-colors border-b border-sand-dark/30 dark:border-dark-border/30 last:border-b-0 flex items-start gap-3"
            @click="selectResult(result)"
          >
            <svg class="w-5 h-5 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <p class="font-body text-sm text-charcoal dark:text-dark-text line-clamp-2">
              {{ result.display_name }}
            </p>
          </button>
        </div>

        <!-- No Results -->
        <div
          v-else
          class="px-4 py-4 text-center"
        >
          <svg class="w-8 h-8 text-charcoal-light/50 dark:text-dark-text-secondary/50 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            No locations found for "{{ searchQuery }}"
          </p>
          <p class="font-body text-xs text-charcoal-light/70 dark:text-dark-text-secondary/70 mt-1">
            Try a different search term
          </p>
        </div>
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
