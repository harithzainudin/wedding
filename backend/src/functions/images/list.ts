/**
 * List Images Endpoint
 *
 * Public: Returns gallery images for a wedding
 * Admin: Returns full data with settings
 *
 * Public Route: GET /{weddingSlug}/gallery
 * Admin Route: GET /admin/w/{weddingId}/images
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getPublicS3Url } from '../shared/s3-keys'
import {
  resolveWeddingSlug,
  requireActiveWedding,
  getWeddingById,
  requireAdminAccessibleWedding,
} from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_VIDEO_SIZE,
  DEFAULT_MAX_IMAGES,
  ALLOWED_MEDIA_TYPES,
} from '../shared/image-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    let weddingId: string
    let isAuthenticated = false

    // ============================================
    // Determine route type and extract wedding context
    // ============================================

    if (event.pathParameters?.weddingId) {
      // Admin route: /admin/w/{weddingId}/images
      weddingId = event.pathParameters.weddingId

      if (!isValidWeddingId(weddingId)) {
        return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
      }

      const authResult = requireWeddingAccess(event, weddingId)
      if (!authResult.authenticated) {
        return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
      }

      const wedding = await getWeddingById(docClient, weddingId)
      if (!wedding) {
        return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
      }

      // Check wedding status (archived check)
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

      isAuthenticated = true
    } else if (event.pathParameters?.weddingSlug) {
      // Public route: /{weddingSlug}/gallery
      const weddingSlug = event.pathParameters.weddingSlug
      const wedding = await resolveWeddingSlug(docClient, weddingSlug)
      const weddingCheck = requireActiveWedding(wedding)
      if (!weddingCheck.success) {
        return createErrorResponse(
          weddingCheck.statusCode,
          weddingCheck.error,
          context,
          'WEDDING_ERROR'
        )
      }
      weddingId = weddingCheck.wedding.weddingId
    } else {
      return createErrorResponse(400, 'Wedding identifier is required', context, 'MISSING_WEDDING')
    }

    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'

    // Query all images for this wedding ordered by gsi1sk
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#IMAGES` },
        ScanIndexForward: true,
      })
    )

    const images = (result.Items ?? []).map((item) => ({
      id: item.id as string,
      filename: item.filename as string,
      mimeType: item.mimeType as string,
      mediaType: (item.mediaType as string) ?? 'image', // Default to 'image' for existing records
      fileSize: item.fileSize as number,
      order: item.order as number,
      uploadedAt: item.uploadedAt as string,
      uploadedBy: item.uploadedBy as string,
      url: getPublicS3Url(bucketName, region, item.s3Key as string),
    }))

    // Get settings (visibility is now controlled by Design Tab)
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'IMAGES'),
      })
    )

    if (isAuthenticated) {
      // Note: allowedFormats is always the full ALLOWED_MEDIA_TYPES (application-defined, not user-configurable)
      const settings = {
        maxFileSize: (settingsResult.Item?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
        maxVideoSize: (settingsResult.Item?.maxVideoSize as number) ?? DEFAULT_MAX_VIDEO_SIZE,
        maxImages: (settingsResult.Item?.maxImages as number) ?? DEFAULT_MAX_IMAGES,
        allowedFormats: [...ALLOWED_MEDIA_TYPES],
      }

      return createSuccessResponse(
        200,
        {
          images,
          total: images.length,
          settings,
          remainingSlots: settings.maxImages - images.length,
        },
        context
      )
    }

    // Public response
    return createSuccessResponse(
      200,
      {
        images,
        total: images.length,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /images',
        operation: 'listImages',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to list images', context, 'DB_ERROR')
  }
}
