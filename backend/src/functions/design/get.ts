/**
 * Get Design Endpoint (Public)
 *
 * Fetches design/layout settings for a specific wedding.
 * Route: GET /{weddingSlug}/design
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { DEFAULT_DESIGN_SETTINGS, type DesignSettings } from '../shared/design-constants'
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
    // 3. Fetch Design Settings
    // ============================================
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'DESIGN'),
        ConsistentRead: true,
      })
    )

    if (!result.Item) {
      // Return default design settings if none exists in database
      return createSuccessResponse(200, DEFAULT_DESIGN_SETTINGS, context)
    }

    const designSettings: DesignSettings = {
      layoutId: result.Item.layoutId,
      animationSpeed: result.Item.animationSpeed,
      sections: result.Item.sections,
      invitationCard: result.Item.invitationCard,
      pageSlideshow: result.Item.pageSlideshow,
      storybook: result.Item.storybook,
      backgroundFeatures:
        result.Item.backgroundFeatures ?? DEFAULT_DESIGN_SETTINGS.backgroundFeatures,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    }

    return createSuccessResponse(200, designSettings, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /{weddingSlug}/design',
        operation: 'fetchDesign',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch design settings', context, 'DB_ERROR')
  }
}
