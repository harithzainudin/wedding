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
  updatedAt?: string;
  updatedBy?: string;
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
  };
  error?: string;
}

export interface ConfirmUploadRequest {
  imageId: string;
  s3Key: string;
  filename: string;
  mimeType: string;
}

export interface ConfirmUploadResponse {
  success: boolean;
  data?: GalleryImage;
  error?: string;
}

export interface ListImagesResponse {
  success: boolean;
  data?: {
    images: GalleryImage[];
    total: number;
    settings: GallerySettings;
    remainingSlots: number;
  };
  error?: string;
}

export interface ReorderImagesRequest {
  imageIds: string[];
}

export interface DeleteImageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UpdateSettingsRequest {
  maxFileSize?: number;
  maxImages?: number;
}

export interface SettingsResponse {
  success: boolean;
  data?: GallerySettings;
  error?: string;
}
