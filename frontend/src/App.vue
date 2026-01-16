<script setup lang="ts">
import { RouterView } from "vue-router";
import { onMounted } from "vue";
import { useVenueConfig } from "@/composables/useVenueConfig";
import { useTheme } from "@/composables/useTheme";

const { loadVenue } = useVenueConfig();
const { loadTheme, applyStoredTheme } = useTheme();

// Apply stored theme immediately to prevent flash
applyStoredTheme();

// Load venue and theme data on app mount (fire-and-forget, falls back to defaults)
onMounted(() => {
  loadVenue();
  loadTheme();
});
</script>

<template>
  <RouterView />
</template>
