<script setup lang="ts">
import { ref, watch } from "vue";
import type { MusicSettings, PlayMode } from "@/types/music";

const props = defineProps<{
  settings: MusicSettings;
}>();

const emit = defineEmits<{
  update: [settings: Record<string, unknown>];
}>();

const localSettings = ref({
  enabled: props.settings.enabled,
  autoplay: props.settings.autoplay,
  mode: props.settings.mode as PlayMode,
  shuffle: props.settings.shuffle,
  loop: props.settings.loop,
  volume: props.settings.volume,
});

// Watch for external changes
watch(
  () => props.settings,
  (newSettings) => {
    localSettings.value = {
      enabled: newSettings.enabled,
      autoplay: newSettings.autoplay,
      mode: newSettings.mode,
      shuffle: newSettings.shuffle,
      loop: newSettings.loop,
      volume: newSettings.volume,
    };
  },
  { deep: true },
);

const updateSetting = <K extends keyof typeof localSettings.value>(
  key: K,
  value: (typeof localSettings.value)[K],
): void => {
  localSettings.value[key] = value;
  emit("update", { [key]: value });
};

const volumePercentage = (vol: number): string => {
  return `${Math.round(vol * 100)}%`;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Enable Music -->
    <div class="flex items-center justify-between">
      <div>
        <p
          class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
        >
          Enable Music
        </p>
        <p
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
        >
          Show music player on the public site
        </p>
      </div>
      <button
        type="button"
        class="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
        :class="
          localSettings.enabled ? 'bg-sage' : 'bg-sand-dark dark:bg-dark-border'
        "
        @click="updateSetting('enabled', !localSettings.enabled)"
      >
        <span
          class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow"
          :class="localSettings.enabled ? 'left-7' : 'left-1'"
        />
      </button>
    </div>

    <!-- Autoplay -->
    <div class="flex items-center justify-between">
      <div>
        <p
          class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
        >
          Autoplay
        </p>
        <p
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
        >
          Try to play music automatically when page loads
        </p>
      </div>
      <button
        type="button"
        class="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
        :class="
          localSettings.autoplay
            ? 'bg-sage'
            : 'bg-sand-dark dark:bg-dark-border'
        "
        @click="updateSetting('autoplay', !localSettings.autoplay)"
      >
        <span
          class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow"
          :class="localSettings.autoplay ? 'left-7' : 'left-1'"
        />
      </button>
    </div>

    <!-- Play Mode -->
    <div>
      <p
        class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2"
      >
        Play Mode
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 px-4 py-2 font-body text-sm rounded-lg transition-colors cursor-pointer"
          :class="[
            localSettings.mode === 'single'
              ? 'bg-sage text-white'
              : 'bg-sand dark:bg-dark-bg border border-sand-dark dark:border-dark-border text-charcoal dark:text-dark-text hover:border-sage',
          ]"
          @click="updateSetting('mode', 'single')"
        >
          Single Track
        </button>
        <button
          type="button"
          class="flex-1 px-4 py-2 font-body text-sm rounded-lg transition-colors cursor-pointer"
          :class="[
            localSettings.mode === 'playlist'
              ? 'bg-sage text-white'
              : 'bg-sand dark:bg-dark-bg border border-sand-dark dark:border-dark-border text-charcoal dark:text-dark-text hover:border-sage',
          ]"
          @click="updateSetting('mode', 'playlist')"
        >
          Playlist
        </button>
      </div>
      <p
        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-1"
      >
        {{
          localSettings.mode === "single"
            ? "Play selected track only"
            : "Play all tracks in order"
        }}
      </p>
    </div>

    <!-- Shuffle (Playlist mode only) -->
    <div
      v-if="localSettings.mode === 'playlist'"
      class="flex items-center justify-between"
    >
      <div>
        <p
          class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
        >
          Shuffle
        </p>
        <p
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
        >
          Randomize track order
        </p>
      </div>
      <button
        type="button"
        class="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
        :class="
          localSettings.shuffle ? 'bg-sage' : 'bg-sand-dark dark:bg-dark-border'
        "
        @click="updateSetting('shuffle', !localSettings.shuffle)"
      >
        <span
          class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow"
          :class="localSettings.shuffle ? 'left-7' : 'left-1'"
        />
      </button>
    </div>

    <!-- Loop -->
    <div class="flex items-center justify-between">
      <div>
        <p
          class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
        >
          Loop
        </p>
        <p
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
        >
          {{
            localSettings.mode === "single"
              ? "Repeat track continuously"
              : "Repeat playlist when finished"
          }}
        </p>
      </div>
      <button
        type="button"
        class="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
        :class="
          localSettings.loop ? 'bg-sage' : 'bg-sand-dark dark:bg-dark-border'
        "
        @click="updateSetting('loop', !localSettings.loop)"
      >
        <span
          class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow"
          :class="localSettings.loop ? 'left-7' : 'left-1'"
        />
      </button>
    </div>

    <!-- Default Volume -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <p
          class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
        >
          Default Volume
        </p>
        <span class="font-body text-sm text-sage">
          {{ volumePercentage(localSettings.volume) }}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="localSettings.volume"
        class="w-full h-2 bg-sand dark:bg-dark-bg rounded-full appearance-none cursor-pointer"
        @input="
          (e) =>
            updateSetting(
              'volume',
              parseFloat((e.target as HTMLInputElement).value),
            )
        "
      />
      <div class="flex justify-between mt-1">
        <span
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
          >0%</span
        >
        <span
          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
          >100%</span
        >
      </div>
    </div>

    <!-- Info -->
    <div
      class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <p class="font-body text-xs text-blue-700 dark:text-blue-300">
        <strong>Note:</strong> Most browsers block autoplay until user
        interaction. Even with autoplay enabled, music may not start
        automatically on first visit. Visitors can always click the music button
        to start playing.
      </p>
    </div>
  </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #7c8363;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #7c8363;
  cursor: pointer;
  border: none;
}
</style>
