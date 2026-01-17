/**
 * Reorder Parking Images Endpoint (Admin)
 *
 * Reorders parking images by updating their order values.
 * Route: PUT /admin/w/{weddingId}/parking/reorder
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, TransactWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateParkingReorderRequest } from '../shared/parking-validation'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let imageIds: string[] | undefined

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
    // 3b. Check Wedding Status (block archived for non-super admins)
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

    const validation = validateParkingReorderRequest(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    imageIds = validation.data.imageIds

    // ============================================
    // 5. Get All Current Parking Images
    // ============================================
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#PARKING` },
      })
    )

    const existingImages = queryResult.Items ?? []
    const existingIds = new Set(existingImages.map((item) => item.id as string))

    // Validate all provided IDs exist
    for (const id of imageIds) {
      if (!existingIds.has(id)) {
        return createErrorResponse(
          400,
          `Parking image with ID ${id} not found`,
          context,
          'NOT_FOUND'
        )
      }
    }

    // Ensure all images are included
    if (imageIds.length !== existingImages.length) {
      return createErrorResponse(
        400,
        'All parking image IDs must be included in the reorder request',
        context,
        'VALIDATION_ERROR'
      )
    }

    // ============================================
    // 6. Update Order Atomically
    // ============================================
    const transactItems = imageIds.map((id, index) => {
      const parkingKeys = Keys.parking(weddingId, id)
      const newOrder = index + 1
      const gsiKeys = Keys.gsi.weddingParking(weddingId, newOrder, id)

      return {
        Update: {
          TableName: Resource.AppDataTable.name,
          Key: parkingKeys,
          UpdateExpression: 'SET #order = :order, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk',
          ExpressionAttributeNames: { '#order': 'order' },
          ExpressionAttributeValues: {
            ':order': newOrder,
            ':gsi1pk': gsiKeys.gsi1pk,
            ':gsi1sk': gsiKeys.gsi1sk,
          },
        },
      }
    })

    await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }))

    return createSuccessResponse(
      200,
      {
        message: 'Parking images reordered successfully',
        newOrder: imageIds,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/parking/reorder',
        operation: 'reorderParkingImages',
        requestId: context.awsRequestId,
        input: { imageCount: imageIds?.length },
      },
      error
    )
    return createErrorResponse(500, 'Failed to reorder parking images', context, 'DB_ERROR')
  }
}
