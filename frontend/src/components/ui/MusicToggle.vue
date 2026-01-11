<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isPlaying = ref(false);
const audioElement = ref<HTMLAudioElement | null>(null);

const toggleMusic = async (): Promise<void> => {
  if (!audioElement.value) return;

  if (isPlaying.value) {
    // Pause the audio
    audioElement.value.pause();
    isPlaying.value = false;
  } else {
    // Try to play - only set isPlaying if successful
    try {
      await audioElement.value.play();
      isPlaying.value = true;
    } catch {
      // Play failed (autoplay policy), don't update state
      isPlaying.value = false;
    }
  }
};

onMounted(() => {
  audioElement.value = new Audio(`${import.meta.env.BASE_URL}audio/background.mp3`);
  audioElement.value.loop = true;
  audioElement.value.volume = 0.3;
  audioElement.value.preload = "auto";

  // Sync state when audio is paused externally
  audioElement.value.addEventListener("pause", () => {
    isPlaying.value = false;
  });

  audioElement.value.addEventListener("play", () => {
    isPlaying.value = true;
  });
});

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value = null;
  }
});
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white cursor-pointer transition-all duration-300 hover:bg-white/30 active:scale-95"
    :aria-label="isPlaying ? 'Pause music' : 'Play music'"
    @click="toggleMusic"
  >
    <!-- Music On Icon -->
    <svg
      v-if="isPlaying"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="w-5 h-5"
    >
      <path
        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
      />
    </svg>
    <!-- Music Off Icon -->
    <svg
      v-else
      viewBox="0 0 24 24"
      fill="currentColor"
      class="w-5 h-5"
    >
      <path
        d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"
      />
    </svg>
    <span class="font-body text-[10px] sm:text-xs font-medium uppercase tracking-wider">
      {{ isPlaying ? "ON" : "OFF" }}
    </span>
  </button>
</template>
