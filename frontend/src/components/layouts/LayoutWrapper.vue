<script setup lang="ts">
  import { computed } from 'vue'
  import type { DesignSettings, SectionConfig } from '@/types/design'
  import { DEFAULT_DESIGN_SETTINGS } from '@/types/design'
  import ClassicScrollLayout from './ClassicScrollLayout.vue'
  import InvitationCardLayout from './InvitationCardLayout.vue'
  import PageSlideshowLayout from './PageSlideshowLayout.vue'
  import StorybookLayout from './StorybookLayout.vue'
  import ElegantRevealLayout from './ElegantRevealLayout.vue'

  const props = withDefaults(
    defineProps<{
      designSettings?: DesignSettings
      showRsvpSection: boolean
      isAcceptingRsvps: boolean
      rsvpDeadline?: string
    }>(),
    {
      designSettings: () => DEFAULT_DESIGN_SETTINGS,
    }
  )

  // Get visible sections sorted by order
  const visibleSections = computed<SectionConfig[]>(() => {
    const sections = props.designSettings?.sections ?? DEFAULT_DESIGN_SETTINGS.sections
    return sections.filter((s) => s.visible).sort((a, b) => a.order - b.order)
  })

  // Map layout ID to component
  const layoutComponents = {
    'classic-scroll': ClassicScrollLayout,
    'invitation-card': InvitationCardLayout,
    'page-slideshow': PageSlideshowLayout,
    storybook: StorybookLayout,
    'elegant-reveal': ElegantRevealLayout,
  } as const

  const currentLayout = computed(() => {
    const layoutId = props.designSettings?.layoutId ?? 'classic-scroll'
    return layoutComponents[layoutId] ?? ClassicScrollLayout
  })
</script>

<template>
  <component
    :is="currentLayout"
    :design-settings="designSettings"
    :visible-sections="visibleSections"
    :show-rsvp-section="showRsvpSection"
    :is-accepting-rsvps="isAcceptingRsvps"
    v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
  />
</template>
