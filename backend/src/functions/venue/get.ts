/**
 * Get Venue Endpoint (Public)
 *
 * Fetches venue data for a specific wedding.
 * Route: GET /{weddingSlug}/venue
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { DEFAULT_VENUE, type VenueData } from '../shared/venue-validation'
import { Keys } from '../shared/keys'
import { resolveWeddingSlug, requireActiveWedding } from '../shared/wedding-middleware'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Extract and Validate Wedding Slug
    // ============================================
    const weddingSlug = event.pathParameters?.weddingSlug
    if (!weddingSlug) {
      return createErrorResponse(400, 'Wedding slug is required', context, 'MISSING_SLUG')
    }

    // ============================================
    // 2. Resolve Slug to Wedding
    // ============================================
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

    const { weddingId } = weddingCheck.wedding

    // ============================================
    // 3. Fetch Venue Data
    // ============================================
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'VENUE'),
        ConsistentRead: true,
      })
    )

    if (!result.Item) {
      // Return default venue if none exists in database
      return createSuccessResponse(200, DEFAULT_VENUE, context)
    }

    const venueData: VenueData = {
      venueName: result.Item.venueName,
      address: result.Item.address,
      coordinates: result.Item.coordinates,
      parkingInfo: result.Item.parkingInfo ?? null,
      parkingSteps: result.Item.parkingSteps ?? [],
      parkingVideoUrl: result.Item.parkingVideoUrl ?? null,
      showParkingImages: result.Item.showParkingImages ?? true,
      showParkingDirections: result.Item.showParkingDirections ?? true,
      showParkingVideo: result.Item.showParkingVideo ?? true,
      googleMapsUrl: result.Item.googleMapsUrl,
      wazeUrl: result.Item.wazeUrl,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    }

    return createSuccessResponse(200, venueData, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /{weddingSlug}/venue',
        operation: 'fetchVenue',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch venue data', context, 'DB_ERROR')
  }
}
