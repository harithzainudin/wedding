<script setup lang="ts">
  import { computed, defineAsyncComponent } from 'vue'
  import type { DesignSettings, SectionConfig } from '@/types/design'
  import { DEFAULT_DESIGN_SETTINGS } from '@/types/design'

  // Lazy load layout components
  const ClassicScrollLayout = defineAsyncComponent(() => import('./ClassicScrollLayout.vue'))
  const InvitationCardLayout = defineAsyncComponent(() => import('./InvitationCardLayout.vue'))
  const PageSlideshowLayout = defineAsyncComponent(() => import('./PageSlideshowLayout.vue'))
  const StorybookLayout = defineAsyncComponent(() => import('./StorybookLayout.vue'))
  const ElegantRevealLayout = defineAsyncComponent(() => import('./ElegantRevealLayout.vue'))

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
  <Suspense>
    <template #default>
      <component
        :is="currentLayout"
        :design-settings="designSettings"
        :visible-sections="visibleSections"
        :show-rsvp-section="showRsvpSection"
        :is-accepting-rsvps="isAcceptingRsvps"
        v-bind="rsvpDeadline ? { rsvpDeadline } : {}"
      />
    </template>
    <template #fallback>
      <main class="min-h-screen bg-sand flex items-center justify-center">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-sage mx-auto mb-4"
          ></div>
          <p class="font-body text-charcoal-light">Loading...</p>
        </div>
      </main>
    </template>
  </Suspense>
</template>
