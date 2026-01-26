/**
 * Update Hero Background Settings Endpoint (Admin)
 *
 * Updates hero background settings (overlay, media type, upload mode).
 * Route: PUT /admin/w/{weddingId}/hero-background
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { validateHeroBackgroundUpdate } from '../shared/hero-background-validation'
import { OVERLAY_DEFAULT_OPACITY } from '../shared/hero-background-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

// Default hero background settings
const DEFAULT_OVERLAY = {
  enabled: true,
  color: 'black' as const,
  opacity: OVERLAY_DEFAULT_OPACITY,
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

    const validation = validateHeroBackgroundUpdate(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Get Current Settings
    // ============================================
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'HERO_BACKGROUND'),
      })
    )

    const currentSettings = currentResult.Item ?? {}
    const now = new Date().toISOString()

    // ============================================
    // 6. Merge Settings
    // ============================================
    const newOverlay = validation.data.overlay
      ? {
          enabled: validation.data.overlay.enabled ?? currentSettings.overlay?.enabled ?? true,
          color: validation.data.overlay.color ?? currentSettings.overlay?.color ?? 'black',
          opacity:
            validation.data.overlay.opacity ??
            currentSettings.overlay?.opacity ??
            OVERLAY_DEFAULT_OPACITY,
        }
      : (currentSettings.overlay ?? DEFAULT_OVERLAY)

    const updatedSettings = {
      ...Keys.settings(weddingId, 'HERO_BACKGROUND'),
      mediaType: validation.data.mediaType ?? currentSettings.mediaType ?? 'none',
      uploadMode: validation.data.uploadMode ?? currentSettings.uploadMode ?? 'separate',
      // Preserve existing media items
      ...(currentSettings.desktop && { desktop: currentSettings.desktop }),
      ...(currentSettings.mobile && { mobile: currentSettings.mobile }),
      ...(currentSettings.universal && { universal: currentSettings.universal }),
      overlay: newOverlay,
      ...(validation.data.posterUrl !== undefined
        ? validation.data.posterUrl
          ? { posterUrl: validation.data.posterUrl }
          : {}
        : currentSettings.posterUrl
          ? { posterUrl: currentSettings.posterUrl }
          : {}),
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    // ============================================
    // 7. Save Settings
    // ============================================
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedSettings,
      })
    )

    // Build response
    const response = {
      mediaType: updatedSettings.mediaType,
      uploadMode: updatedSettings.uploadMode,
      ...(updatedSettings.desktop && { desktop: updatedSettings.desktop }),
      ...(updatedSettings.mobile && { mobile: updatedSettings.mobile }),
      ...(updatedSettings.universal && { universal: updatedSettings.universal }),
      overlay: updatedSettings.overlay,
      ...(updatedSettings.posterUrl && { posterUrl: updatedSettings.posterUrl }),
      updatedAt: updatedSettings.updatedAt,
      updatedBy: updatedSettings.updatedBy,
    }

    return createSuccessResponse(200, { heroBackground: response }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/hero-background',
        operation: 'updateHeroBackground',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(
      500,
      'Failed to update hero background settings',
      context,
      'DB_ERROR'
    )
  }
}
