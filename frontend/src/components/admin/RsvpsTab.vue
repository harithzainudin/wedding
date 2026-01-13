<script setup lang="ts">
import { onMounted } from "vue";
import { useRsvps } from "@/composables/useRsvps";

const {
  filteredRsvps,
  isLoading,
  loadError,
  filter,
  summary,
  fetchRsvps,
  setFilter,
  formatDate,
  exportToCsv,
} = useRsvps();

onMounted(() => {
  fetchRsvps();
});
</script>

<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Total RSVPs</p>
        <p class="font-heading text-2xl text-sage-dark dark:text-sage-light">{{ summary.total }}</p>
      </div>
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Attending</p>
        <p class="font-heading text-2xl text-green-600 dark:text-green-400">{{ summary.attending }}</p>
      </div>
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Not Attending</p>
        <p class="font-heading text-2xl text-red-600 dark:text-red-400">{{ summary.notAttending }}</p>
      </div>
      <div class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg">
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Total Guests</p>
        <p class="font-heading text-2xl text-sage-dark dark:text-sage-light">{{ summary.totalGuests }}</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="filter === 'all' ? 'bg-sage text-white' : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'"
          @click="setFilter('all')"
        >
          All ({{ summary.total }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="filter === 'attending' ? 'bg-green-600 text-white' : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'"
          @click="setFilter('attending')"
        >
          Attending ({{ summary.attending }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="filter === 'not_attending' ? 'bg-red-600 text-white' : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'"
          @click="setFilter('not_attending')"
        >
          Not Attending ({{ summary.notAttending }})
        </button>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="exportToCsv"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export CSV
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"></div>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">Loading RSVPs...</p>
    </div>

    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="fetchRsvps"
      >
        Try Again
      </button>
    </div>

    <div v-else-if="filteredRsvps.length === 0" class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl">
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">No RSVPs found.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="rsvp in filteredRsvps"
        :key="rsvp.id"
        class="p-4 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm dark:shadow-lg"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-heading text-lg text-charcoal dark:text-dark-text">
                {{ rsvp.title }} {{ rsvp.fullName }}
              </p>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="rsvp.isAttending ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'"
              >
                {{ rsvp.isAttending ? "Attending" : "Not Attending" }}
              </span>
            </div>
            <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
              {{ rsvp.phoneNumber }}
              <span v-if="rsvp.isAttending"> &bull; {{ rsvp.numberOfGuests }} guest(s)</span>
            </p>
            <p v-if="rsvp.message" class="font-body text-sm text-charcoal dark:text-dark-text mt-2 italic">
              "{{ rsvp.message }}"
            </p>
          </div>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary whitespace-nowrap">
            {{ formatDate(rsvp.submittedAt) }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-6 text-center">
      <button
        type="button"
        class="px-4 py-2 font-body text-sm text-sage hover:text-sage-dark transition-colors cursor-pointer"
        @click="fetchRsvps"
      >
        Refresh
      </button>
    </div>
  </div>
</template>
