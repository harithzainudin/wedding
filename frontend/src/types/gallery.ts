export interface GalleryImage {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  order: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface GallerySettings {
  maxFileSize: number;
  maxImages: number;
  allowedFormats: string[];
  updatedAt?: string | undefined;
  updatedBy?: string | undefined;
}

export interface PresignedUrlRequest {
  filename: string;
  mimeType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  success: boolean;
  data?: {
    uploadUrl: string;
    imageId: string;
    s3Key: string;
    expiresIn: number;
  } | undefined;
  error?: string | undefined;
}

export interface ConfirmUploadRequest {
  imageId: string;
  s3Key: string;
  filename: string;
  mimeType: string;
}

export interface ConfirmUploadResponse {
  success: boolean;
  data?: GalleryImage | undefined;
  error?: string | undefined;
}

export interface ListImagesResponse {
  success: boolean;
  data?: {
    images: GalleryImage[];
    total: number;
    settings?: GallerySettings | undefined;
    remainingSlots?: number | undefined;
  } | undefined;
  error?: string | undefined;
}

export interface ReorderImagesRequest {
  imageIds: string[];
}

export interface DeleteImageResponse {
  success: boolean;
  message?: string | undefined;
  error?: string | undefined;
}

export interface UpdateSettingsRequest {
  maxFileSize?: number | undefined;
  maxImages?: number | undefined;
}

export interface SettingsResponse {
  success: boolean;
  data?: GallerySettings | undefined;
  error?: string | undefined;
}
