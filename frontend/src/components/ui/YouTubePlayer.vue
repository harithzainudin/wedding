<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue'

  interface YTPlayer {
    playVideo: () => void
    pauseVideo: () => void
    stopVideo: () => void
    setVolume: (volume: number) => void
    getVolume: () => number
    getCurrentTime: () => number
    getDuration: () => number
    getPlayerState: () => number
    destroy: () => void
    loadVideoById: (videoId: string) => void
  }

  interface YTPlayerEvent {
    target: YTPlayer
    data: number
  }

  const props = defineProps<{
    videoId: string
    volume?: number
    autoplay?: boolean
  }>()

  const emit = defineEmits<{
    ready: [player: YTPlayer]
    stateChange: [state: number]
    ended: []
    error: [error: number]
    durationChange: [duration: number]
  }>()

  const playerRef = ref<HTMLDivElement | null>(null)
  const player = ref<YTPlayer | null>(null)
  const isApiLoaded = ref(false)
  const containerId = `youtube-player-${Date.now()}`

  // YouTube player states
  const YT_STATES = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  }

  // Load YouTube IFrame API
  const loadYouTubeApi = (): Promise<void> => {
    return new Promise((resolve) => {
      // Check if API is already loaded
      if (
        typeof window !== 'undefined' &&
        'YT' in window &&
        (window as unknown as { YT: { Player: unknown } }).YT.Player
      ) {
        isApiLoaded.value = true
        resolve()
        return
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if ('YT' in window && (window as unknown as { YT: { Player: unknown } }).YT.Player) {
            clearInterval(checkInterval)
            isApiLoaded.value = true
            resolve()
          }
        }, 100)
        return
      }

      // Load the API
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)

      // Global callback
      ;(window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady =
        () => {
          isApiLoaded.value = true
          resolve()
        }
    })
  }

  // Create player instance
  const createPlayer = (): void => {
    if (!isApiLoaded.value || !playerRef.value) return

    const YT = (
      window as unknown as { YT: { Player: new (id: string, config: unknown) => YTPlayer } }
    ).YT

    player.value = new YT.Player(containerId, {
      height: '100%',
      width: '100%',
      videoId: props.videoId,
      playerVars: {
        autoplay: props.autoplay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: (event: YTPlayerEvent) => {
          if (props.volume !== undefined) {
            event.target.setVolume(props.volume * 100)
          }
          emit('ready', event.target)

          // Get duration after a short delay
          setTimeout(() => {
            if (player.value) {
              const duration = player.value.getDuration()
              if (duration > 0) {
                emit('durationChange', duration)
              }
            }
          }, 500)
        },
        onStateChange: (event: YTPlayerEvent) => {
          emit('stateChange', event.data)
          if (event.data === YT_STATES.ENDED) {
            emit('ended')
          }
        },
        onError: (event: YTPlayerEvent) => {
          emit('error', event.data)
        },
      },
    })
  }

  // Player controls
  const play = (): void => {
    player.value?.playVideo()
  }

  const pause = (): void => {
    player.value?.pauseVideo()
  }

  const stop = (): void => {
    player.value?.stopVideo()
  }

  const setVolume = (volume: number): void => {
    player.value?.setVolume(volume * 100)
  }

  const getCurrentTime = (): number => {
    return player.value?.getCurrentTime() ?? 0
  }

  const getDuration = (): number => {
    return player.value?.getDuration() ?? 0
  }

  const loadVideo = (videoId: string): void => {
    player.value?.loadVideoById(videoId)
  }

  // Watch for volume changes
  watch(
    () => props.volume,
    (newVolume) => {
      if (newVolume !== undefined && player.value) {
        player.value.setVolume(newVolume * 100)
      }
    }
  )

  // Watch for videoId changes
  watch(
    () => props.videoId,
    (newVideoId) => {
      if (newVideoId && player.value) {
        player.value.loadVideoById(newVideoId)
      }
    }
  )

  onMounted(async () => {
    await loadYouTubeApi()
    createPlayer()
  })

  onUnmounted(() => {
    player.value?.destroy()
  })

  defineExpose({
    play,
    pause,
    stop,
    setVolume,
    getCurrentTime,
    getDuration,
    loadVideo,
  })
</script>

<template>
  <!-- Hidden YouTube player container -->
  <div ref="playerRef" class="youtube-player-wrapper" :class="{ 'youtube-player-hidden': true }">
    <div :id="containerId"></div>
  </div>
</template>

<style scoped>
  .youtube-player-wrapper {
    position: fixed;
    pointer-events: none;
  }

  .youtube-player-hidden {
    width: 1px;
    height: 1px;
    bottom: 0;
    right: 0;
    opacity: 0;
    overflow: hidden;
  }
</style>
