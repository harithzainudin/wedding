/**
 * Update Wedding Details Endpoint (Admin)
 *
 * Updates wedding details for a specific wedding.
 * Route: PUT /admin/w/{weddingId}/wedding-details
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateWeddingDetailsUpdate, type WeddingDetailsData } from '../shared/wedding-validation'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
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
    return createErrorResponse(accessCheck.statusCode, accessCheck.error, context, 'ACCESS_DENIED')
  }

  // ============================================
  // 4. Validate Request Body
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

  const validation = validateWeddingDetailsUpdate(body)
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
  }

  // ============================================
  // 5. Update Wedding Details
  // ============================================
  try {
    const now = new Date().toISOString()

    // Build base item with required fields
    const weddingItem: Record<string, unknown> = {
      ...Keys.settings(weddingId, 'WEDDING_DETAILS'),
      couple: validation.data.couple,
      parents: validation.data.parents,
      eventDate: validation.data.eventDate,
      dressCode: validation.data.dressCode,
      hashtag: validation.data.hashtag,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    // Only add optional fields if they have values (DynamoDB doesn't accept undefined)
    if (validation.data.eventEndTime) {
      weddingItem.eventEndTime = validation.data.eventEndTime
    }
    if (validation.data.eventDisplayFormat) {
      weddingItem.eventDisplayFormat = validation.data.eventDisplayFormat
    }
    if (validation.data.displayNameOrder) {
      weddingItem.displayNameOrder = validation.data.displayNameOrder
    }
    if (validation.data.bismillahCalligraphy) {
      weddingItem.bismillahCalligraphy = validation.data.bismillahCalligraphy
    }
    if (validation.data.parentsVisibility) {
      weddingItem.parentsVisibility = validation.data.parentsVisibility
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: weddingItem,
      })
    )

    const responseData: WeddingDetailsData = {
      couple: weddingItem.couple as WeddingDetailsData['couple'],
      parents: weddingItem.parents as WeddingDetailsData['parents'],
      parentsVisibility: weddingItem.parentsVisibility as WeddingDetailsData['parentsVisibility'],
      eventDate: weddingItem.eventDate as string,
      eventEndTime: weddingItem.eventEndTime as string | undefined,
      eventDisplayFormat:
        weddingItem.eventDisplayFormat as WeddingDetailsData['eventDisplayFormat'],
      displayNameOrder: weddingItem.displayNameOrder as WeddingDetailsData['displayNameOrder'],
      bismillahCalligraphy:
        weddingItem.bismillahCalligraphy as WeddingDetailsData['bismillahCalligraphy'],
      dressCode: weddingItem.dressCode as string,
      hashtag: weddingItem.hashtag as string,
      updatedAt: weddingItem.updatedAt as string,
      updatedBy: weddingItem.updatedBy as string,
    }

    return createSuccessResponse(200, responseData, context)
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/wedding-details',
        operation: 'updateWeddingDetails',
        requestId: context.awsRequestId,
        input: { weddingId, eventDate: validation.data.eventDate },
      },
      error
    )
    return createErrorResponse(500, 'Failed to update wedding details', context, 'DB_ERROR')
  }
}
