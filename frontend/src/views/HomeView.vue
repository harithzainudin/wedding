<script setup lang="ts">
import HeroSection from "@/components/sections/HeroSection.vue";
import DetailsSection from "@/components/sections/DetailsSection.vue";
import GallerySection from "@/components/sections/GallerySection.vue";
import ScheduleSection from "@/components/sections/ScheduleSection.vue";
import ContactSection from "@/components/sections/ContactSection.vue";
import QrCodeSection from "@/components/sections/QrCodeSection.vue";
import GuestbookSection from "@/components/sections/GuestbookSection.vue";
import RsvpSection from "@/components/sections/RsvpSection.vue";
import StickyNavigation from "@/components/ui/StickyNavigation.vue";
</script>

<template>
  <main class="min-h-screen">
    <HeroSection />
    <DetailsSection />
    <GallerySection />
    <ScheduleSection />
    <ContactSection />
    <QrCodeSection />
    <GuestbookSection />
    <RsvpSection />
    <StickyNavigation />
  </main>
</template>
