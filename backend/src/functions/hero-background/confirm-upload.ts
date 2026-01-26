/**
 * Confirm Hero Background Upload Endpoint (Admin)
 *
 * Confirms a hero background upload and updates the database record.
 * Route: POST /admin/w/{weddingId}/hero-background/confirm
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getPublicS3Url, validateS3KeyOwnership } from '../shared/s3-keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { validateHeroBackgroundConfirm } from '../shared/hero-background-validation'
import { OVERLAY_DEFAULT_OPACITY } from '../shared/hero-background-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})
const s3Client = new S3Client({})

// Default hero background settings
const DEFAULT_OVERLAY = {
  enabled: true,
  color: 'black' as const,
  opacity: OVERLAY_DEFAULT_OPACITY,
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let deviceType: string | undefined
  let s3Key: string | undefined

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

    const validation = validateHeroBackgroundConfirm(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    deviceType = validation.data.deviceType
    s3Key = validation.data.s3Key
    const { mimeType, fileSize, dimensions } = validation.data

    // ============================================
    // 5. Validate S3 Key Ownership (Security)
    // ============================================
    if (!validateS3KeyOwnership(s3Key, weddingId)) {
      return createErrorResponse(403, 'Invalid S3 key for this wedding', context, 'FORBIDDEN')
    }

    // ============================================
    // 6. Verify File Exists in S3
    // ============================================
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    )

    const now = new Date().toISOString()
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'
    const publicUrl = getPublicS3Url(bucketName, region, s3Key)

    // Build media item
    const mediaItem = {
      url: publicUrl,
      s3Key,
      mimeType,
      fileSize,
      dimensions,
      uploadedAt: now,
    }

    // ============================================
    // 7. Get Current Settings and Update
    // ============================================
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'HERO_BACKGROUND'),
      })
    )

    const currentSettings = currentResult.Item ?? {}

    // Determine media type from MIME type
    const isVideo = mimeType.startsWith('video/')
    const mediaType = isVideo ? 'video' : 'image'

    // Build updated settings
    const updatedSettings = {
      ...Keys.settings(weddingId, 'HERO_BACKGROUND'),
      mediaType,
      uploadMode: currentSettings.uploadMode ?? 'separate',
      // Update the specific device type's media
      ...(deviceType === 'desktop' && { desktop: mediaItem }),
      ...(deviceType === 'mobile' && { mobile: mediaItem }),
      ...(deviceType === 'universal' && { universal: mediaItem }),
      ...(deviceType === 'poster' && { posterUrl: publicUrl }),
      // Preserve other media if not being replaced
      ...(deviceType !== 'desktop' &&
        currentSettings.desktop && { desktop: currentSettings.desktop }),
      ...(deviceType !== 'mobile' && currentSettings.mobile && { mobile: currentSettings.mobile }),
      ...(deviceType !== 'universal' &&
        currentSettings.universal && { universal: currentSettings.universal }),
      ...(deviceType !== 'poster' &&
        currentSettings.posterUrl && { posterUrl: currentSettings.posterUrl }),
      overlay: currentSettings.overlay ?? DEFAULT_OVERLAY,
      // Preserve limits if set by super admin
      ...(currentSettings.maxImageSize && { maxImageSize: currentSettings.maxImageSize }),
      ...(currentSettings.maxVideoSize && { maxVideoSize: currentSettings.maxVideoSize }),
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedSettings,
      })
    )

    // Build response matching HeroBackgroundSettings type
    const responseSettings = {
      mediaType: updatedSettings.mediaType,
      uploadMode: updatedSettings.uploadMode,
      ...(updatedSettings.desktop && { desktop: updatedSettings.desktop }),
      ...(updatedSettings.mobile && { mobile: updatedSettings.mobile }),
      ...(updatedSettings.universal && { universal: updatedSettings.universal }),
      overlay: updatedSettings.overlay,
      ...(updatedSettings.posterUrl && { posterUrl: updatedSettings.posterUrl }),
      ...(updatedSettings.maxImageSize && { maxImageSize: updatedSettings.maxImageSize }),
      ...(updatedSettings.maxVideoSize && { maxVideoSize: updatedSettings.maxVideoSize }),
      updatedAt: updatedSettings.updatedAt,
      updatedBy: updatedSettings.updatedBy,
    }

    return createSuccessResponse(201, { heroBackground: responseSettings }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/hero-background/confirm',
        operation: 'confirmHeroBackgroundUpload',
        requestId: context.awsRequestId,
        input: { deviceType, s3Key },
      },
      error
    )
    return createErrorResponse(
      400,
      'File not found in S3. Upload may have failed.',
      context,
      'S3_ERROR'
    )
  }
}
