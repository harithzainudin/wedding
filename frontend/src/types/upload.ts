export type UploadStatus = 'uploading' | 'completed' | 'error' | 'cancelled'

export interface UploadState {
  progress: number
  status: UploadStatus
  error?: string
}

export interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: UploadStatus
  error?: string
}
