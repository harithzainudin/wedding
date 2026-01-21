/**
 * PUT /admin/w/{weddingId}/gifts/settings
 * Admin endpoint to update gift settings
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateGiftSettingsInput, GIFT_LIMITS } from '../shared/gift-validation'
import { Keys } from '../shared/keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface GiftSettings {
  enabled: boolean
  maxItems: number
  maxFileSize: number
  allowedFormats: string[]
  updatedAt?: string
  updatedBy?: string
}

const DEFAULT_SETTINGS: GiftSettings = {
  enabled: false,
  maxItems: GIFT_LIMITS.maxItems,
  maxFileSize: GIFT_LIMITS.maxFileSize,
  allowedFormats: GIFT_LIMITS.allowedFormats,
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let weddingId: string | undefined

  try {
    // Get weddingId from path parameters
    weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    // Validate wedding ID format
    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // Require authentication and wedding access
    const authResult = requireWeddingAccess(event, weddingId)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // Verify wedding exists
    const wedding = await getWeddingById(docClient, weddingId)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // Check wedding status (block archived for non-super admins)
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

    // Parse request body
    let body: unknown
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', context, 'INVALID_JSON')
    }

    // Validate input
    const validation = validateGiftSettingsInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation

    // Get current settings using wedding-scoped key
    const settingsKey = Keys.settings(weddingId, 'GIFTS')
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const currentSettings: GiftSettings = currentResult.Item
      ? {
          enabled: currentResult.Item.enabled ?? DEFAULT_SETTINGS.enabled,
          maxItems: currentResult.Item.maxItems ?? DEFAULT_SETTINGS.maxItems,
          maxFileSize: currentResult.Item.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFormats: currentResult.Item.allowedFormats ?? DEFAULT_SETTINGS.allowedFormats,
        }
      : DEFAULT_SETTINGS

    // Merge with updated values
    // Non-super admins can only update enabled (visibility toggle)
    // Limit settings (maxItems, maxFileSize, allowedFormats) are managed by super admin
    const timestamp = new Date().toISOString()
    const updatedSettings = {
      ...settingsKey,
      weddingId,
      enabled: data.enabled ?? currentSettings.enabled,
      maxItems: isSuperAdmin ? (data.maxItems ?? currentSettings.maxItems) : currentSettings.maxItems,
      maxFileSize: isSuperAdmin
        ? (data.maxFileSize ?? currentSettings.maxFileSize)
        : currentSettings.maxFileSize,
      allowedFormats: isSuperAdmin
        ? (data.allowedFormats ?? currentSettings.allowedFormats)
        : currentSettings.allowedFormats,
      updatedAt: timestamp,
      updatedBy: authResult.user.username,
    }

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedSettings,
      })
    )

    return createSuccessResponse(
      200,
      {
        enabled: updatedSettings.enabled,
        maxItems: updatedSettings.maxItems,
        maxFileSize: updatedSettings.maxFileSize,
        allowedFormats: updatedSettings.allowedFormats,
        updatedAt: updatedSettings.updatedAt,
        updatedBy: updatedSettings.updatedBy,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/gifts/settings',
        operation: 'updateGiftSettings',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
