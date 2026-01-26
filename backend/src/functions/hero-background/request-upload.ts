/**
 * Request Hero Background Upload Endpoint (Admin)
 *
 * Generates a presigned URL for uploading hero background media.
 * Route: POST /admin/w/{weddingId}/hero-background/presigned-url
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { S3Keys } from '../shared/s3-keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { validateHeroBackgroundUpload } from '../shared/hero-background-validation'
import {
  HERO_IMAGE_DEFAULT_MAX_SIZE,
  HERO_VIDEO_DEFAULT_MAX_SIZE,
  HERO_MIME_TO_EXTENSION,
} from '../shared/hero-background-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

async function getHeroBackgroundLimits(weddingId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: Keys.settings(weddingId, 'HERO_BACKGROUND'),
    })
  )

  return {
    maxImageSize: (result.Item?.maxImageSize as number) ?? HERO_IMAGE_DEFAULT_MAX_SIZE,
    maxVideoSize: (result.Item?.maxVideoSize as number) ?? HERO_VIDEO_DEFAULT_MAX_SIZE,
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let mimeType: string | undefined
  let fileSize: number | undefined
  let deviceType: string | undefined

  try {
    // ============================================
    // 1. Extract and Validate Wedding ID
    // ============================================
    const weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 2. Authorization: Require Wedding Access
    // ============================================
    const authResult = requireWeddingAccess(event, weddingId)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 3. Verify Wedding Exists
    // ============================================
    const wedding = await getWeddingById(docClient, weddingId)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // ============================================
    // 3b. Check Wedding Status (Archived Check)
    // ============================================
    const isSuperAdmin = authResult.user.type === 'super' || authResult.user.isMaster
    const accessCheck = requireAdminAccessibleWedding(wedding, isSuperAdmin)
    if (!accessCheck.success) {
      return createErrorResponse(
        accessCheck.statusCode,
        accessCheck.error,
        context,
        'ACCESS_DENIED'
      )
    }

    // ============================================
    // 4. Parse and Validate Input
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: unknown
    try {
      body = JSON.parse(event.body)
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    const limits = await getHeroBackgroundLimits(weddingId)
    const validation = validateHeroBackgroundUpload(body, limits)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    mimeType = validation.data.mimeType
    fileSize = validation.data.fileSize
    deviceType = validation.data.deviceType

    // ============================================
    // 5. Generate Presigned URL
    // ============================================
    const extension = HERO_MIME_TO_EXTENSION[mimeType] ?? ''
    const s3Key = S3Keys.heroBackground(weddingId, deviceType, extension)

    const command = new PutObjectCommand({
      Bucket: Resource.WeddingImageBucket.name,
      Key: s3Key,
      ContentType: mimeType,
      ContentLength: fileSize,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600, // 10 minutes
    })

    return createSuccessResponse(
      200,
      {
        uploadUrl: presignedUrl,
        deviceType,
        s3Key,
        expiresIn: 600,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/hero-background/presigned-url',
        operation: 'requestHeroBackgroundUpload',
        requestId: context.awsRequestId,
        input: { mimeType, fileSize, deviceType },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
