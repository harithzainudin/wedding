<script setup lang="ts">
import { RouterLink } from "vue-router";
import RsvpSection from "@/components/sections/RsvpSection.vue";
import LanguageToggle from "@/components/ui/LanguageToggle.vue";
import { weddingConfig } from "@/config/wedding";
import { useLanguage } from "@/composables/useLanguage";

const { t } = useLanguage();
</script>

<template>
  <main class="min-h-screen bg-sand">
    <!-- Header -->
    <header class="relative py-8 px-6 text-center">
      <!-- Language Toggle -->
      <div class="absolute top-4 right-4 z-10">
        <LanguageToggle variant="light" />
      </div>

      <RouterLink
        to="/"
        class="inline-block text-sage hover:text-sage-dark transition-colors"
      >
        <p class="font-body text-sm uppercase tracking-wider mb-2">
          {{ t.nav.weddingInvitation }}
        </p>
        <h1 class="font-heading text-2xl sm:text-3xl">
          {{ weddingConfig.couple.bride.nickname }} &
          {{ weddingConfig.couple.groom.nickname }}
        </h1>
      </RouterLink>
    </header>

    <!-- RSVP Form -->
    <RsvpSection />

    <!-- Back Link -->
    <div class="text-center pb-8">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 font-body text-sage hover:text-sage-dark transition-colors"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {{ t.nav.backToInvitation }}
      </RouterLink>
    </div>
  </main>
</template>
