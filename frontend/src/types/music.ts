export type MusicSource = "upload";
export type PlayMode = "single" | "playlist";

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string | undefined;
  duration: number;
  filename: string;
  url: string;
  mimeType: string;
  fileSize: number;
  order: number;
  source: MusicSource;
  externalId?: string | undefined;
  externalUrl?: string | undefined;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MusicSettings {
  enabled: boolean;
  autoplay: boolean;
  volume: number;
  mode: PlayMode;
  shuffle: boolean;
  loop: boolean;
  selectedTrackId?: string | undefined;
  maxFileSize: number;
  maxTracks: number;
  allowedFormats: string[];
  updatedAt?: string | undefined;
  updatedBy?: string | undefined;
}

export interface MusicResponse {
  success: boolean;
  data?: {
    settings: MusicSettings;
    tracks: MusicTrack[];
  };
  error?: string;
}

export interface MusicSettingsUpdateRequest {
  enabled?: boolean | undefined;
  autoplay?: boolean | undefined;
  volume?: number | undefined;
  mode?: PlayMode | undefined;
  shuffle?: boolean | undefined;
  loop?: boolean | undefined;
  selectedTrackId?: string | null | undefined;
}

export interface MusicSettingsUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface MusicPresignedUrlRequest {
  filename: string;
  mimeType: string;
  fileSize: number;
  title: string;
  artist?: string | undefined;
  duration?: number | undefined;
}

export interface MusicPresignedUrlResponse {
  success: boolean;
  data?: {
    uploadUrl: string;
    trackId: string;
    s3Key: string;
    expiresIn: number;
  };
  error?: string;
}

export interface MusicConfirmRequest {
  trackId: string;
  s3Key: string;
  filename: string;
  mimeType: string;
  title: string;
  artist?: string | undefined;
  duration: number;
}

export interface MusicConfirmResponse {
  success: boolean;
  data?: MusicTrack;
  error?: string;
}

export interface MusicDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface MusicReorderRequest {
  trackIds: string[];
}

export interface MusicReorderResponse {
  success: boolean;
  message?: string;
  error?: string;
}
