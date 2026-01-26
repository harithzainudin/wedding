/**
 * Get Hero Background Endpoint (Public)
 *
 * Fetches hero background settings for a specific wedding.
 * Route: GET /{weddingSlug}/hero-background
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { resolveWeddingSlug, requireActiveWedding } from '../shared/wedding-middleware'
import { OVERLAY_DEFAULT_OPACITY } from '../shared/hero-background-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Default hero background settings
const DEFAULT_HERO_BACKGROUND_SETTINGS = {
  mediaType: 'none' as const,
  uploadMode: 'separate' as const,
  overlay: {
    enabled: true,
    color: 'black' as const,
    opacity: OVERLAY_DEFAULT_OPACITY,
  },
}

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
    // 3. Fetch Hero Background Settings
    // ============================================
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'HERO_BACKGROUND'),
        ConsistentRead: true,
      })
    )

    if (!result.Item) {
      // Return default settings if none exists in database
      return createSuccessResponse(
        200,
        { heroBackground: DEFAULT_HERO_BACKGROUND_SETTINGS },
        context
      )
    }

    // Build response with stored data
    const settings = {
      mediaType: result.Item.mediaType ?? 'none',
      uploadMode: result.Item.uploadMode ?? 'separate',
      ...(result.Item.desktop && { desktop: result.Item.desktop }),
      ...(result.Item.mobile && { mobile: result.Item.mobile }),
      ...(result.Item.universal && { universal: result.Item.universal }),
      overlay: result.Item.overlay ?? DEFAULT_HERO_BACKGROUND_SETTINGS.overlay,
      ...(result.Item.posterUrl && { posterUrl: result.Item.posterUrl }),
      ...(result.Item.updatedAt && { updatedAt: result.Item.updatedAt }),
      ...(result.Item.updatedBy && { updatedBy: result.Item.updatedBy }),
    }

    return createSuccessResponse(200, { heroBackground: settings }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /{weddingSlug}/hero-background',
        operation: 'fetchHeroBackground',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch hero background settings', context, 'DB_ERROR')
  }
}
