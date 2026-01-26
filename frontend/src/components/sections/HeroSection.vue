<script setup lang="ts">
  import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
  import CountdownTimer from '@/components/ui/CountdownTimer.vue'
  import MusicToggle from '@/components/ui/MusicToggle.vue'
  import LanguageToggle from '@/components/ui/LanguageToggle.vue'
  import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { useNameOrder } from '@/composables/useNameOrder'
  import { getCalligraphySvg } from '@/assets/calligraphy/bismillah'
  import { DEFAULT_BISMILLAH_SETTINGS } from '@/types/weddingDetails'
  import { getMediaForDevice } from '@/types/heroBackground'

  const { t } = useLanguage()
  const { getEventDate, isLoadingWeddingDetails, getBismillahSettings, getHeroBackground } =
    usePublicWeddingData()
  const { orderedCouple } = useNameOrder()

  const coupleNames = computed(() => ({
    first: orderedCouple.value.first.nickname,
    second: orderedCouple.value.second.nickname,
  }))

  const weddingDate = computed(() => getEventDate())

  // Bismillah calligraphy state
  const bismillahSvg = ref<string>('')
  const isLoadingCalligraphy = ref(true)
  const bismillahSettings = computed(() => getBismillahSettings())

  // Load calligraphy SVG
  const loadCalligraphy = async () => {
    isLoadingCalligraphy.value = true
    try {
      const styleId =
        bismillahSettings.value?.selectedStyle ?? DEFAULT_BISMILLAH_SETTINGS.selectedStyle
      bismillahSvg.value = await getCalligraphySvg(styleId)
    } catch (error) {
      console.error('Failed to load calligraphy:', error)
      // Fallback to empty - will show text fallback in template
      bismillahSvg.value = ''
    } finally {
      isLoadingCalligraphy.value = false
    }
  }

  // Watch for settings changes and reload
  watch(
    () => bismillahSettings.value?.selectedStyle,
    () => {
      loadCalligraphy()
    }
  )

  onMounted(() => {
    loadCalligraphy()
    setupVideoObserver()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    videoObserver.value?.disconnect()
    window.removeEventListener('resize', handleResize)
  })

  // Hero background state
  const heroBackground = computed(() => getHeroBackground())
  const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const mediaFailed = ref(false)
  const videoRef = ref<HTMLVideoElement | null>(null)
  const videoObserver = ref<IntersectionObserver | null>(null)

  // Get current media based on device and upload mode
  const currentMedia = computed(() => {
    const bg = heroBackground.value
    if (!bg || bg.mediaType === 'none') return null
    return getMediaForDevice(bg, isMobile.value)
  })

  // Overlay style
  const overlayStyle = computed(() => {
    const bg = heroBackground.value
    if (!bg?.overlay?.enabled) return {}
    const { color, opacity } = bg.overlay
    let rgb: string
    switch (color) {
      case 'white':
        rgb = '255,255,255'
        break
      case 'theme':
        rgb = '107,142,111' // sage color RGB
        break
      default:
        rgb = '0,0,0'
    }
    return { backgroundColor: `rgba(${rgb}, ${opacity / 100})` }
  })

  // Determine if we should use responsive images (separate mode with both)
  const useResponsivePicture = computed(() => {
    const bg = heroBackground.value
    if (!bg) return false
    return bg.uploadMode === 'separate' && (bg.desktop || bg.mobile)
  })

  // Resize handler
  const handleResize = () => {
    isMobile.value = window.innerWidth < 768
  }

  // Media error handler
  const handleMediaError = () => {
    mediaFailed.value = true
  }

  // Video visibility optimization
  const setupVideoObserver = () => {
    if (!videoRef.value) return
    videoObserver.value = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          videoRef.value?.play().catch(() => {
            // Autoplay may be blocked
          })
        } else {
          videoRef.value?.pause()
        }
      },
      { threshold: 0.1 }
    )
    videoObserver.value.observe(videoRef.value)
  }

  // Watch for video element changes
  watch(videoRef, (newRef) => {
    if (newRef && heroBackground.value?.mediaType === 'video') {
      videoObserver.value?.disconnect()
      setupVideoObserver()
    }
  })
</script>

<template>
  <section class="relative min-h-svh flex items-center justify-center text-center overflow-hidden">
    <!-- Background Container -->
    <div class="absolute inset-0">
      <!-- Fallback: Solid Color -->
      <div
        v-if="!heroBackground || heroBackground.mediaType === 'none' || mediaFailed"
        class="absolute inset-0 bg-sage-dark"
      />

      <!-- Image Background -->
      <template v-else-if="heroBackground.mediaType === 'image' && currentMedia">
        <!-- Single upload mode OR responsive picture -->
        <picture v-if="useResponsivePicture" class="absolute inset-0 w-full h-full">
          <source
            v-if="heroBackground.mobile"
            media="(max-width: 767px)"
            :srcset="heroBackground.mobile.url"
          />
          <img
            :src="heroBackground.desktop?.url ?? heroBackground.mobile?.url ?? ''"
            class="w-full h-full object-cover"
            alt=""
            @error="handleMediaError"
          />
        </picture>
        <img
          v-else
          :src="currentMedia.url"
          class="absolute inset-0 w-full h-full object-cover"
          alt=""
          @error="handleMediaError"
        />
      </template>

      <!-- Video Background -->
      <video
        v-else-if="heroBackground?.mediaType === 'video' && currentMedia"
        ref="videoRef"
        class="absolute inset-0 w-full h-full object-cover"
        autoplay
        muted
        loop
        playsinline
        :poster="heroBackground.posterUrl"
        @error="handleMediaError"
      >
        <source :src="currentMedia.url" :type="currentMedia.mimeType" />
      </video>

      <!-- Dynamic Overlay -->
      <div
        v-if="
          heroBackground?.overlay?.enabled && heroBackground.mediaType !== 'none' && !mediaFailed
        "
        class="absolute inset-0"
        :style="overlayStyle"
      />
      <!-- Default overlay for solid color fallback -->
      <div
        v-else-if="!heroBackground || heroBackground.mediaType === 'none' || mediaFailed"
        class="absolute inset-0 bg-black/30"
      />
    </div>

    <!-- Top Controls -->
    <div class="absolute top-4 right-4 z-10 flex gap-2">
      <LanguageToggle />
      <DarkModeToggle />
      <MusicToggle />
    </div>

    <!-- Content -->
    <div class="relative text-white w-full px-6 py-12">
      <!-- Bismillah Calligraphy -->
      <div class="mb-6 sm:mb-8">
        <!-- Loading Skeleton -->
        <div v-if="isLoadingCalligraphy" class="animate-pulse">
          <div
            class="h-8 sm:h-10 md:h-12 bg-white/20 rounded max-w-xs sm:max-w-sm mx-auto mb-2"
          ></div>
          <div
            v-if="bismillahSettings?.showTranslation !== false"
            class="h-3 bg-white/10 rounded max-w-[200px] mx-auto"
          ></div>
        </div>
        <!-- SVG Calligraphy -->
        <template v-else-if="bismillahSvg">
          <div
            class="max-w-xs sm:max-w-sm md:max-w-md mx-auto text-white [&_svg]:w-full [&_svg]:h-auto"
            dir="rtl"
            v-html="bismillahSvg"
          />
          <div
            class="grid transition-all duration-300 ease-out"
            :class="
              bismillahSettings?.showTranslation !== false
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            "
          >
            <div class="overflow-hidden min-h-0">
              <p
                class="font-body text-[10px] sm:text-xs md:text-sm opacity-80 leading-relaxed mt-2"
              >
                {{ t.hero.bismillahTranslation }}
              </p>
            </div>
          </div>
        </template>
        <!-- Fallback Text -->
        <template v-else>
          <p class="font-heading text-xl sm:text-2xl md:text-3xl mb-2 leading-relaxed" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <div
            class="grid transition-all duration-300 ease-out"
            :class="
              bismillahSettings?.showTranslation !== false
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            "
          >
            <div class="overflow-hidden min-h-0">
              <p class="font-body text-[10px] sm:text-xs md:text-sm opacity-80 leading-relaxed">
                {{ t.hero.bismillahTranslation }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Wedding Announcement -->
      <p
        class="font-body text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3 opacity-90"
      >
        {{ t.hero.weddingOf }}
      </p>

      <!-- Couple Names - Stacked -->
      <div class="mb-6 sm:mb-8">
        <!-- Loading Skeleton -->
        <template v-if="isLoadingWeddingDetails">
          <div class="animate-pulse flex flex-col items-center">
            <div
              class="h-9 sm:h-10 md:h-12 lg:h-14 w-40 sm:w-48 md:w-56 bg-white/20 rounded mb-1 sm:mb-2"
            ></div>
            <p class="font-heading text-xl sm:text-2xl md:text-3xl my-1 sm:my-2 opacity-80">&</p>
            <div class="h-9 sm:h-10 md:h-12 lg:h-14 w-40 sm:w-48 md:w-56 bg-white/20 rounded"></div>
          </div>
        </template>
        <!-- Actual Names -->
        <template v-else>
          <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
            {{ coupleNames.first }}
          </h1>
          <p class="font-heading text-xl sm:text-2xl md:text-3xl my-1 sm:my-2 opacity-80">&</p>
          <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
            {{ coupleNames.second }}
          </h1>
        </template>
      </div>

      <!-- Countdown Timer -->
      <CountdownTimer :target-date="weddingDate" />
    </div>
  </section>
</template>
