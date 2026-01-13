<script setup lang="ts">
import { RouterView } from "vue-router";
import { onMounted } from "vue";
import { useVenueConfig } from "@/composables/useVenueConfig";

const { loadVenue } = useVenueConfig();

// Load venue data on app mount (fire-and-forget, falls back to static config)
onMounted(() => {
  loadVenue();
});
</script>

<template>
  <RouterView />
</template>
