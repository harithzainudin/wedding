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

// Response data from music endpoint (unwrapped)
export interface MusicResponse {
  settings: MusicSettings;
  tracks: MusicTrack[];
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

// Response data from music settings update endpoint (unwrapped)
export interface MusicSettingsUpdateResponse {
  message: string;
}

export interface MusicPresignedUrlRequest {
  filename: string;
  mimeType: string;
  fileSize: number;
  title: string;
  artist?: string | undefined;
  duration?: number | undefined;
}

// Response data from music presigned URL endpoint (unwrapped)
export interface MusicPresignedUrlResponse {
  uploadUrl: string;
  trackId: string;
  s3Key: string;
  expiresIn: number;
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

// Response data from music confirm upload endpoint (unwrapped)
export interface MusicConfirmResponse {
  id: string;
  title: string;
  artist?: string | undefined;
  duration: number;
  filename: string;
  url: string;
  mimeType: string;
  order: number;
  source: MusicSource;
  uploadedAt: string;
  uploadedBy: string;
}

// Response data from music delete endpoint (unwrapped)
export interface MusicDeleteResponse {
  message: string;
}

export interface MusicReorderRequest {
  trackIds: string[];
}

// Response data from music reorder endpoint (unwrapped)
export interface MusicReorderResponse {
  message: string;
}
