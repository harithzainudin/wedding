export interface GalleryImage {
  id: string
  url: string
  filename: string
  mimeType: string
  fileSize: number
  order: number
  uploadedAt: string
  uploadedBy: string
}

export interface GallerySettings {
  maxFileSize: number
  maxImages: number
  allowedFormats: string[]
  updatedAt?: string | undefined
  updatedBy?: string | undefined
}

export interface PresignedUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
}

// Response data from presigned URL endpoint (unwrapped)
export interface PresignedUrlResponse {
  uploadUrl: string
  imageId: string
  s3Key: string
  expiresIn: number
}

export interface ConfirmUploadRequest {
  imageId: string
  s3Key: string
  filename: string
  mimeType: string
}

// Response data from confirm upload endpoint (unwrapped)
export interface ConfirmUploadResponse {
  id: string
  filename: string
  s3Key: string
  mimeType: string
  fileSize: number
  order: number
  uploadedAt: string
  url: string
}

// Response data from list images endpoint (unwrapped)
export interface ListImagesResponse {
  images: GalleryImage[]
  total: number
  settings?: GallerySettings | undefined
  remainingSlots?: number | undefined
}

export interface ReorderImagesRequest {
  imageIds: string[]
}

// Response data from delete image endpoint (unwrapped)
export interface DeleteImageResponse {
  message: string
}

export interface UpdateSettingsRequest {
  maxFileSize?: number | undefined
  maxImages?: number | undefined
}

// Response data from settings endpoint (unwrapped)
export interface SettingsResponse {
  maxFileSize: number
  maxImages: number
  allowedFormats: string[]
  updatedAt?: string | undefined
  updatedBy?: string | undefined
}
