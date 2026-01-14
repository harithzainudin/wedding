export const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const DEFAULT_MAX_TRACKS = 20;
export const DEFAULT_VOLUME = 0.3;
export const DEFAULT_ENABLED = true;
export const DEFAULT_AUTOPLAY = false;
export const DEFAULT_MODE = "single" as const;
export const DEFAULT_SHUFFLE = false;
export const DEFAULT_LOOP = true;

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg", // MP3
  "audio/mp4", // M4A
  "audio/x-m4a", // M4A alternative
  "audio/wav", // WAV
  "audio/x-wav", // WAV alternative
  "audio/ogg", // OGG
] as const;

export const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/ogg": ".ogg",
};

export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];
export type PlayMode = "single" | "playlist";
export type MusicSource = "upload" | "pixabay";
