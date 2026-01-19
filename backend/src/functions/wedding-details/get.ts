/**
 * Get Wedding Details Endpoint (Public)
 *
 * Fetches wedding details for a specific wedding.
 * Route: GET /{weddingSlug}/wedding-details
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { DEFAULT_WEDDING_DETAILS, type WeddingDetailsData } from '../shared/wedding-validation'
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
    // 3. Fetch Wedding Details
    // ============================================
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'WEDDING_DETAILS'),
        ConsistentRead: true,
      })
    )

    if (!result.Item) {
      // Return default wedding details if none exists in database
      return createSuccessResponse(200, DEFAULT_WEDDING_DETAILS, context)
    }

    const weddingData: WeddingDetailsData = {
      couple: result.Item.couple,
      parents: result.Item.parents,
      parentsVisibility: result.Item.parentsVisibility,
      eventDate: result.Item.eventDate,
      eventEndTime: result.Item.eventEndTime,
      eventDisplayFormat: result.Item.eventDisplayFormat,
      displayNameOrder: result.Item.displayNameOrder,
      bismillahCalligraphy: result.Item.bismillahCalligraphy,
      dressCode: result.Item.dressCode,
      hashtag: result.Item.hashtag,
      showDressCode: result.Item.showDressCode,
      showHashtag: result.Item.showHashtag,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    }

    return createSuccessResponse(200, weddingData, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /{weddingSlug}/wedding-details',
        operation: 'fetchWeddingDetails',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch wedding details', context, 'DB_ERROR')
  }
}
