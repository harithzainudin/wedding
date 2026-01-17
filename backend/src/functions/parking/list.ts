/**
 * List Parking Images Endpoint
 *
 * Public: Returns parking images for a wedding
 * Admin: Returns full data with settings
 *
 * Public Route: GET /{weddingSlug}/parking
 * Admin Route: GET /admin/w/{weddingId}/parking
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
import { MAX_PARKING_IMAGES } from '../shared/parking-constants'

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
      // Admin route: /admin/w/{weddingId}/parking
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

      // Check wedding status (block archived for non-super admins)
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
      // Public route: /{weddingSlug}/parking
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

    // Query all parking images for this wedding ordered by gsi1sk
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#PARKING` },
        ScanIndexForward: true, // Ascending order
      })
    )

    const images = (result.Items ?? []).map((item) => ({
      id: item.id as string,
      filename: item.filename as string,
      s3Key: item.s3Key as string,
      mimeType: item.mimeType as string,
      fileSize: item.fileSize as number,
      caption: (item.caption as string) || undefined,
      order: item.order as number,
      uploadedAt: item.uploadedAt as string,
      uploadedBy: item.uploadedBy as string,
      url: getPublicS3Url(bucketName, region, item.s3Key as string),
    }))

    // Get parking settings
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'PARKING'),
      })
    )

    const showParking = (settingsResult.Item?.showParking as boolean) ?? true

    if (isAuthenticated) {
      const settings = {
        maxImages: (settingsResult.Item?.maxImages as number) ?? MAX_PARKING_IMAGES,
        showParking,
      }

      return createSuccessResponse(
        200,
        {
          images,
          total: images.length,
          settings,
          maxImages: settings.maxImages,
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
        showParking,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /parking',
        operation: 'listParkingImages',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to list parking images', context, 'DB_ERROR')
  }
}
