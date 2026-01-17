<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import type { MusicTrack, MusicSettings, PlayMode } from '@/types/music'
  import { getMusic } from '@/services/api'

  const CROSSFADE_DURATION = 2000 // 2 seconds
  const STORAGE_KEY = 'wedding-music-state'

  // State
  const isPlaying = ref(false)
  const isLoading = ref(true)
  const tracks = ref<MusicTrack[]>([])
  const settings = ref<MusicSettings | null>(null)
  const currentTrackIndex = ref(0)
  const shuffledOrder = ref<number[]>([])
  const showControls = ref(false)
  const showTooltip = ref(false)
  const progress = ref(0)
  const localVolume = ref(0.3)

  // Audio elements for crossfade
  const audioElement = ref<HTMLAudioElement | null>(null)
  const nextAudioElement = ref<HTMLAudioElement | null>(null)

  // Computed
  const isEnabled = computed(() => settings.value?.enabled ?? false)
  const shouldAutoplay = computed(() => settings.value?.autoplay ?? false)
  const playMode = computed((): PlayMode => settings.value?.mode ?? 'single')
  const shouldShuffle = computed(() => settings.value?.shuffle ?? false)
  const shouldLoop = computed(() => settings.value?.loop ?? true)

  const sortedTracks = computed(() => [...tracks.value].sort((a, b) => a.order - b.order))

  const currentTrack = computed((): MusicTrack | null => {
    if (!settings.value || sortedTracks.value.length === 0) return null

    if (playMode.value === 'single' && settings.value.selectedTrackId) {
      return sortedTracks.value.find((t) => t.id === settings.value!.selectedTrackId) ?? null
    }

    let index = currentTrackIndex.value
    if (shouldShuffle.value && shuffledOrder.value.length > 0) {
      const shuffledIndex = shuffledOrder.value[currentTrackIndex.value]
      if (shuffledIndex !== undefined) {
        index = shuffledIndex
      }
    }

    return sortedTracks.value[index] ?? null
  })

  const hasNextTrack = computed(() => {
    if (playMode.value === 'single') return false
    return currentTrackIndex.value < sortedTracks.value.length - 1 || shouldLoop.value
  })

  // Shuffle algorithm (Fisher-Yates)
  const initShuffle = (): void => {
    const order = [...Array(sortedTracks.value.length).keys()]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = order[i]
      order[i] = order[j] as number
      order[j] = temp as number
    }
    shuffledOrder.value = order
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Load and save state from localStorage
  const loadState = (): void => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        localVolume.value = state.volume ?? 0.3
      }
    } catch {
      // Ignore errors
    }
  }

  const saveState = (): void => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          volume: localVolume.value,
        })
      )
    } catch {
      // Ignore errors
    }
  }

  // Crossfade to next track
  const crossfadeToTrack = async (track: MusicTrack): Promise<void> => {
    if (!audioElement.value) return

    // Create new audio element
    nextAudioElement.value = new Audio(track.url)
    nextAudioElement.value.volume = 0
    nextAudioElement.value.preload = 'auto'

    // Add event listeners to new element
    nextAudioElement.value.addEventListener('ended', handleTrackEnd)
    nextAudioElement.value.addEventListener('timeupdate', updateProgress)

    try {
      await nextAudioElement.value.play()

      // Crossfade animation
      const steps = 20
      const interval = CROSSFADE_DURATION / steps
      const volumeStep = localVolume.value / steps

      for (let i = 0; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, interval))
        if (audioElement.value) {
          audioElement.value.volume = Math.max(0, localVolume.value - volumeStep * i)
        }
        if (nextAudioElement.value) {
          nextAudioElement.value.volume = Math.min(localVolume.value, volumeStep * i)
        }
      }

      // Cleanup old audio
      if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value.removeEventListener('ended', handleTrackEnd)
        audioElement.value.removeEventListener('timeupdate', updateProgress)
      }

      // Swap references
      audioElement.value = nextAudioElement.value
      nextAudioElement.value = null
    } catch {
      // Play failed
      nextAudioElement.value = null
    }
  }

  // Handle track end
  const handleTrackEnd = (): void => {
    if (playMode.value === 'single') {
      if (shouldLoop.value && audioElement.value) {
        audioElement.value.currentTime = 0
        audioElement.value.play()
      } else {
        isPlaying.value = false
      }
      return
    }

    // Playlist mode
    if (currentTrackIndex.value < sortedTracks.value.length - 1) {
      currentTrackIndex.value++
      const nextTrack = currentTrack.value
      if (nextTrack) {
        crossfadeToTrack(nextTrack)
      }
    } else if (shouldLoop.value) {
      currentTrackIndex.value = 0
      if (shouldShuffle.value) {
        initShuffle()
      }
      const nextTrack = currentTrack.value
      if (nextTrack) {
        crossfadeToTrack(nextTrack)
      }
    } else {
      isPlaying.value = false
    }
  }

  // Update progress
  const updateProgress = (): void => {
    if (!audioElement.value) return
    const duration = audioElement.value.duration || 1
    progress.value = (audioElement.value.currentTime / duration) * 100
  }

  // Skip to next track
  const skipNext = (): void => {
    if (!hasNextTrack.value || playMode.value === 'single') return

    if (currentTrackIndex.value < sortedTracks.value.length - 1) {
      currentTrackIndex.value++
    } else if (shouldLoop.value) {
      currentTrackIndex.value = 0
      if (shouldShuffle.value) {
        initShuffle()
      }
    }

    const nextTrack = currentTrack.value
    if (nextTrack && isPlaying.value) {
      crossfadeToTrack(nextTrack)
    } else if (nextTrack && audioElement.value) {
      audioElement.value.src = nextTrack.url
    }
  }

  // Toggle music
  const toggleMusic = async (): Promise<void> => {
    if (!audioElement.value || !currentTrack.value) return

    if (isPlaying.value) {
      audioElement.value.pause()
      isPlaying.value = false
    } else {
      try {
        // Ensure correct track is loaded
        if (audioElement.value.src !== currentTrack.value.url) {
          audioElement.value.src = currentTrack.value.url
        }
        audioElement.value.volume = localVolume.value
        await audioElement.value.play()
        isPlaying.value = true
      } catch {
        isPlaying.value = false
      }
    }
  }

  // Update volume
  const updateVolume = (newVolume: number): void => {
    localVolume.value = newVolume
    if (audioElement.value) {
      audioElement.value.volume = newVolume
    }
    saveState()
  }

  // Fetch music data
  const fetchMusicData = async (): Promise<void> => {
    isLoading.value = true
    try {
      const response = await getMusic()
      settings.value = response.settings
      tracks.value = response.tracks

      // Initialize volume from settings or localStorage
      loadState()
      if (!localStorage.getItem(STORAGE_KEY) && settings.value) {
        localVolume.value = settings.value.volume
      }

      // Initialize shuffle order
      if (settings.value.shuffle && tracks.value.length > 0) {
        initShuffle()
      }
    } catch (err) {
      console.error('Failed to fetch music:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Handle form focus to lower volume
  const handleFormFocus = (): void => {
    if (audioElement.value && isPlaying.value) {
      audioElement.value.volume = localVolume.value * 0.3
    }
  }

  const handleFormBlur = (): void => {
    if (audioElement.value && isPlaying.value) {
      audioElement.value.volume = localVolume.value
    }
  }

  // Watch for track changes
  watch(currentTrack, (newTrack) => {
    if (newTrack && audioElement.value && !isPlaying.value) {
      audioElement.value.src = newTrack.url
    }
  })

  onMounted(async () => {
    await fetchMusicData()

    // Initialize audio element
    audioElement.value = new Audio()
    audioElement.value.preload = 'auto'

    if (currentTrack.value) {
      audioElement.value.src = currentTrack.value.url
    }

    audioElement.value.volume = localVolume.value

    // Event listeners
    audioElement.value.addEventListener('ended', handleTrackEnd)
    audioElement.value.addEventListener('timeupdate', updateProgress)
    audioElement.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
    audioElement.value.addEventListener('play', () => {
      isPlaying.value = true
    })

    // Listen for form focus
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      el.addEventListener('focus', handleFormFocus)
      el.addEventListener('blur', handleFormBlur)
    })

    // Attempt autoplay if enabled
    if (shouldAutoplay.value && currentTrack.value && audioElement.value) {
      try {
        await audioElement.value.play()
        isPlaying.value = true
      } catch {
        // Autoplay blocked by browser - user will need to click to play
        console.log('Autoplay blocked by browser policy')
      }
    }
  })

  onUnmounted(() => {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.removeEventListener('ended', handleTrackEnd)
      audioElement.value.removeEventListener('timeupdate', updateProgress)
      audioElement.value = null
    }
    if (nextAudioElement.value) {
      nextAudioElement.value.pause()
      nextAudioElement.value = null
    }
  })
</script>

<template>
  <div v-if="isEnabled && !isLoading && tracks.length > 0" class="relative">
    <!-- Main Button -->
    <div class="relative" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white cursor-pointer transition-all duration-300 hover:bg-white/30 active:scale-95"
          :aria-label="isPlaying ? 'Pause music' : 'Play music'"
          @click="toggleMusic"
        >
          <!-- Music Icon -->
          <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path
              d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path
              d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"
            />
          </svg>

          <!-- Progress bar (mini) -->
          <div v-if="isPlaying" class="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              class="h-full bg-white transition-all duration-100"
              :style="{ width: `${progress}%` }"
            />
          </div>

          <span class="font-body text-[10px] sm:text-xs font-medium uppercase tracking-wider">
            {{ isPlaying ? 'ON' : 'OFF' }}
          </span>
        </button>

        <!-- Expand controls button (separate from main button) -->
        <button
          type="button"
          class="p-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white cursor-pointer transition-all duration-300 hover:bg-white/30"
          aria-label="Toggle music controls"
          @click="showControls = !showControls"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="showControls ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"
            />
          </svg>
        </button>
      </div>

      <!-- Tooltip: Now Playing -->
      <Transition name="tooltip">
        <div
          v-if="showTooltip && currentTrack && isPlaying"
          class="absolute top-full right-0 mt-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap z-50"
        >
          <span class="text-white/60">Now Playing:</span>
          {{ currentTrack.title }}
          <span v-if="currentTrack.artist" class="text-white/60">- {{ currentTrack.artist }}</span>
        </div>
      </Transition>
    </div>

    <!-- Expanded Controls -->
    <Transition name="controls">
      <div
        v-if="showControls"
        class="absolute top-full right-0 mt-2 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl min-w-[200px] z-50"
      >
        <!-- Volume Slider -->
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
            />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="localVolume"
            class="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
            @input="(e) => updateVolume(parseFloat((e.target as HTMLInputElement).value))"
          />
          <span class="text-white/70 text-xs w-8 text-right"
            >{{ Math.round(localVolume * 100) }}%</span
          >
        </div>

        <!-- Track Info -->
        <div v-if="currentTrack" class="text-white text-xs mb-2">
          <p class="font-medium truncate">{{ currentTrack.title }}</p>
          <p class="text-white/60 truncate">
            {{ currentTrack.artist || 'Unknown' }} ·
            {{ formatDuration(currentTrack.duration) }}
          </p>
        </div>

        <!-- Skip Button (playlist mode) -->
        <button
          v-if="playMode === 'playlist' && hasNextTrack"
          type="button"
          class="flex items-center gap-1 text-white/80 hover:text-white text-xs transition-colors cursor-pointer"
          @click="skipNext"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
          Skip
        </button>
      </div>
    </Transition>
  </div>

  <!-- Fallback: Static audio (when API not available) -->
  <div v-else-if="!isLoading && tracks.length === 0" class="relative">
    <!-- Original simple toggle for fallback -->
  </div>
</template>

<style scoped>
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
  }

  input[type='range']::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
  }

  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: all 0.15s ease;
  }

  .tooltip-enter-from,
  .tooltip-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

  .controls-enter-active,
  .controls-leave-active {
    transition: all 0.2s ease;
  }

  .controls-enter-from,
  .controls-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
</style>
