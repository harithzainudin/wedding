<script setup lang="ts">
  /**
   * Classic Scroll Layout
   *
   * Default vertical scroll layout - sections stacked vertically,
   * user scrolls from top to bottom.
   */
  import type { DesignSettings, SectionConfig } from '@/types/design'
  import SectionRenderer from './SectionRenderer.vue'
  import StickyNavigation from '@/components/ui/StickyNavigation.vue'

  defineProps<{
    designSettings: DesignSettings
    visibleSections: SectionConfig[]
    showRsvpSection: boolean
    isAcceptingRsvps: boolean
    rsvpDeadline?: string
  }>()
</script>

<template>
  <main class="min-h-screen pb-20">
    <SectionRenderer
      v-for="section in visibleSections"
      :key="section.id"
      :section-id="section.id"
      :show-rsvp-section="showRsvpSection"
      :is-accepting-rsvps="isAcceptingRsvps"
      v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
    />
    <StickyNavigation :show-rsvp-button="showRsvpSection" />
  </main>
</template>
