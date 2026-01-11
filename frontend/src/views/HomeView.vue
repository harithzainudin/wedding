<script setup lang="ts">
import HeroSection from "@/components/sections/HeroSection.vue";
import DetailsSection from "@/components/sections/DetailsSection.vue";
import ScheduleSection from "@/components/sections/ScheduleSection.vue";
import ContactSection from "@/components/sections/ContactSection.vue";
import QrCodeSection from "@/components/sections/QrCodeSection.vue";
import RsvpSection from "@/components/sections/RsvpSection.vue";
import StickyNavigation from "@/components/ui/StickyNavigation.vue";
</script>

<template>
  <main class="min-h-screen">
    <HeroSection />
    <DetailsSection />
    <ScheduleSection />
    <ContactSection />
    <QrCodeSection />
    <RsvpSection />
    <StickyNavigation />
  </main>
</template>
