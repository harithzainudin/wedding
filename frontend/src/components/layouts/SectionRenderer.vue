<script setup lang="ts">
  import { computed } from 'vue'
  import type { SectionId } from '@/types/design'
  import HeroSection from '@/components/sections/HeroSection.vue'
  import DetailsSection from '@/components/sections/DetailsSection.vue'
  import GallerySection from '@/components/sections/GallerySection.vue'
  import ScheduleSection from '@/components/sections/ScheduleSection.vue'
  import ContactSection from '@/components/sections/ContactSection.vue'
  import QRCodeHubSection from '@/components/sections/QRCodeHubSection.vue'
  import GuestbookSection from '@/components/sections/GuestbookSection.vue'
  import WishlistPreview from '@/components/sections/WishlistPreview.vue'
  import RsvpSection from '@/components/sections/RsvpSection.vue'

  const props = defineProps<{
    sectionId: SectionId
    showRsvpSection?: boolean
    isAcceptingRsvps?: boolean
    rsvpDeadline?: string
  }>()

  // Map section IDs to components
  const sectionComponents = {
    hero: HeroSection,
    details: DetailsSection,
    gallery: GallerySection,
    schedule: ScheduleSection,
    contact: ContactSection,
    qrcodehub: QRCodeHubSection,
    guestbook: GuestbookSection,
    wishlist: WishlistPreview,
    rsvp: RsvpSection,
  } as const

  const currentSection = computed(() => {
    return sectionComponents[props.sectionId]
  })

  // Determine if section should be rendered
  const shouldRender = computed(() => {
    // Guestbook and RSVP depend on showRsvpSection
    if (props.sectionId === 'guestbook' || props.sectionId === 'rsvp') {
      return props.showRsvpSection
    }
    return true
  })

  // Props for RSVP section
  const rsvpProps = computed(() => {
    if (props.sectionId === 'rsvp') {
      const baseProps: Record<string, unknown> = {
        showRsvp: true,
        isAcceptingRsvps: props.isAcceptingRsvps,
      }
      if (props.rsvpDeadline) {
        baseProps.rsvpDeadline = props.rsvpDeadline
      }
      return baseProps
    }
    return {}
  })
</script>

<template>
  <component v-if="shouldRender" :is="currentSection" v-bind="rsvpProps" />
</template>
