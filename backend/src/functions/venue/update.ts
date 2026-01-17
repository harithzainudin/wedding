/**
 * Update Venue Endpoint (Admin)
 *
 * Updates venue data for a specific wedding.
 * Route: PUT /admin/w/{weddingId}/venue
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
import {
  validateVenueUpdate,
  generateGoogleMapsUrl,
  generateWazeUrl,
  type VenueData,
} from '../shared/venue-validation'
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
  // 3. Verify Wedding Exists and is Accessible
  // ============================================
  const wedding = await getWeddingById(docClient, weddingId)
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

  const validation = validateVenueUpdate(body)
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
  }

  // ============================================
  // 5. Update Venue
  // ============================================
  try {
    const now = new Date().toISOString()
    const { lat, lng } = validation.data.coordinates

    const venueItem = {
      ...Keys.settings(weddingId, 'VENUE'),
      venueName: validation.data.venueName,
      address: validation.data.address,
      coordinates: validation.data.coordinates,
      parkingInfo: validation.data.parkingInfo ?? null,
      parkingSteps: validation.data.parkingSteps ?? [],
      parkingVideoUrl: validation.data.parkingVideoUrl ?? null,
      showParkingImages: validation.data.showParkingImages ?? true,
      showParkingDirections: validation.data.showParkingDirections ?? true,
      showParkingVideo: validation.data.showParkingVideo ?? true,
      googleMapsUrl: generateGoogleMapsUrl(lat, lng),
      wazeUrl: generateWazeUrl(lat, lng),
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: venueItem,
      })
    )

    const responseData: VenueData = {
      venueName: venueItem.venueName,
      address: venueItem.address,
      coordinates: venueItem.coordinates,
      parkingInfo: venueItem.parkingInfo,
      parkingSteps: venueItem.parkingSteps,
      parkingVideoUrl: venueItem.parkingVideoUrl,
      showParkingImages: venueItem.showParkingImages,
      showParkingDirections: venueItem.showParkingDirections,
      showParkingVideo: venueItem.showParkingVideo,
      googleMapsUrl: venueItem.googleMapsUrl,
      wazeUrl: venueItem.wazeUrl,
      updatedAt: venueItem.updatedAt,
      updatedBy: venueItem.updatedBy,
    }

    return createSuccessResponse(200, responseData, context)
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/venue',
        operation: 'updateVenue',
        requestId: context.awsRequestId,
        input: { weddingId, venueName: validation.data.venueName },
      },
      error
    )
    return createErrorResponse(500, 'Failed to update venue data', context, 'DB_ERROR')
  }
}
