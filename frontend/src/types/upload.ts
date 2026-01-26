export type UploadStatus =
  | 'preparing'
  | 'compressing'
  | 'optimizing' // For video compression
  | 'uploading'
  | 'confirming'
  | 'completed'
  | 'error'
  | 'cancelled'

export interface CompressionInfo {
  originalSize: number
  compressedSize: number
  savedPercent: number
}

export interface UploadState {
  progress: number
  status: UploadStatus
  error?: string
  compression?: CompressionInfo
}

export interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: UploadStatus
  error?: string
  compression?: CompressionInfo
}
