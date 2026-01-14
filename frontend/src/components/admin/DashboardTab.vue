<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { listRsvps, listGalleryImages } from "@/services/api";

type TabType = "dashboard" | "wedding" | "venue" | "schedule" | "gallery" | "contacts" | "rsvps" | "settings";

const emit = defineEmits<{
  (e: "switch-tab", tab: TabType): void;
}>();

// Stats
const rsvpStats = ref({ total: 0, attending: 0, notAttending: 0, totalGuests: 0 });
const galleryCount = ref(0);
const isLoading = ref(true);

const loadStats = async () => {
  isLoading.value = true;
  try {
    // Fetch RSVP stats
    const rsvpData = await listRsvps();
    rsvpStats.value = rsvpData.summary;

    // Fetch gallery count
    const galleryData = await listGalleryImages();
    galleryCount.value = galleryData.images.length;
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
  } finally {
    isLoading.value = false;
  }
};

const quickLinks = computed<{ label: string; tab: TabType; icon: string; description: string }[]>(() => [
  { label: "Wedding Details", tab: "wedding", icon: "heart", description: "Couple & event info" },
  { label: "Venue", tab: "venue", icon: "location", description: "Location settings" },
  { label: "Schedule", tab: "schedule", icon: "calendar", description: "Event timeline" },
  { label: "Gallery", tab: "gallery", icon: "image", description: "Manage photos" },
  { label: "Contacts", tab: "contacts", icon: "phone", description: "Contact people" },
  { label: "RSVPs", tab: "rsvps", icon: "users", description: "Guest responses" },
]);

onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
        Dashboard
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
        Overview of your wedding website
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin" />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading dashboard...
      </p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">Total RSVPs</p>
          <p class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">{{ rsvpStats.total }}</p>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">Attending</p>
          <p class="font-heading text-2xl sm:text-3xl text-green-600 dark:text-green-400">{{ rsvpStats.attending }}</p>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">Total Guests</p>
          <p class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">{{ rsvpStats.totalGuests }}</p>
        </div>
        <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
          <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">Gallery Photos</p>
          <p class="font-heading text-2xl sm:text-3xl text-sage-dark dark:text-sage-light">{{ galleryCount }}</p>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-3">
          Quick Actions
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="link in quickLinks"
            :key="link.tab"
            type="button"
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg text-left hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
            @click="emit('switch-tab', link.tab)"
          >
            <div class="flex items-center gap-3">
              <!-- Icons -->
              <div class="w-10 h-10 rounded-lg bg-sage/10 dark:bg-sage/20 flex items-center justify-center flex-shrink-0">
                <svg v-if="link.icon === 'heart'" class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <svg v-else-if="link.icon === 'location'" class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else-if="link.icon === 'calendar'" class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <svg v-else-if="link.icon === 'image'" class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <svg v-else-if="link.icon === 'phone'" class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <svg v-else-if="link.icon === 'users'" class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="font-heading text-sm font-medium text-charcoal dark:text-dark-text truncate">
                  {{ link.label }}
                </p>
                <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary truncate">
                  {{ link.description }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="text-center">
        <button
          type="button"
          class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors cursor-pointer"
          @click="loadStats"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  </div>
</template>
