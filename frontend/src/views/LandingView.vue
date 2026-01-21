<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useLanguage } from '@/composables/useLanguage'
  import { useDocumentTitle } from '@/composables/useDocumentTitle'
  import LanguageToggle from '@/components/ui/LanguageToggle.vue'
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'

  useDocumentTitle({ text: 'WeddingApp', position: 'prefix', static: true })

  const { t } = useLanguage()

  // Demo wedding slug
  const demoWeddingSlug = 'demo'

  // Header scroll state
  const isScrolled = ref(false)

  const handleScroll = (): void => {
    isScrolled.value = window.scrollY > 50
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    startAutoScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    stopAutoScroll()
  })

  // Features data with icons (expanded to 12 features)
  const features = [
    { key: 'Rsvp', icon: 'clipboard' },
    { key: 'Gallery', icon: 'image' },
    { key: 'Gifts', icon: 'gift' },
    { key: 'Music', icon: 'music' },
    { key: 'QrHub', icon: 'qrcode' },
    { key: 'Themes', icon: 'palette' },
    { key: 'Languages', icon: 'globe' },
    { key: 'Mobile', icon: 'mobile' },
    { key: 'Countdown', icon: 'clock' },
    { key: 'Parking', icon: 'car' },
    { key: 'AdminCms', icon: 'settings' },
    { key: 'DarkMode', icon: 'moon' },
  ] as const

  // Marquee scroll state
  const scrollContainerRef = ref<HTMLElement | null>(null)
  const isPaused = ref(false)
  const isDragging = ref(false)
  const autoScrollSpeed = 1 // pixels per frame
  let animationFrameId: number | null = null
  let dragStartX = 0
  let scrollStartX = 0

  // Wrap scroll position for seamless loop (works for both directions)
  const wrapScrollPosition = (): void => {
    if (!scrollContainerRef.value) return
    const el = scrollContainerRef.value
    const halfWidth = el.scrollWidth / 2

    // Wrap forward (scrolled past halfway)
    if (el.scrollLeft >= halfWidth) {
      el.scrollLeft = el.scrollLeft - halfWidth
    }
    // Wrap backward (scrolled before start)
    else if (el.scrollLeft <= 0) {
      el.scrollLeft = el.scrollLeft + halfWidth
    }
  }

  const autoScroll = (): void => {
    if (!scrollContainerRef.value || isPaused.value || isDragging.value) {
      animationFrameId = requestAnimationFrame(autoScroll)
      return
    }

    scrollContainerRef.value.scrollLeft += autoScrollSpeed
    wrapScrollPosition()
    animationFrameId = requestAnimationFrame(autoScroll)
  }

  const startAutoScroll = (): void => {
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(autoScroll)
    }
  }

  const stopAutoScroll = (): void => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  // Mouse/touch drag handlers
  const handleDragStart = (e: MouseEvent | TouchEvent): void => {
    isDragging.value = true
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
    dragStartX = clientX
    scrollStartX = scrollContainerRef.value?.scrollLeft ?? 0
  }

  const handleDragMove = (e: MouseEvent | TouchEvent): void => {
    if (!isDragging.value || !scrollContainerRef.value) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
    const diff = dragStartX - clientX
    scrollContainerRef.value.scrollLeft = scrollStartX + diff
    wrapScrollPosition()
  }

  const handleDragEnd = (): void => {
    isDragging.value = false
    wrapScrollPosition()
  }

  // Wheel scroll handler (horizontal scroll with mouse wheel)
  const handleWheel = (e: WheelEvent): void => {
    if (!scrollContainerRef.value) return
    // Allow horizontal scroll with shift+wheel or trackpad horizontal
    if (e.deltaX !== 0) {
      // Trackpad horizontal scroll
      wrapScrollPosition()
      return
    }
    // Convert vertical scroll to horizontal when hovering
    e.preventDefault()
    scrollContainerRef.value.scrollLeft += e.deltaY
    wrapScrollPosition()
  }

  const pauseMarquee = (): void => {
    isPaused.value = true
  }

  const resumeMarquee = (): void => {
    if (!isDragging.value) {
      isPaused.value = false
    }
  }
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg overflow-x-hidden">
    <!-- Fixed Header -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="
        isScrolled ? 'bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      "
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <span
          class="font-heading text-lg sm:text-xl font-medium transition-colors"
          :class="isScrolled ? 'text-sage-dark dark:text-sage-light' : 'text-white'"
        >
          {{ t.landing?.brandName ?? 'WeddingApp' }}
        </span>
        <nav class="flex items-center gap-2 sm:gap-3">
          <LanguageToggle :variant="isScrolled ? 'light' : 'dark'" />
          <DarkModeToggle :variant="isScrolled ? 'light' : 'dark'" />
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section
      class="min-h-screen bg-gradient-to-br from-sage-dark via-sage to-sage-light relative flex items-center justify-center pt-16"
    >
      <!-- Decorative overlay -->
      <div class="absolute inset-0 bg-black/10"></div>

      <!-- Floating hearts animation -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-[10%] animate-float-slow opacity-20">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
        <div class="absolute top-1/3 right-[15%] animate-float-medium opacity-15">
          <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
        <div class="absolute bottom-1/3 left-[20%] animate-float-fast opacity-10">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
        <div class="absolute top-1/2 right-[8%] animate-float-slow opacity-20">
          <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
      </div>

      <!-- Decorative rings -->
      <div class="absolute inset-0 opacity-5 pointer-events-none">
        <div class="absolute top-20 left-10 w-32 h-32 border-2 border-white/50 rounded-full"></div>
        <div
          class="absolute bottom-32 right-16 w-48 h-48 border-2 border-white/30 rounded-full"
        ></div>
        <div
          class="absolute top-1/3 right-1/4 w-24 h-24 border-2 border-white/40 rounded-full"
        ></div>
      </div>

      <div class="relative text-white text-center px-4 sm:px-6 py-16 sm:py-20 max-w-4xl mx-auto">
        <!-- Cute couple illustration -->
        <div class="mb-6 sm:mb-8">
          <svg
            class="w-24 h-24 sm:w-32 sm:h-32 mx-auto"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Bride (left) -->
            <circle cx="35" cy="35" r="12" fill="white" opacity="0.9" />
            <ellipse cx="35" cy="60" rx="10" ry="15" fill="white" opacity="0.9" />
            <!-- Bride veil -->
            <path d="M23 30 Q35 20 47 30 Q47 45 35 50 Q23 45 23 30" fill="white" opacity="0.3" />
            <!-- Bride face -->
            <circle cx="32" cy="33" r="1.5" fill="#7c8363" />
            <circle cx="38" cy="33" r="1.5" fill="#7c8363" />
            <path d="M33 38 Q35 40 37 38" stroke="#7c8363" stroke-width="1.5" fill="none" />
            <!-- Groom (right) -->
            <circle cx="65" cy="35" r="12" fill="white" opacity="0.9" />
            <ellipse cx="65" cy="60" rx="10" ry="15" fill="white" opacity="0.9" />
            <!-- Groom hat -->
            <rect x="55" y="22" width="20" height="4" rx="1" fill="white" opacity="0.7" />
            <rect x="59" y="14" width="12" height="8" rx="1" fill="white" opacity="0.7" />
            <!-- Groom face -->
            <circle cx="62" cy="33" r="1.5" fill="#7c8363" />
            <circle cx="68" cy="33" r="1.5" fill="#7c8363" />
            <path d="M63 38 Q65 40 67 38" stroke="#7c8363" stroke-width="1.5" fill="none" />
            <!-- Heart between them -->
            <path
              d="M50 45 C50 42 47 40 45 42 C43 44 43 47 50 52 C57 47 57 44 55 42 C53 40 50 42 50 45"
              fill="#ff6b6b"
              opacity="0.8"
            />
            <!-- Holding hands -->
            <ellipse cx="50" cy="58" rx="6" ry="4" fill="white" opacity="0.7" />
          </svg>
        </div>

        <!-- Tagline -->
        <p class="font-body text-xs sm:text-sm uppercase tracking-[0.2em] mb-4 opacity-80">
          {{ t.landing?.heroTagline ?? 'Because love deserves the best' }}
        </p>

        <h1
          class="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 leading-tight"
        >
          {{ t.landing?.heroTitle ?? 'Built with Love, Coded with Heart' }}
        </h1>

        <p
          class="font-body text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 opacity-90 leading-relaxed"
        >
          {{ t.landing?.heroSubtitle }}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <RouterLink
            :to="`/${demoWeddingSlug}`"
            class="group px-6 sm:px-8 py-3 sm:py-4 bg-white text-sage-dark font-body font-medium rounded-full hover:bg-sand transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span class="flex items-center justify-center gap-2">
              {{ t.landing?.viewDemo ?? 'View Demo' }}
              <svg
                class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          </RouterLink>
          <RouterLink
            to="/login"
            class="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white font-body font-medium rounded-full hover:bg-white/10 transition-all"
          >
            {{ t.landing?.adminLogin ?? 'Admin Login' }}
          </RouterLink>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p class="text-white/60 text-xs mb-2 font-body">
          {{ t.landing?.scrollToExplore ?? 'Scroll to explore' }}
        </p>
        <div class="animate-bounce">
          <svg
            class="w-6 h-6 text-white/60 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>

    <!-- Story Section -->
    <section class="py-16 sm:py-24 bg-white dark:bg-dark-bg-secondary relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute top-10 right-10 opacity-5 dark:opacity-10">
        <svg class="w-32 h-32 text-sage" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>
      <div class="absolute bottom-10 left-10 opacity-5 dark:opacity-10">
        <svg class="w-24 h-24 text-sage" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10 sm:mb-12">
          <span
            class="inline-block px-4 py-1 bg-sage/10 dark:bg-sage/20 text-sage rounded-full font-body text-sm mb-4"
          >
            {{ t.landing?.storySubtitle ?? 'Why I built this' }}
          </span>
          <h2
            class="font-heading text-2xl sm:text-3xl md:text-4xl text-charcoal dark:text-dark-text"
          >
            {{ t.landing?.storyTitle ?? 'The Story Behind the Code' }}
          </h2>
        </div>

        <div class="space-y-6 text-center">
          <p
            class="font-body text-charcoal-light dark:text-dark-text-secondary text-base sm:text-lg leading-relaxed"
          >
            {{ t.landing?.storyParagraph1 }}
          </p>
          <p
            class="font-body text-charcoal-light dark:text-dark-text-secondary text-base sm:text-lg leading-relaxed"
          >
            {{ t.landing?.storyParagraph2 }}
          </p>
          <p
            class="font-body text-charcoal-light dark:text-dark-text-secondary text-base sm:text-lg leading-relaxed italic"
          >
            {{ t.landing?.storyParagraph3 }}
          </p>

          <!-- Signature -->
          <div class="pt-6">
            <p class="font-heading text-lg sm:text-xl text-sage dark:text-sage-light">
              {{ t.landing?.storySignature ?? '— Built with ❤️ by Harith Zainudin' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-12 sm:py-16 bg-sage dark:bg-sage-dark">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="grid grid-cols-3 gap-4 sm:gap-8 text-center text-white">
          <div>
            <p class="font-heading text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">12+</p>
            <p class="font-body text-xs sm:text-sm opacity-80">
              {{ t.landing?.statsFeatures ?? 'Features' }}
            </p>
          </div>
          <div>
            <p class="font-heading text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">4</p>
            <p class="font-body text-xs sm:text-sm opacity-80">
              {{ t.landing?.statsLanguages ?? 'Languages' }}
            </p>
          </div>
          <div>
            <p class="font-heading text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">100%</p>
            <p class="font-body text-xs sm:text-sm opacity-80">
              {{ t.landing?.statsLove ?? 'Love' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 sm:py-24 bg-sand dark:bg-dark-bg overflow-hidden">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10 sm:mb-16">
          <h2
            class="font-heading text-2xl sm:text-3xl md:text-4xl text-charcoal dark:text-dark-text mb-3 sm:mb-4"
          >
            {{ t.landing?.featuresTitle ?? 'Everything You Need' }}
          </h2>
          <p
            class="font-body text-charcoal-light dark:text-dark-text-secondary max-w-2xl mx-auto text-sm sm:text-base"
          >
            {{ t.landing?.featuresSubtitle }}
          </p>
        </div>
      </div>

      <!-- Marquee Container -->
      <div class="relative" @mouseenter="pauseMarquee" @mouseleave="resumeMarquee">
        <!-- Gradient fade edges -->
        <div
          class="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-sand dark:from-dark-bg to-transparent z-10 pointer-events-none"
        ></div>
        <div
          class="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-sand dark:from-dark-bg to-transparent z-10 pointer-events-none"
        ></div>

        <!-- Scrolling track -->
        <div
          ref="scrollContainerRef"
          class="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          :class="{ 'cursor-grabbing': isDragging }"
          @mousedown="handleDragStart"
          @mousemove="handleDragMove"
          @mouseup="handleDragEnd"
          @mouseleave="handleDragEnd"
          @touchstart="handleDragStart"
          @touchmove="handleDragMove"
          @touchend="handleDragEnd"
          @wheel="handleWheel"
        >
          <!-- First set of features -->
          <template v-for="(feature, index) in features" :key="`a-${index}`">
            <div
              class="flex-shrink-0 w-64 sm:w-72 bg-white dark:bg-dark-bg-secondary rounded-2xl p-5 sm:p-6 shadow-sm border border-sage/10"
            >
              <div
                class="w-12 h-12 bg-gradient-to-br from-sage/20 to-sage/10 dark:from-sage/30 dark:to-sage/20 rounded-xl flex items-center justify-center mb-4"
              >
                <!-- RSVP Icon -->
                <svg
                  v-if="feature.icon === 'clipboard'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <!-- Gallery Icon -->
                <svg
                  v-else-if="feature.icon === 'image'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <!-- Gift Icon -->
                <svg
                  v-else-if="feature.icon === 'gift'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
                <!-- Music Icon -->
                <svg
                  v-else-if="feature.icon === 'music'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <!-- QR Code Icon -->
                <svg
                  v-else-if="feature.icon === 'qrcode'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <!-- Palette Icon -->
                <svg
                  v-else-if="feature.icon === 'palette'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <!-- Globe Icon -->
                <svg
                  v-else-if="feature.icon === 'globe'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <!-- Mobile Icon -->
                <svg
                  v-else-if="feature.icon === 'mobile'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <!-- Clock Icon -->
                <svg
                  v-else-if="feature.icon === 'clock'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <!-- Car Icon -->
                <svg
                  v-else-if="feature.icon === 'car'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
                <!-- Settings Icon -->
                <svg
                  v-else-if="feature.icon === 'settings'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <!-- Moon Icon -->
                <svg
                  v-else-if="feature.icon === 'moon'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </div>

              <h3 class="font-heading text-base text-charcoal dark:text-dark-text mb-1">
                {{ t.landing?.[`feature${feature.key}` as keyof typeof t.landing] ?? feature.key }}
              </h3>
              <p
                class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary leading-relaxed"
              >
                {{ t.landing?.[`feature${feature.key}Desc` as keyof typeof t.landing] ?? '' }}
              </p>
            </div>
          </template>

          <!-- Duplicate set for seamless loop -->
          <template v-for="(feature, index) in features" :key="`b-${index}`">
            <div
              class="flex-shrink-0 w-64 sm:w-72 bg-white dark:bg-dark-bg-secondary rounded-2xl p-5 sm:p-6 shadow-sm border border-sage/10"
            >
              <div
                class="w-12 h-12 bg-gradient-to-br from-sage/20 to-sage/10 dark:from-sage/30 dark:to-sage/20 rounded-xl flex items-center justify-center mb-4"
              >
                <!-- RSVP Icon -->
                <svg
                  v-if="feature.icon === 'clipboard'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <!-- Gallery Icon -->
                <svg
                  v-else-if="feature.icon === 'image'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <!-- Gift Icon -->
                <svg
                  v-else-if="feature.icon === 'gift'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
                <!-- Music Icon -->
                <svg
                  v-else-if="feature.icon === 'music'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <!-- QR Code Icon -->
                <svg
                  v-else-if="feature.icon === 'qrcode'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <!-- Palette Icon -->
                <svg
                  v-else-if="feature.icon === 'palette'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <!-- Globe Icon -->
                <svg
                  v-else-if="feature.icon === 'globe'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <!-- Mobile Icon -->
                <svg
                  v-else-if="feature.icon === 'mobile'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <!-- Clock Icon -->
                <svg
                  v-else-if="feature.icon === 'clock'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <!-- Car Icon -->
                <svg
                  v-else-if="feature.icon === 'car'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
                <!-- Settings Icon -->
                <svg
                  v-else-if="feature.icon === 'settings'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <!-- Moon Icon -->
                <svg
                  v-else-if="feature.icon === 'moon'"
                  class="w-6 h-6 text-sage"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </div>

              <h3 class="font-heading text-base text-charcoal dark:text-dark-text mb-1">
                {{ t.landing?.[`feature${feature.key}` as keyof typeof t.landing] ?? feature.key }}
              </h3>
              <p
                class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary leading-relaxed"
              >
                {{ t.landing?.[`feature${feature.key}Desc` as keyof typeof t.landing] ?? '' }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Creator Section -->
    <section class="py-16 sm:py-24 bg-white dark:bg-dark-bg-secondary">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10 sm:mb-12">
          <h2
            class="font-heading text-2xl sm:text-3xl md:text-4xl text-charcoal dark:text-dark-text mb-2"
          >
            {{ t.landing?.creatorTitle ?? 'Meet the Creator' }}
          </h2>
          <p
            class="font-body text-charcoal-light dark:text-dark-text-secondary text-sm sm:text-base"
          >
            {{ t.landing?.creatorSubtitle ?? 'The person behind the code' }}
          </p>
        </div>

        <div
          class="bg-gradient-to-br from-sage/5 to-sage/10 dark:from-sage/10 dark:to-sage/20 rounded-3xl p-6 sm:p-10"
        >
          <div class="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <!-- Avatar with decorative elements -->
            <div class="relative">
              <div
                class="w-28 h-28 sm:w-36 sm:h-36 bg-gradient-to-br from-sage to-sage-dark rounded-full flex items-center justify-center shadow-lg"
              >
                <!-- Stickman developer illustration -->
                <svg
                  class="w-16 h-16 sm:w-20 sm:h-20 text-white"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <!-- Head -->
                  <circle cx="50" cy="25" r="15" stroke="currentColor" stroke-width="4" />
                  <!-- Body -->
                  <line x1="50" y1="40" x2="50" y2="65" stroke="currentColor" stroke-width="4" />
                  <!-- Arms holding laptop -->
                  <line x1="50" y1="50" x2="30" y2="55" stroke="currentColor" stroke-width="4" />
                  <line x1="50" y1="50" x2="70" y2="55" stroke="currentColor" stroke-width="4" />
                  <!-- Laptop -->
                  <rect
                    x="30"
                    y="52"
                    width="40"
                    height="25"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                  <line x1="35" y1="77" x2="65" y2="77" stroke="currentColor" stroke-width="3" />
                  <!-- Heart on screen -->
                  <path
                    d="M50 60 C50 58 48 57 47 58 C46 59 46 61 50 64 C54 61 54 59 53 58 C52 57 50 58 50 60"
                    fill="currentColor"
                  />
                  <!-- Legs -->
                  <line x1="50" y1="65" x2="35" y2="90" stroke="currentColor" stroke-width="4" />
                  <line x1="50" y1="65" x2="65" y2="90" stroke="currentColor" stroke-width="4" />
                  <!-- Smile -->
                  <path
                    d="M44 28 Q50 33 56 28"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                  />
                  <!-- Eyes -->
                  <circle cx="44" cy="22" r="2" fill="currentColor" />
                  <circle cx="56" cy="22" r="2" fill="currentColor" />
                </svg>
              </div>
              <!-- Decorative hearts -->
              <div class="absolute -top-2 -right-2 animate-pulse">
                <svg class="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 text-center md:text-left">
              <h3 class="font-heading text-xl sm:text-2xl text-charcoal dark:text-dark-text mb-1">
                {{ t.landing?.creatorName ?? 'Harith Zainudin' }}
              </h3>
              <p
                class="font-body text-sage dark:text-sage-light font-medium mb-2 text-sm sm:text-base"
              >
                {{ t.landing?.creatorRole ?? 'Cloud Developer & Creator' }}
              </p>
              <p
                class="font-body text-charcoal-light dark:text-dark-text-secondary text-xs sm:text-sm mb-4"
              >
                {{
                  t.landing?.creatorUniversity ??
                  'Computer Science & Information Technology Alumni, Universiti Putra Malaysia'
                }}
              </p>
              <blockquote
                class="font-body text-charcoal dark:text-dark-text italic text-sm sm:text-base leading-relaxed border-l-4 border-sage pl-4"
              >
                {{ t.landing?.creatorQuote }}
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Demo CTA Section -->
    <section
      class="py-16 sm:py-24 bg-gradient-to-br from-sage-dark via-sage to-sage-light relative overflow-hidden"
    >
      <!-- Decorative elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-10 left-10 w-32 h-32 border border-white/10 rounded-full"></div>
        <div
          class="absolute bottom-10 right-10 w-48 h-48 border border-white/10 rounded-full"
        ></div>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl text-white mb-3 sm:mb-4">
          {{ t.landing?.demoTitle ?? 'See It In Action' }}
        </h2>
        <p class="font-body text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto text-sm sm:text-base">
          {{ t.landing?.demoSubtitle }}
        </p>
        <RouterLink
          :to="`/${demoWeddingSlug}`"
          class="group inline-flex items-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-white text-sage-dark font-body font-semibold rounded-full hover:bg-sand transition-all shadow-xl hover:shadow-2xl hover:scale-105"
        >
          {{ t.landing?.tryDemo ?? 'Try Live Demo' }}
          <svg
            class="w-5 h-5 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </RouterLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 sm:py-12 bg-charcoal dark:bg-dark-bg-elevated">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex flex-col items-center gap-4 sm:gap-6">
          <!-- Logo and tagline -->
          <div class="text-center">
            <p class="font-heading text-xl sm:text-2xl text-white mb-2">
              {{ t.landing?.brandName ?? 'WeddingApp' }}
            </p>
            <p class="font-body text-white/50 text-xs sm:text-sm">
              {{ t.landing?.builtBy ?? 'Built by' }}
              <span class="text-sage-light">Harith Zainudin</span>
              {{ t.landing?.forLove ?? 'for love' }}
            </p>
          </div>

          <!-- Made with love -->
          <div class="flex items-center gap-2">
            <span class="font-body text-white/60 text-xs sm:text-sm">
              {{ t.landing?.madeWith ?? 'Made with' }}
            </span>
            <svg class="w-5 h-5 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </div>

          <!-- Divider -->
          <div class="w-full max-w-xs border-t border-white/10"></div>

          <!-- Copyright -->
          <p class="font-body text-white/40 text-xs">
            &copy; {{ new Date().getFullYear() }} {{ t.landing?.brandName ?? 'WeddingApp' }}.
            {{ t.landing?.copyright ?? 'All rights reserved' }}.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
  /* Floating hearts animation */
  @keyframes float-slow {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(5deg);
    }
  }

  @keyframes float-medium {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-15px) rotate(-5deg);
    }
  }

  @keyframes float-fast {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-10px) rotate(3deg);
    }
  }

  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }

  .animate-float-medium {
    animation: float-medium 5s ease-in-out infinite;
  }

  .animate-float-fast {
    animation: float-fast 4s ease-in-out infinite;
  }

  /* Hide scrollbar for marquee */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
</style>
