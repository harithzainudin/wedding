/**
 * Get Hero Background Admin Endpoint
 *
 * Fetches hero background settings for admin management.
 * Route: GET /admin/w/{weddingId}/hero-background
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import {
  OVERLAY_DEFAULT_OPACITY,
  HERO_IMAGE_DEFAULT_MAX_SIZE,
  HERO_VIDEO_DEFAULT_MAX_SIZE,
} from '../shared/hero-background-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Default hero background settings
const DEFAULT_HERO_BACKGROUND_SETTINGS = {
  mediaType: 'none' as const,
  uploadMode: 'single' as const,
  overlay: {
    enabled: true,
    color: 'black' as const,
    opacity: OVERLAY_DEFAULT_OPACITY,
  },
  maxImageSize: HERO_IMAGE_DEFAULT_MAX_SIZE,
  maxVideoSize: HERO_VIDEO_DEFAULT_MAX_SIZE,
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
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
    // 3b. Check Wedding Status (Archived Check)
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
    // 4. Fetch Hero Background Settings
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
      uploadMode: result.Item.uploadMode ?? 'single',
      ...(result.Item.desktop && { desktop: result.Item.desktop }),
      ...(result.Item.mobile && { mobile: result.Item.mobile }),
      ...(result.Item.universal && { universal: result.Item.universal }),
      overlay: result.Item.overlay ?? DEFAULT_HERO_BACKGROUND_SETTINGS.overlay,
      ...(result.Item.posterUrl && { posterUrl: result.Item.posterUrl }),
      maxImageSize: result.Item.maxImageSize ?? HERO_IMAGE_DEFAULT_MAX_SIZE,
      maxVideoSize: result.Item.maxVideoSize ?? HERO_VIDEO_DEFAULT_MAX_SIZE,
      ...(result.Item.updatedAt && { updatedAt: result.Item.updatedAt }),
      ...(result.Item.updatedBy && { updatedBy: result.Item.updatedBy }),
    }

    return createSuccessResponse(200, { heroBackground: settings }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /admin/w/{weddingId}/hero-background',
        operation: 'fetchHeroBackgroundAdmin',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch hero background settings', context, 'DB_ERROR')
  }
}
