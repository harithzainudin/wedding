/**
 * GET /admin/w/{weddingId}/gifts/settings
 * Admin endpoint to get gift settings
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { GIFT_LIMITS } from '../shared/gift-validation'
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

    // Get gift settings using wedding-scoped key
    const settingsKey = Keys.settings(weddingId, 'GIFTS')
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
        ConsistentRead: true,
      })
    )

    const settings: GiftSettings = result.Item
      ? {
          enabled: result.Item.enabled ?? DEFAULT_SETTINGS.enabled,
          maxItems: result.Item.maxItems ?? DEFAULT_SETTINGS.maxItems,
          maxFileSize: result.Item.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFormats: result.Item.allowedFormats ?? DEFAULT_SETTINGS.allowedFormats,
          updatedAt: result.Item.updatedAt as string | undefined,
          updatedBy: result.Item.updatedBy as string | undefined,
        }
      : DEFAULT_SETTINGS

    return createSuccessResponse(200, settings, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /admin/w/{weddingId}/gifts/settings',
        operation: 'getGiftSettings',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
