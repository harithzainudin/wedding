/**
 * Request Global Music Upload Endpoint (Super Admin Only)
 *
 * Generates a presigned URL for uploading a music track to the global library.
 * Route: POST /superadmin/music-library/upload-url
 *
 * SECURITY: Requires super admin authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { S3Keys } from '../../shared/s3-keys'
import {
  ALLOWED_AUDIO_MIME_TYPES,
  MIME_TO_EXTENSION,
  DEFAULT_MAX_FILE_SIZE,
} from '../../shared/music-constants'
import {
  validateGlobalMusicUploadRequest,
  type GlobalMusicUploadRequest,
} from '../../shared/global-music-validation'

const s3Client = new S3Client({})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let mimeType: string | undefined
  let fileSize: number | undefined

  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Parse and Validate Input
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: GlobalMusicUploadRequest
    try {
      body = JSON.parse(event.body) as GlobalMusicUploadRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    // Validate MIME type
    if (
      !ALLOWED_AUDIO_MIME_TYPES.includes(body.mimeType as (typeof ALLOWED_AUDIO_MIME_TYPES)[number])
    ) {
      return createErrorResponse(
        400,
        `Invalid audio format. Allowed: ${ALLOWED_AUDIO_MIME_TYPES.join(', ')}`,
        context,
        'INVALID_MIME_TYPE'
      )
    }

    // Validate file size
    if (body.fileSize > DEFAULT_MAX_FILE_SIZE) {
      return createErrorResponse(
        400,
        `File size exceeds maximum of ${DEFAULT_MAX_FILE_SIZE / 1024 / 1024}MB`,
        context,
        'FILE_TOO_LARGE'
      )
    }

    // Validate upload request
    const validation = validateGlobalMusicUploadRequest(body)
    if ('error' in validation) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 3. Generate Presigned URL
    // ============================================
    mimeType = validation.mimeType
    fileSize = validation.fileSize
    const trackId = uuidv4()
    const extension = MIME_TO_EXTENSION[mimeType] ?? ''
    const s3Key = S3Keys.globalMusic(trackId, extension)

    const command = new PutObjectCommand({
      Bucket: Resource.WeddingImageBucket.name,
      Key: s3Key,
      ContentType: mimeType,
      ContentLength: fileSize,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    })

    return createSuccessResponse(
      200,
      {
        uploadUrl: presignedUrl,
        trackId,
        s3Key,
        expiresIn: 600,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/music-library/upload-url',
        operation: 'requestGlobalMusicUpload',
        requestId: context.awsRequestId,
        input: { mimeType, fileSize },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
