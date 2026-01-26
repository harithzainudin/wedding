/**
 * Video Compression Utility
 *
 * Uses Canvas + MediaRecorder API for client-side video compression.
 * Re-encodes video at target resolution and bitrate.
 */

export interface VideoCompressionOptions {
  maxWidth?: number // Default: 1920 (1080p)
  maxHeight?: number // Default: 1080
  videoBitrate?: number // Default: 8_000_000 (8 Mbps)
  audioBitrate?: number // Default: 128_000 (128 kbps)
}

export interface VideoCompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  savedPercent: number
  wasCompressed: boolean
}

const DEFAULT_OPTIONS: Required<VideoCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  videoBitrate: 8_000_000, // 8 Mbps
  audioBitrate: 128_000, // 128 kbps
}

/**
 * Check if video compression is supported in the current browser
 */
export function isVideoCompressionSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLVideoElement !== 'undefined' &&
    // Check if we can record from canvas
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  )
}

/**
 * Get the best supported video MIME type for recording
 */
function getSupportedMimeType(): string | null {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return null
}

/**
 * Calculate scaled dimensions while maintaining aspect ratio
 */
function calculateScaledDimensions(
  videoWidth: number,
  videoHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = videoWidth
  let height = videoHeight

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  // Ensure dimensions are even (required for some codecs)
  width = Math.floor(width / 2) * 2
  height = Math.floor(height / 2) * 2

  return { width, height }
}

/**
 * Compress a video file using Canvas + MediaRecorder
 *
 * @param file - The video file to compress
 * @param options - Compression options
 * @param onProgress - Progress callback (0-100)
 * @returns Compressed video file and metadata
 */
export async function compressVideo(
  file: File,
  options: VideoCompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<VideoCompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = file.size

  // Check browser support
  if (!isVideoCompressionSupported()) {
    console.warn('[VideoCompression] Browser does not support video compression, using original')
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      wasCompressed: false,
    }
  }

  const mimeType = getSupportedMimeType()
  if (!mimeType) {
    console.warn('[VideoCompression] No supported MIME type found, using original')
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      wasCompressed: false,
    }
  }

  onProgress?.(0)

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    video.muted = true
    video.playsInline = true

    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl

    video.onloadedmetadata = async () => {
      try {
        // Calculate target dimensions
        const { width, height } = calculateScaledDimensions(
          video.videoWidth,
          video.videoHeight,
          opts.maxWidth,
          opts.maxHeight
        )

        canvas.width = width
        canvas.height = height

        // Start video playback
        video.currentTime = 0
        await video.play()

        // Capture stream from canvas
        const canvasStream = canvas.captureStream(30) // 30 fps

        // Try to get audio from video
        let combinedStream: MediaStream
        try {
          // Create an audio context to extract audio
          const audioContext = new AudioContext()
          const source = audioContext.createMediaElementSource(video)
          const destination = audioContext.createMediaStreamDestination()
          source.connect(destination)
          source.connect(audioContext.destination) // Also play through speakers (muted)

          // Combine video and audio tracks
          const audioTracks = destination.stream.getAudioTracks()
          combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])
        } catch {
          // No audio or audio extraction failed, use video only
          combinedStream = canvasStream
        }

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: opts.videoBitrate,
          audioBitsPerSecond: opts.audioBitrate,
        })

        const chunks: Blob[] = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(objectUrl)

          const compressedBlob = new Blob(chunks, { type: mimeType })
          const compressedSize = compressedBlob.size

          // If compressed is larger than original, return original
          if (compressedSize >= originalSize) {
            console.log('[VideoCompression] Compressed size larger than original, using original')
            resolve({
              file,
              originalSize,
              compressedSize: originalSize,
              savedPercent: 0,
              wasCompressed: false,
            })
            return
          }

          // Determine output extension based on MIME type
          const extension = mimeType.includes('webm') ? '.webm' : '.mp4'
          const originalName = file.name.replace(/\.[^/.]+$/, '')
          const compressedFile = new File(
            [compressedBlob],
            `${originalName}_optimized${extension}`,
            { type: mimeType }
          )

          const savedPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100)

          console.log(
            `[VideoCompression] Compressed ${Math.round(originalSize / 1024 / 1024)}MB -> ${Math.round(compressedSize / 1024 / 1024)}MB (${savedPercent}% saved)`
          )

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize,
            savedPercent,
            wasCompressed: true,
          })
        }

        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(objectUrl)
          reject(new Error(`MediaRecorder error: ${e}`))
        }

        // Start recording
        mediaRecorder.start(100) // Capture in 100ms chunks

        // Animation loop to draw video frames to canvas
        const duration = video.duration
        let lastProgress = 0

        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop()
            return
          }

          // Draw current frame to canvas
          ctx.drawImage(video, 0, 0, width, height)

          // Update progress
          const currentProgress = Math.min(95, Math.round((video.currentTime / duration) * 95))
          if (currentProgress > lastProgress) {
            lastProgress = currentProgress
            onProgress?.(currentProgress)
          }

          requestAnimationFrame(drawFrame)
        }

        drawFrame()

        // Stop when video ends
        video.onended = () => {
          onProgress?.(100)
          mediaRecorder.stop()
        }
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        reject(error)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

/**
 * Get video duration in seconds
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(video.duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

/**
 * Get video dimensions
 */
export function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video'))
    }
  })
}
