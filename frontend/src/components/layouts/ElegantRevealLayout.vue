<script setup lang="ts">
  /**
   * Elegant Reveal Layout
   *
   * Enhanced scroll layout with animated section reveals.
   * Sections fade and slide in as user scrolls.
   */
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import type { DesignSettings, SectionConfig, AnimationSpeed } from '@/types/design'
  import { ANIMATION_DURATIONS } from '@/types/design'
  import SectionRenderer from './SectionRenderer.vue'
  import StickyNavigation from '@/components/ui/StickyNavigation.vue'

  const props = defineProps<{
    designSettings: DesignSettings
    visibleSections: SectionConfig[]
    showRsvpSection: boolean
    isAcceptingRsvps: boolean
    rsvpDeadline?: string
  }>()

  const sectionRefs = ref<(HTMLElement | null)[]>([])
  const revealedSections = ref<Set<number>>(new Set())

  // Animation duration based on settings
  const animationDuration = computed(() => {
    const speed = props.designSettings.animationSpeed ?? 'normal'
    return ANIMATION_DURATIONS[speed as AnimationSpeed]
  })

  // Check if reduced motion is preferred
  const prefersReducedMotion = ref(false)

  // Observe sections for reveal animation
  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.getAttribute('data-section-index') ?? '0', 10)
        revealedSections.value.add(index)
      }
    })
  }

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    // Check for reduced motion preference
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Create intersection observer
    observer = new IntersectionObserver(observerCallback, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    })

    // Observe all section refs
    sectionRefs.value.forEach((ref) => {
      if (ref) observer?.observe(ref)
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  // Get animation class based on index
  const getAnimationClass = (index: number) => {
    if (prefersReducedMotion.value || animationDuration.value === 0) {
      return 'opacity-100'
    }

    const isRevealed = revealedSections.value.has(index)

    // Alternate animation directions
    const direction = index % 3
    const baseClass = isRevealed ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0'

    if (!isRevealed) {
      switch (direction) {
        case 0:
          return `${baseClass} translate-y-8`
        case 1:
          return `${baseClass} -translate-x-8`
        case 2:
          return `${baseClass} translate-x-8`
        default:
          return `${baseClass} translate-y-8`
      }
    }

    return baseClass
  }

  // Get animation delay for staggered effect
  const getAnimationDelay = (index: number) => {
    if (prefersReducedMotion.value || animationDuration.value === 0) {
      return '0ms'
    }
    return `${index * 100}ms`
  }
</script>

<template>
  <main class="min-h-screen pb-20">
    <div
      v-for="(section, index) in visibleSections"
      :key="section.id"
      :ref="
        (el) => {
          sectionRefs[index] = el as HTMLElement | null
        }
      "
      :data-section-index="index"
      class="transition-all ease-out"
      :class="getAnimationClass(index)"
      :style="{
        transitionDuration: `${animationDuration}ms`,
        transitionDelay: getAnimationDelay(index),
      }"
    >
      <SectionRenderer
        :section-id="section.id"
        :show-rsvp-section="showRsvpSection"
        :is-accepting-rsvps="isAcceptingRsvps"
        v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
      />
    </div>
    <StickyNavigation :show-rsvp-button="showRsvpSection" />
  </main>
</template>
