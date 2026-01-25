<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import type {
    LayoutId,
    AnimationSpeed,
    SectionConfig,
    DesignSettings,
    InvitationCardSettings,
    PageSlideshowSettings,
    StorybookSettings,
    BackgroundFeatureConfig,
  } from '@/types/design'
  import {
    LAYOUT_DEFINITIONS,
    DEFAULT_SECTION_ORDER,
    DEFAULT_BACKGROUND_FEATURES,
  } from '@/types/design'
  import { useDesign } from '@/composables/useDesign'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import {
    listGalleryImages,
    getScheduleAdmin,
    listGiftsAdmin,
    getMusicAdmin,
  } from '@/services/api'

  const emit = defineEmits<{
    'dirty-state-change': [
      payload: {
        isDirty: boolean
        save: () => Promise<{ success: boolean; error?: string }>
        discard: () => void
      },
    ]
  }>()

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()
  const route = useRoute()

  // Get wedding context from route and token
  const weddingSlug = computed(() => {
    const slug = route.params.weddingSlug
    return typeof slug === 'string' ? slug : null
  })
  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const { designSettings, isLoading, isSaving, error, loadDesign, saveDesign } = useDesign()

  // Deep clone sections to avoid mutating readonly originals
  const cloneSections = (sections: SectionConfig[]): SectionConfig[] =>
    sections.map((s) => ({ ...s }))

  // Deep clone background features
  const cloneBackgroundFeatures = (
    features: BackgroundFeatureConfig[]
  ): BackgroundFeatureConfig[] => features.map((f) => ({ ...f }))

  // Local state
  const selectedLayoutId = ref<LayoutId>('classic-scroll')
  const selectedAnimationSpeed = ref<AnimationSpeed>('normal')
  const localSections = ref<SectionConfig[]>(cloneSections(DEFAULT_SECTION_ORDER))
  const invitationCardSettings = ref<InvitationCardSettings>({
    showCoverText: true,
    showCoverDate: true,
    autoOpenDelay: 0,
  })
  const pageSlideshowSettings = ref<PageSlideshowSettings>({
    showDots: true,
    showArrows: true,
    autoPlay: false,
    autoPlayInterval: 5,
  })
  const storybookSettings = ref<StorybookSettings>({
    showPageNumbers: true,
  })
  const localBackgroundFeatures = ref<BackgroundFeatureConfig[]>(
    cloneBackgroundFeatures(DEFAULT_BACKGROUND_FEATURES)
  )
  const saveError = ref<string | null>(null)
  const saveSuccess = ref(false)

  // Content counts for empty warnings
  const contentCounts = ref<{
    gallery: number
    schedule: number
    wishlist: number
    music: number
  }>({
    gallery: -1, // -1 = not loaded yet
    schedule: -1,
    wishlist: -1,
    music: -1,
  })

  // Dragging state for section reordering
  const draggedIndex = ref<number | null>(null)

  // Section name lookup
  const sectionNames: Record<string, { en: string; ms: string }> = {
    hero: { en: 'Hero', ms: 'Hero' },
    details: { en: 'Details', ms: 'Butiran' },
    gallery: { en: 'Gallery', ms: 'Galeri' },
    schedule: { en: 'Schedule', ms: 'Jadual' },
    contact: { en: 'Contact', ms: 'Hubungi' },
    qrcodehub: { en: 'QR Code Hub', ms: 'Hub Kod QR' },
    guestbook: { en: 'Guestbook', ms: 'Buku Tetamu' },
    wishlist: { en: 'Gift Registry', ms: 'Senarai Hadiah' },
    rsvp: { en: 'RSVP', ms: 'RSVP' },
  }

  // Get section name based on current language
  const getSectionName = (sectionId: string) => {
    const lang = adminT.value === (adminT.value as unknown) ? 'en' : 'ms'
    return sectionNames[sectionId]?.[lang] ?? sectionId
  }

  // Check if there are unsaved changes
  const hasChanges = computed(() => {
    const saved = designSettings.value

    if (selectedLayoutId.value !== saved.layoutId) return true
    if (selectedAnimationSpeed.value !== saved.animationSpeed) return true

    // Compare sections
    const savedSections = saved.sections ?? DEFAULT_SECTION_ORDER
    if (localSections.value.length !== savedSections.length) return true

    for (let i = 0; i < localSections.value.length; i++) {
      const local = localSections.value[i]
      const savedSection = savedSections[i]
      if (!local || !savedSection) return true
      if (local.id !== savedSection.id) return true
      if (local.visible !== savedSection.visible) return true
      if (local.order !== savedSection.order) return true
    }

    // Compare layout-specific settings
    if (selectedLayoutId.value === 'invitation-card') {
      const savedCard = saved.invitationCard ?? {
        showCoverText: true,
        showCoverDate: true,
        autoOpenDelay: 0,
      }
      if (JSON.stringify(invitationCardSettings.value) !== JSON.stringify(savedCard)) return true
    }

    if (selectedLayoutId.value === 'page-slideshow') {
      const savedSlideshow = saved.pageSlideshow ?? {
        showDots: true,
        showArrows: true,
        autoPlay: false,
        autoPlayInterval: 5,
      }
      if (JSON.stringify(pageSlideshowSettings.value) !== JSON.stringify(savedSlideshow))
        return true
    }

    if (selectedLayoutId.value === 'storybook') {
      const savedStorybook = saved.storybook ?? { showPageNumbers: true }
      if (JSON.stringify(storybookSettings.value) !== JSON.stringify(savedStorybook)) return true
    }

    // Compare background features
    const savedBackgroundFeatures = saved.backgroundFeatures ?? DEFAULT_BACKGROUND_FEATURES
    if (JSON.stringify(localBackgroundFeatures.value) !== JSON.stringify(savedBackgroundFeatures)) {
      return true
    }

    return false
  })

  // Sync local state from loaded settings
  const syncFromSettings = (settings: DesignSettings) => {
    selectedLayoutId.value = settings.layoutId
    selectedAnimationSpeed.value = settings.animationSpeed
    localSections.value = cloneSections(settings.sections ?? DEFAULT_SECTION_ORDER)

    if (settings.invitationCard) {
      invitationCardSettings.value = { ...settings.invitationCard }
    }
    if (settings.pageSlideshow) {
      pageSlideshowSettings.value = { ...settings.pageSlideshow }
    }
    if (settings.storybook) {
      storybookSettings.value = { ...settings.storybook }
    }
    localBackgroundFeatures.value = cloneBackgroundFeatures(
      settings.backgroundFeatures ?? DEFAULT_BACKGROUND_FEATURES
    )
  }

  // Initialize from saved settings
  onMounted(async () => {
    const slug = weddingSlug.value
    if (slug) {
      await loadDesign(slug)
    }
    syncFromSettings(designSettings.value)

    // Fetch content counts for empty warnings
    await fetchContentCounts()
  })

  // Watch for wedding slug changes
  watch(weddingSlug, async (newSlug, oldSlug) => {
    if (newSlug && newSlug !== oldSlug) {
      await loadDesign(newSlug)
      syncFromSettings(designSettings.value)
    }
  })

  // Watch for external settings changes
  watch(
    () => designSettings.value,
    (newSettings) => {
      if (!hasChanges.value) {
        syncFromSettings(newSettings)
      }
    },
    { deep: true }
  )

  // Select a layout
  const selectLayout = (layoutId: LayoutId): void => {
    selectedLayoutId.value = layoutId
    saveError.value = null
    saveSuccess.value = false
  }

  // Toggle section visibility
  const toggleSectionVisibility = (sectionId: string): void => {
    // Hero cannot be hidden
    if (sectionId === 'hero') return

    const section = localSections.value.find((s) => s.id === sectionId)
    if (section) {
      section.visible = !section.visible
    }
  }

  // Drag and drop handlers
  const handleDragStart = (index: number): void => {
    // Hero (index 0) cannot be dragged
    if (index === 0) return
    draggedIndex.value = index
  }

  const handleDragOver = (e: DragEvent, index: number): void => {
    e.preventDefault()
    // Cannot drop on hero position
    if (index === 0) return
  }

  const handleDrop = (targetIndex: number): void => {
    if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
      draggedIndex.value = null
      return
    }

    // Cannot drop on hero position
    if (targetIndex === 0) {
      draggedIndex.value = null
      return
    }

    const items = [...localSections.value]
    const draggedItem = items[draggedIndex.value]
    if (!draggedItem) {
      draggedIndex.value = null
      return
    }

    items.splice(draggedIndex.value, 1)
    items.splice(targetIndex, 0, draggedItem)

    // Update order values
    items.forEach((item, idx) => {
      item.order = idx
    })

    localSections.value = items
    draggedIndex.value = null
  }

  const handleDragEnd = (): void => {
    draggedIndex.value = null
  }

  // Reset section order
  const resetSectionOrder = (): void => {
    localSections.value = cloneSections(DEFAULT_SECTION_ORDER)
  }

  // Toggle background feature
  const toggleBackgroundFeature = (featureId: string): void => {
    const feature = localBackgroundFeatures.value.find((f) => f.id === featureId)
    if (feature) {
      feature.enabled = !feature.enabled
    }
  }

  // Get background feature state
  const isBackgroundFeatureEnabled = (featureId: string): boolean => {
    const feature = localBackgroundFeatures.value.find((f) => f.id === featureId)
    return feature?.enabled ?? true
  }

  // Fetch content counts for empty warnings (using admin APIs with weddingId)
  const fetchContentCounts = async (): Promise<void> => {
    const id = weddingId.value ?? undefined

    // Fetch all counts in parallel using admin APIs
    const [galleryResult, scheduleResult, giftsResult, musicResult] = await Promise.allSettled([
      listGalleryImages(id),
      getScheduleAdmin(id),
      listGiftsAdmin(id),
      getMusicAdmin(id),
    ])

    // Update counts (handle errors gracefully)
    contentCounts.value.gallery =
      galleryResult.status === 'fulfilled' ? (galleryResult.value.images?.length ?? 0) : 0
    contentCounts.value.schedule =
      scheduleResult.status === 'fulfilled' ? (scheduleResult.value.items?.length ?? 0) : 0
    contentCounts.value.wishlist =
      giftsResult.status === 'fulfilled' ? (giftsResult.value.gifts?.length ?? 0) : 0
    contentCounts.value.music =
      musicResult.status === 'fulfilled' ? (musicResult.value.tracks?.length ?? 0) : 0
  }

  // Get empty warning for a section
  const getEmptyWarning = (sectionId: string): string | null => {
    const t = adminT.value
    switch (sectionId) {
      case 'gallery':
        if (contentCounts.value.gallery === 0) {
          return t.design?.emptyGallery ?? 'No images'
        }
        break
      case 'schedule':
        if (contentCounts.value.schedule === 0) {
          return t.design?.emptySchedule ?? 'No schedule'
        }
        break
      case 'wishlist':
        if (contentCounts.value.wishlist === 0) {
          return t.design?.emptyWishlist ?? 'No gifts'
        }
        break
    }
    return null
  }

  // Get empty warning for music background feature
  const getMusicEmptyWarning = (): string | null => {
    if (contentCounts.value.music === 0) {
      return adminT.value.design?.emptyMusic ?? 'No music'
    }
    return null
  }

  // Cancel changes
  const cancelChanges = (): void => {
    syncFromSettings(designSettings.value)
    saveError.value = null
    saveSuccess.value = false
  }

  // Build save data
  const buildSaveData = () => {
    const data: {
      layoutId: LayoutId
      animationSpeed: AnimationSpeed
      sections: SectionConfig[]
      invitationCard?: InvitationCardSettings
      pageSlideshow?: PageSlideshowSettings
      storybook?: StorybookSettings
      backgroundFeatures?: BackgroundFeatureConfig[]
    } = {
      layoutId: selectedLayoutId.value,
      animationSpeed: selectedAnimationSpeed.value,
      sections: localSections.value,
      backgroundFeatures: localBackgroundFeatures.value,
    }

    if (selectedLayoutId.value === 'invitation-card') {
      data.invitationCard = invitationCardSettings.value
    }
    if (selectedLayoutId.value === 'page-slideshow') {
      data.pageSlideshow = pageSlideshowSettings.value
    }
    if (selectedLayoutId.value === 'storybook') {
      data.storybook = storybookSettings.value
    }

    return data
  }

  // Save design
  const handleSave = async (): Promise<void> => {
    saveError.value = null
    saveSuccess.value = false

    const id = weddingId.value ?? undefined
    const data = buildSaveData()

    await withLoading(
      async () => {
        const result = await saveDesign(data, id)

        if (!result.success) {
          saveError.value = result.error ?? 'Failed to save design'
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Discard changes wrapper
  const discardChanges = (): void => {
    cancelChanges()
  }

  // Save function for external callers
  const saveForEmit = async (): Promise<{ success: boolean; error?: string }> => {
    const id = weddingId.value ?? undefined
    const data = buildSaveData()

    try {
      const result = await saveDesign(data, id)
      return result
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Save failed' }
    }
  }

  // Emit dirty state changes to parent
  watch(
    hasChanges,
    (isDirty) => {
      emit('dirty-state-change', {
        isDirty,
        save: saveForEmit,
        discard: discardChanges,
      })
    },
    { immediate: true }
  )

  // Preview in new tab
  const openPreview = (): void => {
    const slug = weddingSlug.value
    if (slug) {
      const previewUrl = `/wedding/${slug}?layout-preview=true`
      window.open(previewUrl, '_blank')
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="font-heading text-xl font-medium text-charcoal dark:text-dark-text mb-1">
        {{ adminT.design?.title ?? 'Design & Layout' }}
      </h2>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.design?.subtitle ?? 'Choose how your wedding website looks and feels' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
    </div>

    <template v-else>
      <!-- Layout Selection -->
      <div>
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.design?.layoutSelection ?? 'Website Layout' }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="layout in LAYOUT_DEFINITIONS"
            :key="layout.id"
            type="button"
            class="relative p-4 border-2 rounded-lg text-left transition-all cursor-pointer hover:border-sage"
            :class="
              selectedLayoutId === layout.id
                ? 'border-sage bg-sage/5 dark:bg-sage/10'
                : 'border-sand-dark dark:border-dark-border'
            "
            @click="selectLayout(layout.id)"
          >
            <!-- Selected indicator -->
            <div
              v-if="selectedLayoutId === layout.id"
              class="absolute top-2 right-2 w-6 h-6 bg-sage rounded-full flex items-center justify-center"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h4 class="font-heading text-base font-medium text-charcoal dark:text-dark-text mb-1">
              {{ layout.name }}
            </h4>
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              {{ layout.description }}
            </p>

            <!-- Mobile support badge -->
            <span
              class="mt-2 inline-block px-2 py-0.5 text-xs rounded-full"
              :class="
                layout.mobileSupport === 'full'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              "
            >
              {{ layout.mobileSupport === 'full' ? 'Full mobile support' : 'Simplified on mobile' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Layout-Specific Settings -->
      <div
        v-if="selectedLayoutId === 'invitation-card'"
        class="border border-sand-dark dark:border-dark-border rounded-lg p-4"
      >
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.design?.invitationCardSettings ?? 'Invitation Card Settings' }}
        </h3>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="invitationCardSettings.showCoverText"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
            />
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ adminT.design?.showCoupleNames ?? 'Show couple names on cover' }}
            </span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="invitationCardSettings.showCoverDate"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
            />
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ adminT.design?.showWeddingDate ?? 'Show wedding date on cover' }}
            </span>
          </label>
          <div>
            <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
              {{ adminT.design?.autoOpenDelay ?? 'Auto-open delay (seconds, 0 = manual only)' }}
            </label>
            <input
              v-model.number="invitationCardSettings.autoOpenDelay"
              type="number"
              min="0"
              max="30"
              class="w-24 px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text"
            />
          </div>
        </div>
      </div>

      <div
        v-if="selectedLayoutId === 'page-slideshow'"
        class="border border-sand-dark dark:border-dark-border rounded-lg p-4"
      >
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.design?.slideshowSettings ?? 'Slideshow Settings' }}
        </h3>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="pageSlideshowSettings.showDots"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
            />
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ adminT.design?.showDots ?? 'Show navigation dots' }}
            </span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="pageSlideshowSettings.showArrows"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
            />
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ adminT.design?.showArrows ?? 'Show navigation arrows (desktop)' }}
            </span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="pageSlideshowSettings.autoPlay"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
            />
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ adminT.design?.autoPlay ?? 'Auto-play slides' }}
            </span>
          </label>
          <div v-if="pageSlideshowSettings.autoPlay">
            <label class="block font-body text-sm text-charcoal dark:text-dark-text mb-1">
              {{ adminT.design?.autoPlayInterval ?? 'Seconds between slides' }}
            </label>
            <input
              v-model.number="pageSlideshowSettings.autoPlayInterval"
              type="number"
              min="1"
              max="30"
              class="w-24 px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text"
            />
          </div>
        </div>
      </div>

      <div
        v-if="selectedLayoutId === 'storybook'"
        class="border border-sand-dark dark:border-dark-border rounded-lg p-4"
      >
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.design?.storybookSettings ?? 'Storybook Settings' }}
        </h3>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="storybookSettings.showPageNumbers"
              type="checkbox"
              class="w-4 h-4 text-sage rounded border-sand-dark focus:ring-sage"
            />
            <span class="font-body text-sm text-charcoal dark:text-dark-text">
              {{ adminT.design?.showPageNumbers ?? 'Show page numbers' }}
            </span>
          </label>
        </div>
      </div>

      <!-- Animation Speed -->
      <div>
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.design?.animationSpeed ?? 'Animation Speed' }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="speed in ['none', 'subtle', 'normal', 'dramatic'] as const"
            :key="speed"
            type="button"
            class="px-4 py-2 font-body text-sm rounded-lg transition-colors cursor-pointer"
            :class="
              selectedAnimationSpeed === speed
                ? 'bg-sage text-white'
                : 'bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated'
            "
            @click="selectedAnimationSpeed = speed"
          >
            {{ speed.charAt(0).toUpperCase() + speed.slice(1) }}
          </button>
        </div>
      </div>

      <!-- Section Order -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
            {{ adminT.design?.sectionOrder ?? 'Section Order & Visibility' }}
          </h3>
          <button
            type="button"
            class="font-body text-xs text-sage hover:text-sage-dark cursor-pointer"
            @click="resetSectionOrder"
          >
            {{ adminT.design?.resetOrder ?? 'Reset to default' }}
          </button>
        </div>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3">
          {{
            adminT.design?.sectionOrderHint ?? 'Drag to reorder. Click eye to toggle visibility.'
          }}
        </p>
        <div class="space-y-2">
          <div
            v-for="(section, index) in localSections"
            :key="section.id"
            class="flex items-center gap-3 p-3 border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary"
            :class="{
              'opacity-50': !section.visible,
              'cursor-move': index > 0,
              'cursor-not-allowed': index === 0,
            }"
            :draggable="index > 0"
            @dragstart="handleDragStart(index)"
            @dragover="handleDragOver($event, index)"
            @drop="handleDrop(index)"
            @dragend="handleDragEnd"
          >
            <!-- Drag handle -->
            <div
              class="text-charcoal-light dark:text-dark-text-secondary"
              :class="index === 0 ? 'opacity-30' : ''"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>

            <!-- Section name -->
            <span class="flex-1 font-body text-sm text-charcoal dark:text-dark-text">
              {{ getSectionName(section.id) }}
              <span
                v-if="section.id === 'hero'"
                class="ml-2 text-xs text-charcoal-light dark:text-dark-text-secondary"
              >
                ({{ adminT.design?.alwaysFirst ?? 'always first' }})
              </span>
              <!-- Empty content warning -->
              <span
                v-if="section.visible && getEmptyWarning(section.id)"
                class="inline-flex items-center gap-1 ml-2 text-xs text-amber-600 dark:text-amber-400"
              >
                <svg
                  class="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span class="truncate max-w-[120px] sm:max-w-none">
                  {{ getEmptyWarning(section.id) }}
                </span>
              </span>
            </span>

            <!-- Visibility toggle -->
            <button
              type="button"
              class="p-1 rounded hover:bg-sand dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
              :class="section.id === 'hero' ? 'opacity-30 cursor-not-allowed' : ''"
              :disabled="section.id === 'hero'"
              @click="toggleSectionVisibility(section.id)"
            >
              <svg
                v-if="section.visible"
                class="w-5 h-5 text-sage"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Background Features -->
      <div>
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
          {{ adminT.design?.backgroundFeatures ?? 'Background Features' }}
        </h3>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3">
          {{ adminT.design?.backgroundFeaturesHint ?? 'Enable or disable background features' }}
        </p>
        <div class="space-y-2">
          <!-- Music Toggle -->
          <div
            class="flex items-center justify-between gap-3 p-3 border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <!-- Speaker Icon -->
              <svg
                class="w-5 h-5 flex-shrink-0 text-charcoal-light dark:text-dark-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
              <div class="min-w-0">
                <span
                  class="flex items-center gap-2 font-body text-sm text-charcoal dark:text-dark-text"
                >
                  <span class="truncate">
                    {{ adminT.design?.backgroundMusic ?? 'Background Music' }}
                  </span>
                  <!-- Empty music warning -->
                  <span
                    v-if="isBackgroundFeatureEnabled('music') && getMusicEmptyWarning()"
                    class="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 flex-shrink-0"
                  >
                    <svg
                      class="w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span class="truncate max-w-[80px] sm:max-w-none">
                      {{ getMusicEmptyWarning() }}
                    </span>
                  </span>
                </span>
                <span
                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary truncate"
                >
                  {{
                    adminT.design?.backgroundMusicDescription ??
                    'Play music while guests browse your wedding site'
                  }}
                </span>
              </div>
            </div>
            <!-- Toggle Button -->
            <button
              type="button"
              class="relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
              :class="
                isBackgroundFeatureEnabled('music')
                  ? 'bg-sage'
                  : 'bg-sand-dark dark:bg-dark-bg-elevated'
              "
              @click="toggleBackgroundFeature('music')"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="isBackgroundFeatureEnabled('music') ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="saveError || error"
        class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <p class="font-body text-sm text-red-700 dark:text-red-300">
          {{ saveError ?? error }}
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="saveSuccess"
        class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
      >
        <p class="font-body text-sm text-green-700 dark:text-green-300">
          {{ adminT.design?.savedSuccess ?? 'Design settings saved successfully!' }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex flex-wrap justify-between gap-3 pt-4 border-t border-sand-dark dark:border-dark-border"
      >
        <button
          type="button"
          class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
          @click="openPreview"
        >
          {{ adminT.design?.preview ?? 'Preview' }}
        </button>
        <div class="flex gap-3">
          <button
            v-if="hasChanges"
            type="button"
            class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
            @click="cancelChanges"
          >
            {{ adminT.common.cancel }}
          </button>
          <button
            type="button"
            class="px-4 py-2 font-body text-sm font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="!hasChanges || isSaving"
            @click="handleSave"
          >
            <span v-if="isSaving" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {{ adminT.common.saving }}
            </span>
            <span v-else>{{ adminT.design?.saveDesign ?? 'Save Design' }}</span>
          </button>
        </div>
      </div>

      <!-- Last Updated Info -->
      <div v-if="designSettings.updatedAt" class="text-right">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.messages.lastUpdated }}:
          {{ new Date(designSettings.updatedAt).toLocaleString() }}
          <span v-if="designSettings.updatedBy">
            {{ adminT.messages.by }} {{ designSettings.updatedBy }}
          </span>
        </p>
      </div>
    </template>
  </div>
</template>
