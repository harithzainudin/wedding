/**
 * Delete Hero Background Media Endpoint (Admin)
 *
 * Deletes hero background media for a specific device type.
 * Route: DELETE /admin/w/{weddingId}/hero-background/{deviceType}
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { validateDeviceType } from '../shared/hero-background-validation'
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
    // 2. Validate Device Type
    // ============================================
    deviceType = event.pathParameters?.deviceType
    const deviceValidation = validateDeviceType(deviceType)
    if (!deviceValidation.valid) {
      return createErrorResponse(400, deviceValidation.error, context, 'INVALID_DEVICE_TYPE')
    }

    // ============================================
    // 3. Authorization: Require Wedding Access
    // ============================================
    const authResult = requireWeddingAccess(event, weddingId)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 4. Verify Wedding Exists
    // ============================================
    const wedding = await getWeddingById(docClient, weddingId)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // ============================================
    // 4b. Check Wedding Status (Archived Check)
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
    // 5. Get Current Settings
    // ============================================
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'HERO_BACKGROUND'),
      })
    )

    if (!currentResult.Item) {
      return createErrorResponse(404, 'Hero background settings not found', context, 'NOT_FOUND')
    }

    const currentSettings = currentResult.Item

    // ============================================
    // 6. Get S3 Key to Delete
    // ============================================
    let s3KeyToDelete: string | undefined
    const validDeviceType = deviceValidation.data

    if (validDeviceType === 'poster') {
      // Poster is stored as posterUrl, need to extract S3 key
      if (currentSettings.posterUrl) {
        // Extract S3 key from URL
        const posterUrl = currentSettings.posterUrl as string
        const bucketName = Resource.WeddingImageBucket.name
        const region = process.env.AWS_REGION ?? 'ap-southeast-5'
        const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`
        if (posterUrl.startsWith(prefix)) {
          s3KeyToDelete = posterUrl.slice(prefix.length)
        }
      }
    } else {
      const mediaItem = currentSettings[validDeviceType] as { s3Key?: string } | undefined
      s3KeyToDelete = mediaItem?.s3Key
    }

    if (!s3KeyToDelete) {
      return createErrorResponse(
        404,
        `No media found for device type: ${validDeviceType}`,
        context,
        'MEDIA_NOT_FOUND'
      )
    }

    // ============================================
    // 7. Delete from S3
    // ============================================
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: Resource.WeddingImageBucket.name,
          Key: s3KeyToDelete,
        })
      )
    } catch (s3Error) {
      // Log but don't fail - file might already be deleted
      logError(
        {
          endpoint: 'DELETE /admin/w/{weddingId}/hero-background/{deviceType}',
          operation: 'deleteS3Object',
          requestId: context.awsRequestId,
          input: { s3Key: s3KeyToDelete },
        },
        s3Error
      )
    }

    // ============================================
    // 8. Update Database
    // ============================================
    const now = new Date().toISOString()

    // Build updated settings without the deleted media
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { desktop, mobile, universal, posterUrl, ...rest } = currentSettings

    const updatedSettings = {
      ...Keys.settings(weddingId, 'HERO_BACKGROUND'),
      ...rest,
      // Only include media items that weren't deleted
      ...(validDeviceType !== 'desktop' && desktop && { desktop }),
      ...(validDeviceType !== 'mobile' && mobile && { mobile }),
      ...(validDeviceType !== 'universal' && universal && { universal }),
      ...(validDeviceType !== 'poster' && posterUrl && { posterUrl }),
      overlay: currentSettings.overlay ?? DEFAULT_OVERLAY,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    // Check if any media remains
    const hasMedia = updatedSettings.desktop || updatedSettings.mobile || updatedSettings.universal
    if (!hasMedia) {
      updatedSettings.mediaType = 'none'
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedSettings,
      })
    )

    // Build response matching HeroBackgroundSettings type
    const responseSettings = {
      mediaType: updatedSettings.mediaType ?? currentSettings.mediaType ?? 'none',
      uploadMode: updatedSettings.uploadMode ?? currentSettings.uploadMode ?? 'separate',
      ...(updatedSettings.desktop && { desktop: updatedSettings.desktop }),
      ...(updatedSettings.mobile && { mobile: updatedSettings.mobile }),
      ...(updatedSettings.universal && { universal: updatedSettings.universal }),
      overlay: updatedSettings.overlay,
      ...(updatedSettings.posterUrl && { posterUrl: updatedSettings.posterUrl }),
      ...(currentSettings.maxImageSize && { maxImageSize: currentSettings.maxImageSize }),
      ...(currentSettings.maxVideoSize && { maxVideoSize: currentSettings.maxVideoSize }),
      updatedAt: updatedSettings.updatedAt,
      updatedBy: updatedSettings.updatedBy,
    }

    return createSuccessResponse(200, { heroBackground: responseSettings }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /admin/w/{weddingId}/hero-background/{deviceType}',
        operation: 'deleteHeroBackgroundMedia',
        requestId: context.awsRequestId,
        input: { deviceType },
      },
      error
    )
    return createErrorResponse(500, 'Failed to delete hero background media', context, 'DB_ERROR')
  }
}
