<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWeddingDetails } from "@/composables/useWeddingDetails";

const {
  weddingDetails,
  isLoading,
  loadError,
  isSaving,
  saveError,
  saveSuccess,
  fetchWeddingDetails,
  updateWeddingDetails,
} = useWeddingDetails();

// Local form state
const formData = ref({
  couple: {
    bride: { fullName: "", nickname: "" },
    groom: { fullName: "", nickname: "" },
  },
  parents: {
    bride: { father: "", mother: "" },
    groom: { father: "", mother: "" },
  },
  eventDate: "",
  dressCode: "",
  hashtag: "",
  qrCodeUrl: "",
});

// Track if form has unsaved changes
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify({
    couple: weddingDetails.value.couple,
    parents: weddingDetails.value.parents,
    eventDate: weddingDetails.value.eventDate,
    dressCode: weddingDetails.value.dressCode,
    hashtag: weddingDetails.value.hashtag,
    qrCodeUrl: weddingDetails.value.qrCodeUrl,
  });
});

// Sync form data when wedding details are loaded
const syncFormData = () => {
  formData.value = {
    couple: {
      bride: { ...weddingDetails.value.couple.bride },
      groom: { ...weddingDetails.value.couple.groom },
    },
    parents: {
      bride: { ...weddingDetails.value.parents.bride },
      groom: { ...weddingDetails.value.parents.groom },
    },
    eventDate: weddingDetails.value.eventDate,
    dressCode: weddingDetails.value.dressCode,
    hashtag: weddingDetails.value.hashtag,
    qrCodeUrl: weddingDetails.value.qrCodeUrl,
  };
};

// Format datetime for input - handles timezone correctly
const formattedEventDate = computed({
  get: () => {
    if (!formData.value.eventDate) return "";
    const date = new Date(formData.value.eventDate);
    // Format as local datetime for the input (YYYY-MM-DDTHH:MM)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },
  set: (value: string) => {
    if (value) {
      // Parse the local datetime and store with timezone offset
      const date = new Date(value);
      const tzOffset = -date.getTimezoneOffset();
      const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, "0");
      const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, "0");
      const tzSign = tzOffset >= 0 ? "+" : "-";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      formData.value.eventDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMinutes}`;
    }
  },
});

// Save changes
const handleSave = async () => {
  await updateWeddingDetails(formData.value);
};

// Watch for wedding details changes and sync form
watch(
  () => weddingDetails.value,
  () => {
    if (!hasChanges.value) {
      syncFormData();
    }
  },
  { deep: true }
);

onMounted(async () => {
  await fetchWeddingDetails();
  syncFormData();
});
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
        Wedding Details
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
        Manage couple information, parents, and event details
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin" />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading wedding details...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">{{ loadError }}</p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="fetchWeddingDetails"
      >
        Try Again
      </button>
    </div>

    <!-- Form Content -->
    <div v-else class="space-y-6">
      <!-- Couple Information -->
      <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4 sm:p-6">
        <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-4">
          Couple Information
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <!-- Bride -->
          <div class="space-y-3">
            <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">Bride</h4>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Full Name
              </label>
              <input
                v-model="formData.couple.bride.fullName"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Full name"
                :disabled="isSaving"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Nickname
              </label>
              <input
                v-model="formData.couple.bride.nickname"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Nickname"
                :disabled="isSaving"
              />
            </div>
          </div>

          <!-- Groom -->
          <div class="space-y-3">
            <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">Groom</h4>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Full Name
              </label>
              <input
                v-model="formData.couple.groom.fullName"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Full name"
                :disabled="isSaving"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Nickname
              </label>
              <input
                v-model="formData.couple.groom.nickname"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Nickname"
                :disabled="isSaving"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Parents Information -->
      <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4 sm:p-6">
        <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-4">
          Parents Information
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <!-- Bride's Parents -->
          <div class="space-y-3">
            <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">Bride's Parents</h4>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Father's Name
              </label>
              <input
                v-model="formData.parents.bride.father"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Father's name"
                :disabled="isSaving"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Mother's Name
              </label>
              <input
                v-model="formData.parents.bride.mother"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Mother's name"
                :disabled="isSaving"
              />
            </div>
          </div>

          <!-- Groom's Parents -->
          <div class="space-y-3">
            <h4 class="font-body text-sm font-medium text-sage-dark dark:text-sage-light">Groom's Parents</h4>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Father's Name
              </label>
              <input
                v-model="formData.parents.groom.father"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Father's name"
                :disabled="isSaving"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Mother's Name
              </label>
              <input
                v-model="formData.parents.groom.mother"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Mother's name"
                :disabled="isSaving"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Event Details -->
      <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4 sm:p-6">
        <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-4">
          Event Details
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
              Event Date & Time
            </label>
            <input
              v-model="formattedEventDate"
              type="datetime-local"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              :disabled="isSaving"
            />
          </div>
          <div>
            <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
              Dress Code
            </label>
            <input
              v-model="formData.dressCode"
              type="text"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="e.g., Pastel / Earthy Tones"
              :disabled="isSaving"
            />
          </div>
        </div>
      </div>

      <!-- Website Details -->
      <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4 sm:p-6">
        <h3 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-4">
          Website Details
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
              Wedding Hashtag
            </label>
            <input
              v-model="formData.hashtag"
              type="text"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="#YourWeddingHashtag"
              :disabled="isSaving"
            />
          </div>
          <div>
            <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
              QR Code URL
            </label>
            <input
              v-model="formData.qrCodeUrl"
              type="url"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="https://your-wedding-site.com"
              :disabled="isSaving"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div class="flex-1">
          <!-- Save Error -->
          <div v-if="saveError" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="font-body text-sm text-red-600 dark:text-red-400">
              {{ saveError }}
            </p>
          </div>

          <!-- Save Success -->
          <div v-if="saveSuccess" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Wedding details saved successfully!
            </p>
          </div>

          <!-- Unsaved Changes Warning -->
          <div v-if="hasChanges && !isSaving && !saveSuccess" class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p class="font-body text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              You have unsaved changes
            </p>
          </div>
        </div>

        <button
          type="button"
          class="px-6 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          :disabled="isSaving || !hasChanges"
          @click="handleSave"
        >
          {{ isSaving ? "Saving..." : "Save Changes" }}
        </button>
      </div>

      <!-- Last Updated Info -->
      <div v-if="weddingDetails.updatedAt" class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          Last updated: {{ new Date(weddingDetails.updatedAt).toLocaleString() }}
          <span v-if="weddingDetails.updatedBy"> by {{ weddingDetails.updatedBy }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
