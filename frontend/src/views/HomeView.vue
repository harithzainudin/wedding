<script setup lang="ts">
import HeroSection from "@/components/sections/HeroSection.vue";
import DetailsSection from "@/components/sections/DetailsSection.vue";
import ScheduleSection from "@/components/sections/ScheduleSection.vue";
import RsvpSection from "@/components/sections/RsvpSection.vue";
import StickyNavigation from "@/components/ui/StickyNavigation.vue";
</script>

<template>
  <main class="min-h-screen">
    <HeroSection />
    <DetailsSection />
    <ScheduleSection />
    <RsvpSection />
    <StickyNavigation />
  </main>
</template>
