<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { listRsvps } from "@/services/api";
import { useLanguage } from "@/composables/useLanguage";
import type { RsvpSubmission } from "@/types/rsvp";

const { t } = useLanguage();

const wishes = ref<RsvpSubmission[]>([]);
const isLoading = ref(true);
const hasError = ref(false);

// Filter to only show entries with messages
const wishesWithMessages = computed(() =>
  wishes.value.filter((wish) => wish.message && wish.message.trim().length > 0)
);

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fetchWishes = async (): Promise<void> => {
  isLoading.value = true;
  hasError.value = false;

  try {
    const response = await listRsvps();
    if (response.success && response.data) {
      wishes.value = response.data.rsvps;
    } else {
      hasError.value = true;
    }
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchWishes();
});
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 bg-sand">
    <div class="max-w-xl mx-auto">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark mb-2">
        {{ t.guestbook.title }}
      </h2>
      <p class="font-body text-sm sm:text-base text-center text-charcoal-light mb-6 sm:mb-8">
        {{ t.guestbook.subtitle }}
      </p>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center py-8"
      >
        <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"></div>
        <p class="font-body text-sm text-charcoal-light mt-3">
          {{ t.guestbook.loading }}
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="hasError"
        class="text-center py-8"
      >
        <p class="font-body text-sm text-red-600">
          {{ t.guestbook.errorLoading }}
        </p>
        <button
          type="button"
          class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
          @click="fetchWishes"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="wishesWithMessages.length === 0"
        class="text-center py-8"
      >
        <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white rounded-full">
          <svg class="w-8 h-8 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <p class="font-body text-sm text-charcoal-light">
          {{ t.guestbook.noWishes }}
        </p>
      </div>

      <!-- Wishes List -->
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="wish in wishesWithMessages"
          :key="wish.id"
          class="p-4 sm:p-5 bg-white rounded-xl shadow-sm"
        >
          <!-- Quote Icon -->
          <div class="mb-3">
            <svg class="w-6 h-6 text-sage/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>

          <!-- Message -->
          <p class="font-body text-sm sm:text-base text-charcoal leading-relaxed mb-4">
            {{ wish.message }}
          </p>

          <!-- Author -->
          <div class="flex items-center justify-between">
            <p class="font-heading text-sm sm:text-base text-sage-dark">
              — {{ wish.title }} {{ wish.fullName }}
            </p>
            <p class="font-body text-xs text-charcoal-light">
              {{ formatDate(wish.submittedAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
