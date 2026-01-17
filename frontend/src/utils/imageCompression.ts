import imageCompression from 'browser-image-compression'

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export interface CompressionOptions {
  maxSizeMB?: number // Max file size (default: 1MB)
  maxWidthOrHeight?: number // Max dimension (default: 1920)
  quality?: number // 0-1, default 0.8
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  quality: 0.8,
}

/**
 * Compress an image file to reduce size while maintaining quality.
 * GIF files are skipped to preserve animation.
 * Returns original file if compression would increase size.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Skip non-image files and GIFs (often animated)
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    }
  }

  const compressedFile = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: opts.maxWidthOrHeight,
    initialQuality: opts.quality,
    useWebWorker: true,
  })

  // If compression made it larger (rare), use original
  if (compressedFile.size >= file.size) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    }
  }

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: file.size / compressedFile.size,
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format compression savings as a human-readable string
 */
export function formatCompressionSavings(original: number, compressed: number): string {
  const saved = original - compressed
  const percent = Math.round((saved / original) * 100)
  return `Saved ${formatBytes(saved)} (${percent}%)`
}
