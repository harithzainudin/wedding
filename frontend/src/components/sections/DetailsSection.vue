<script setup lang="ts">
import { computed, ref } from "vue";
import { weddingConfig } from "@/config/wedding";

const formattedDate = computed(() => {
  const date = weddingConfig.event.date;
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("ms-MY", options);
});

const formattedTime = computed(() => {
  const date = weddingConfig.event.date;
  return date.toLocaleTimeString("ms-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

const copied = ref(false);

const copyHashtag = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(weddingConfig.hashtag);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = weddingConfig.hashtag;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 bg-sand">
    <div class="max-w-xl mx-auto text-center">
      <!-- Formal Invitation -->
      <div class="mb-8 sm:mb-12">
        <p class="font-heading text-lg sm:text-xl text-sage-dark mb-4 sm:mb-6">
          Assalamualaikum Warahmatullahi Wabarakatuh
        </p>

        <p class="font-body text-sm sm:text-base text-charcoal-light leading-relaxed mb-4 sm:mb-6">
          Dengan penuh kesyukuran ke hadrat Ilahi, kami
        </p>

        <!-- Bride's Parents -->
        <div class="mb-3 sm:mb-4">
          <p class="font-heading text-base sm:text-lg text-charcoal">
            {{ weddingConfig.parents.bride.father }}
          </p>
          <p class="font-heading text-base sm:text-lg text-charcoal">
            & {{ weddingConfig.parents.bride.mother }}
          </p>
        </div>

        <p class="font-body text-sm sm:text-base text-charcoal-light mb-3 sm:mb-4">
          bersama
        </p>

        <!-- Groom's Parents -->
        <div class="mb-4 sm:mb-6">
          <p class="font-heading text-base sm:text-lg text-charcoal">
            {{ weddingConfig.parents.groom.father }}
          </p>
          <p class="font-heading text-base sm:text-lg text-charcoal">
            & {{ weddingConfig.parents.groom.mother }}
          </p>
        </div>

        <p class="font-body text-xs sm:text-sm text-charcoal-light leading-relaxed px-2">
          dengan segala hormatnya menjemput
          <br class="hidden sm:block" />
          <span class="sm:hidden"> </span>
          Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan /
          Puan / Encik / Cik
          <br />
          ke majlis perkahwinan puteri/putera kesayangan kami
        </p>
      </div>

      <!-- Couple Names -->
      <div class="mb-8 sm:mb-12">
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-sage-dark mb-1 sm:mb-2 leading-tight">
          {{ weddingConfig.couple.bride.fullName }}
        </h2>
        <p class="font-heading text-xl sm:text-2xl text-charcoal-light mb-1 sm:mb-2">
          &
        </p>
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-sage-dark leading-tight">
          {{ weddingConfig.couple.groom.fullName }}
        </h2>
      </div>

      <!-- Divider -->
      <div class="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
        <div class="h-px w-12 sm:w-16 bg-sage/30"></div>
        <div class="w-2 h-2 rounded-full bg-sage/50"></div>
        <div class="h-px w-12 sm:w-16 bg-sage/30"></div>
      </div>

      <!-- Event Details -->
      <div class="space-y-4 sm:space-y-5">
        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light mb-1">
            Tarikh
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal">
            {{ formattedDate }}
          </p>
        </div>

        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light mb-1">
            Masa
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal">
            {{ formattedTime }}
          </p>
        </div>

        <div>
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light mb-1">
            Tempat
          </p>
          <p class="font-heading text-lg sm:text-xl text-charcoal mb-1">
            {{ weddingConfig.event.venue.name }}
          </p>
          <p class="font-body text-xs sm:text-sm text-charcoal-light px-4">
            {{ weddingConfig.event.venue.address }}
          </p>
        </div>

        <!-- Parking Info -->
        <div
          v-if="weddingConfig.event.venue.parkingInfo"
          class="mt-2 p-3 sm:p-4 bg-white/50 rounded-lg"
        >
          <div class="flex items-start gap-2 justify-center">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
            </svg>
            <p class="font-body text-xs sm:text-sm text-charcoal-light text-left">
              {{ weddingConfig.event.venue.parkingInfo }}
            </p>
          </div>
        </div>
      </div>

      <!-- Dress Code & Hashtag -->
      <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div class="flex-1 p-3 sm:p-4 bg-white rounded-lg">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light mb-1">
            Dress Code
          </p>
          <p class="font-heading text-base sm:text-lg text-sage-dark">
            {{ weddingConfig.dressCode }}
          </p>
        </div>

        <div class="flex-1 p-3 sm:p-4 bg-white rounded-lg">
          <p class="font-body text-xs sm:text-sm uppercase tracking-wider text-charcoal-light mb-1">
            Share Your Moments
          </p>
          <button
            type="button"
            class="font-heading text-base sm:text-lg text-sage-dark hover:text-sage cursor-pointer transition-colors"
            @click="copyHashtag"
          >
            {{ weddingConfig.hashtag }}
          </button>
          <p
            v-if="copied"
            class="font-body text-xs text-sage mt-1"
          >
            Copied!
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
