/**
 * S3 Key Helpers for Multi-Tenant Wedding Platform
 *
 * All file uploads MUST use these helpers to ensure proper
 * data isolation between weddings in S3.
 *
 * Structure: weddings/{weddingId}/{type}/{fileId}{extension}
 */

/**
 * S3 key generators for different file types
 */
export const S3Keys = {
  /**
   * Gallery image
   * Path: weddings/{weddingId}/gallery/{imageId}{ext}
   */
  gallery: (weddingId: string, imageId: string, extension: string): string =>
    `weddings/${weddingId}/gallery/${imageId}${extension}`,

  /**
   * Music track
   * Path: weddings/{weddingId}/music/{trackId}{ext}
   */
  music: (weddingId: string, trackId: string, extension: string): string =>
    `weddings/${weddingId}/music/${trackId}${extension}`,

  /**
   * Gift item image
   * Path: weddings/{weddingId}/gifts/{giftId}{ext}
   */
  gift: (weddingId: string, giftId: string, extension: string): string =>
    `weddings/${weddingId}/gifts/${giftId}${extension}`,

  /**
   * Parking guide image
   * Path: weddings/{weddingId}/parking/{imageId}{ext}
   */
  parking: (weddingId: string, imageId: string, extension: string): string =>
    `weddings/${weddingId}/parking/${imageId}${extension}`,

  /**
   * QR Code Hub image
   * Path: weddings/{weddingId}/qrcode/{filename}
   */
  qrCode: (weddingId: string, filename: string): string =>
    `weddings/${weddingId}/qrcode/${filename}`,
}

/**
 * Extract weddingId from S3 key
 * Returns null if key doesn't match expected pattern
 */
export function extractWeddingIdFromS3Key(s3Key: string): string | null {
  const match = s3Key.match(/^weddings\/([^/]+)\//)
  return match?.[1] ?? null
}

/**
 * Validate that an S3 key belongs to the specified wedding
 * Use this to prevent path traversal attacks
 */
export function validateS3KeyOwnership(s3Key: string, expectedWeddingId: string): boolean {
  const extractedId = extractWeddingIdFromS3Key(s3Key)
  return extractedId === expectedWeddingId
}

/**
 * Get the file extension from a filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot).toLowerCase()
}

/**
 * Generate a public URL for an S3 object
 */
export function getPublicS3Url(bucketName: string, region: string, s3Key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`
}
