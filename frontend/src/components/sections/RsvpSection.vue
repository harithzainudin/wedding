<script setup lang="ts">
import { ref, reactive } from "vue";
import type { RsvpFormData } from "@/types/rsvp";
import { HONORIFIC_TITLES } from "@/types";
import { submitRsvp } from "@/services/api";
import { useLanguage } from "@/composables/useLanguage";

const { t } = useLanguage();

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const formData = reactive<RsvpFormData>({
  title: "Encik",
  fullName: "",
  isAttending: true,
  numberOfGuests: 1,
  phoneNumber: "",
  message: "",
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref("");

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = "";

  // Basic validation
  if (!formData.fullName.trim()) {
    errorMessage.value = t.value.rsvp.errorName;
    return;
  }

  if (!formData.phoneNumber.trim()) {
    errorMessage.value = t.value.rsvp.errorPhone;
    return;
  }

  isSubmitting.value = true;

  try {
    await submitRsvp(formData);
    isSubmitted.value = true;
  } catch {
    errorMessage.value = t.value.rsvp.errorGeneric;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <section id="rsvp" class="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-dark-bg-secondary transition-colors duration-300">
    <div class="max-w-md mx-auto">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark dark:text-sage-light mb-1 sm:mb-2">
        {{ t.rsvp.title }}
      </h2>
      <p class="font-body text-sm sm:text-base text-center text-charcoal-light dark:text-dark-text-secondary mb-6 sm:mb-8">
        {{ t.rsvp.subtitle }}
      </p>

      <!-- Success Message -->
      <div
        v-if="isSubmitted"
        class="text-center p-6 sm:p-8"
      >
        <div
          class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl text-white bg-sage rounded-full"
        >
          ✓
        </div>
        <h3 class="font-heading text-xl sm:text-2xl text-sage-dark dark:text-sage-light mb-2">
          {{ t.rsvp.thankYou }}
        </h3>
        <p class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-3 sm:mb-4">
          {{ t.rsvp.responseReceived }}
        </p>
        <p
          class="font-body text-xs sm:text-sm italic text-charcoal-light dark:text-dark-text-secondary p-3 sm:p-4 bg-sand dark:bg-dark-bg-elevated rounded-lg"
        >
          {{ t.rsvp.prayer }}
        </p>
      </div>

      <!-- RSVP Form -->
      <form
        v-else
        class="space-y-4 sm:space-y-5"
        @submit.prevent="handleSubmit"
      >
        <!-- Title & Name - Stack on mobile -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="w-full sm:w-28">
            <label
              for="title"
              class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
            >
              {{ t.rsvp.titleLabel }}
            </label>
            <select
              id="title"
              v-model="formData.title"
              class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
            >
              <option
                v-for="title in HONORIFIC_TITLES"
                :key="title"
                :value="title"
              >
                {{ title }}
              </option>
            </select>
          </div>

          <div class="flex-1">
            <label
              for="fullName"
              class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
            >
              {{ t.rsvp.fullName }} *
            </label>
            <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
              :placeholder="t.rsvp.fullNamePlaceholder"
              required
            />
          </div>
        </div>

        <!-- Attendance -->
        <div>
          <label class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-2">
            {{ t.rsvp.attendance }} *
          </label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg active:bg-sand/50 dark:active:bg-dark-bg-elevated/50">
              <input
                v-model="formData.isAttending"
                type="radio"
                :value="true"
                class="w-4 h-4 accent-sage"
              />
              <span class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text">
                {{ t.rsvp.attending }}
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg active:bg-sand/50 dark:active:bg-dark-bg-elevated/50">
              <input
                v-model="formData.isAttending"
                type="radio"
                :value="false"
                class="w-4 h-4 accent-sage"
              />
              <span class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text">
                {{ t.rsvp.notAttending }}
              </span>
            </label>
          </div>
        </div>

        <!-- Number of Guests (shown only if attending) -->
        <div v-if="formData.isAttending">
          <label
            for="numberOfGuests"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ t.rsvp.numberOfGuests }}
          </label>
          <select
            id="numberOfGuests"
            v-model="formData.numberOfGuests"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          >
            <option
              v-for="num in guestOptions"
              :key="num"
              :value="num"
            >
              {{ num }} {{ t.rsvp.guestUnit }}
            </option>
          </select>
        </div>

        <!-- Phone Number -->
        <div>
          <label
            for="phoneNumber"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ t.rsvp.phoneNumber }} *
          </label>
          <input
            id="phoneNumber"
            v-model="formData.phoneNumber"
            type="tel"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
            :placeholder="t.rsvp.phonePlaceholder"
            required
          />
        </div>

        <!-- Message -->
        <div>
          <label
            for="message"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >
            {{ t.rsvp.message }}
          </label>
          <textarea
            id="message"
            v-model="formData.message"
            rows="3"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage resize-none placeholder:text-charcoal-light/60 dark:placeholder:text-dark-text-secondary/60"
            :placeholder="t.rsvp.messagePlaceholder"
          ></textarea>
        </div>

        <!-- Error Message -->
        <p
          v-if="errorMessage"
          class="text-red-600 font-body text-xs sm:text-sm text-center"
        >
          {{ errorMessage }}
        </p>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 px-6 font-body text-sm sm:text-base font-medium text-white bg-sage rounded-lg cursor-pointer transition-colors hover:bg-sage-dark active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? t.rsvp.submitting : t.rsvp.submit }}
        </button>
      </form>

      <!-- Spacer for sticky nav -->
      <div class="h-20"></div>
    </div>
  </section>
</template>
