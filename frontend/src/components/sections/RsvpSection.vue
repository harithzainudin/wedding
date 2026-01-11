<script setup lang="ts">
import { ref, reactive } from "vue";
import type { RsvpFormData } from "@/types/rsvp";
import { HONORIFIC_TITLES } from "@/types";
import { submitRsvp } from "@/services/api";

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
    errorMessage.value = "Sila masukkan nama penuh anda.";
    return;
  }

  if (!formData.phoneNumber.trim()) {
    errorMessage.value = "Sila masukkan nombor telefon anda.";
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await submitRsvp(formData);
    if (response.success) {
      isSubmitted.value = true;
    } else {
      errorMessage.value = response.error ?? "Maaf, terdapat masalah. Sila cuba lagi.";
    }
  } catch {
    errorMessage.value = "Maaf, terdapat masalah. Sila cuba lagi.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <section id="rsvp" class="py-12 sm:py-16 px-4 sm:px-6 bg-white">
    <div class="max-w-md mx-auto">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark mb-1 sm:mb-2">
        RSVP
      </h2>
      <p class="font-body text-sm sm:text-base text-center text-charcoal-light mb-6 sm:mb-8">
        Sila maklumkan kehadiran anda
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
        <h3 class="font-heading text-xl sm:text-2xl text-sage-dark mb-2">
          Terima Kasih!
        </h3>
        <p class="font-body text-sm sm:text-base text-charcoal-light mb-3 sm:mb-4">
          Maklum balas anda telah diterima.
        </p>
        <p
          class="font-body text-xs sm:text-sm italic text-charcoal-light p-3 sm:p-4 bg-sand rounded-lg"
        >
          "Ya Allah, berkatilah majlis ini dan kurniakanlah kebahagiaan kepada
          kedua mempelai. Amin."
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
              class="block font-body text-xs sm:text-sm font-medium text-charcoal mb-1"
            >
              Gelaran
            </label>
            <select
              id="title"
              v-model="formData.title"
              class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
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
              class="block font-body text-xs sm:text-sm font-medium text-charcoal mb-1"
            >
              Nama Penuh *
            </label>
            <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
              placeholder="Nama penuh anda"
              required
            />
          </div>
        </div>

        <!-- Attendance -->
        <div>
          <label class="block font-body text-xs sm:text-sm font-medium text-charcoal mb-2">
            Kehadiran *
          </label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg active:bg-sand/50">
              <input
                v-model="formData.isAttending"
                type="radio"
                :value="true"
                class="w-4 h-4 accent-sage"
              />
              <span class="font-body text-sm sm:text-base text-charcoal">
                Ya, saya akan hadir
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer p-2 -m-2 rounded-lg active:bg-sand/50">
              <input
                v-model="formData.isAttending"
                type="radio"
                :value="false"
                class="w-4 h-4 accent-sage"
              />
              <span class="font-body text-sm sm:text-base text-charcoal">
                Maaf, tidak dapat hadir
              </span>
            </label>
          </div>
        </div>

        <!-- Number of Guests (shown only if attending) -->
        <div v-if="formData.isAttending">
          <label
            for="numberOfGuests"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal mb-1"
          >
            Bilangan Tetamu
          </label>
          <select
            id="numberOfGuests"
            v-model="formData.numberOfGuests"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
          >
            <option
              v-for="num in guestOptions"
              :key="num"
              :value="num"
            >
              {{ num }} orang
            </option>
          </select>
        </div>

        <!-- Phone Number -->
        <div>
          <label
            for="phoneNumber"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal mb-1"
          >
            Nombor Telefon *
          </label>
          <input
            id="phoneNumber"
            v-model="formData.phoneNumber"
            type="tel"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage"
            placeholder="012-3456789"
            required
          />
        </div>

        <!-- Message -->
        <div>
          <label
            for="message"
            class="block font-body text-xs sm:text-sm font-medium text-charcoal mb-1"
          >
            Ucapan / Doa (Pilihan)
          </label>
          <textarea
            id="message"
            v-model="formData.message"
            rows="3"
            class="w-full px-3 py-2.5 font-body text-sm sm:text-base border border-sand-dark rounded-lg bg-sand text-charcoal focus:outline-none focus:border-sage resize-none"
            placeholder="Tinggalkan ucapan atau doa untuk pengantin..."
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
          {{ isSubmitting ? "Menghantar..." : "Hantar RSVP" }}
        </button>
      </form>

      <!-- Spacer for sticky nav -->
      <div class="h-20"></div>
    </div>
  </section>
</template>
