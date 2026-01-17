/**
 * Reorder Music Tracks Endpoint (Admin)
 *
 * Updates the order of music tracks in the playlist.
 * Route: PUT /admin/w/{weddingId}/music/reorder
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateReorderRequest } from '../shared/music-validation'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let trackIds: string[] | undefined

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

    const validation = validateReorderRequest(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    trackIds = validation.data.trackIds

    // ============================================
    // 5. Verify All Tracks Exist
    // ============================================
    for (const trackId of trackIds) {
      const trackKeys = Keys.music(weddingId, trackId)
      const result = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: trackKeys,
        })
      )

      if (!result.Item) {
        return createErrorResponse(404, `Track not found: ${trackId}`, context, 'NOT_FOUND')
      }
    }

    // ============================================
    // 6. Update Order for Each Track
    // ============================================
    for (let i = 0; i < trackIds.length; i++) {
      const trackId = trackIds[i]!
      const order = i
      const paddedOrder = order.toString().padStart(4, '0')
      const trackKeys = Keys.music(weddingId, trackId)

      await docClient.send(
        new UpdateCommand({
          TableName: Resource.AppDataTable.name,
          Key: trackKeys,
          UpdateExpression: 'SET #order = :order, gsi1sk = :gsi1sk',
          ExpressionAttributeNames: {
            '#order': 'order',
          },
          ExpressionAttributeValues: {
            ':order': order,
            ':gsi1sk': `${paddedOrder}#${trackId}`,
          },
        })
      )
    }

    return createSuccessResponse(
      200,
      {
        message: 'Tracks reordered successfully',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/music/reorder',
        operation: 'reorderTracks',
        requestId: context.awsRequestId,
        input: { trackCount: trackIds?.length },
      },
      error
    )
    return createErrorResponse(500, 'Failed to reorder tracks', context, 'DB_ERROR')
  }
}
