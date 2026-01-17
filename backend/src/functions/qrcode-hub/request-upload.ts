import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import { QRCODE_LIMITS } from '../shared/qrcode-validation'

const s3Client = new S3Client({})

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

interface UploadRequest {
  mimeType: string
  fileSize: number
}

function validateUploadRequest(
  input: unknown
): { valid: true; data: UploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate mimeType
  if (typeof body.mimeType !== 'string') {
    return { valid: false, error: 'mimeType is required' }
  }
  if (!QRCODE_LIMITS.allowedImageFormats.includes(body.mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${QRCODE_LIMITS.allowedImageFormats.join(', ')}`,
    }
  }

  // Validate fileSize
  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    return { valid: false, error: 'fileSize must be a positive number' }
  }
  if (body.fileSize > QRCODE_LIMITS.maxImageSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${QRCODE_LIMITS.maxImageSize / 1024 / 1024}MB`,
    }
  }

  return {
    valid: true,
    data: {
      mimeType: body.mimeType,
      fileSize: body.fileSize,
    },
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let mimeType: string | undefined
  let fileSize: number | undefined

  try {
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: unknown
    try {
      body = JSON.parse(event.body)
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    const validation = validateUploadRequest(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    mimeType = validation.data.mimeType
    fileSize = validation.data.fileSize
    const imageId = uuidv4()
    const extension = MIME_TO_EXTENSION[mimeType] ?? '.jpg'
    const s3Key = `qrcode-hub/restu-digital-${imageId}${extension}`

    // Generate presigned URL (valid for 10 minutes)
    const command = new PutObjectCommand({
      Bucket: Resource.WeddingImageBucket.name,
      Key: s3Key,
      ContentType: mimeType,
      ContentLength: fileSize,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    })

    // Generate the public URL for the image after upload
    const publicUrl = `https://${Resource.WeddingImageBucket.name}.s3.amazonaws.com/${s3Key}`

    return createSuccessResponse(
      200,
      {
        uploadUrl: presignedUrl,
        imageId,
        s3Key,
        publicUrl,
        expiresIn: 600,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /qrcode-hub/request-upload',
        operation: 'requestRestuDigitalUpload',
        requestId: context.awsRequestId,
        input: { mimeType, fileSize },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
