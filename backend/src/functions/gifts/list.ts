/**
 * List Gifts Endpoint
 *
 * Public Route: GET /{weddingSlug}/gifts
 * Admin Route: GET /admin/w/{weddingId}/gifts
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import {
  resolveWeddingSlug,
  requireActiveWedding,
  getWeddingById,
} from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import type { MultilingualText, GiftCategory, GiftPriority } from '../shared/gift-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface GiftItem {
  id: string
  name: MultilingualText
  description: MultilingualText
  imageUrl?: string
  externalLink: string
  priceRange: string
  category: GiftCategory
  priority: GiftPriority
  notes?: string
  quantityTotal: number
  quantityReserved: number
  order: number
  createdAt: string
}

interface GiftSettings {
  enabled: boolean
  maxItems: number
  maxFileSize: number
  allowedFormats: string[]
}

const DEFAULT_SETTINGS: GiftSettings = {
  enabled: false,
  maxItems: 50,
  maxFileSize: 5 * 1024 * 1024,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    let weddingId: string
    let isAuthenticated = false

    // ============================================
    // Determine route type and extract wedding context
    // ============================================

    if (event.pathParameters?.weddingId) {
      // Admin route: /admin/w/{weddingId}/gifts
      weddingId = event.pathParameters.weddingId

      if (!isValidWeddingId(weddingId)) {
        return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
      }

      const authResult = requireWeddingAccess(event, weddingId)
      if (!authResult.authenticated) {
        return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
      }

      const wedding = await getWeddingById(docClient, weddingId)
      if (!wedding) {
        return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
      }

      isAuthenticated = true
    } else if (event.pathParameters?.weddingSlug) {
      // Public route: /{weddingSlug}/gifts
      const weddingSlug = event.pathParameters.weddingSlug
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
      weddingId = weddingCheck.wedding.weddingId
    } else {
      return createErrorResponse(400, 'Wedding identifier is required', context, 'MISSING_WEDDING')
    }

    // Get gift settings to check if feature is enabled
    const settingsKey = Keys.settings(weddingId, 'GIFTS')
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const settings: GiftSettings = settingsResult.Item
      ? {
          enabled: settingsResult.Item.enabled ?? DEFAULT_SETTINGS.enabled,
          maxItems: settingsResult.Item.maxItems ?? DEFAULT_SETTINGS.maxItems,
          maxFileSize: settingsResult.Item.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFormats: settingsResult.Item.allowedFormats ?? DEFAULT_SETTINGS.allowedFormats,
        }
      : DEFAULT_SETTINGS

    // If feature is disabled and not admin, return empty list
    if (!settings.enabled && !isAuthenticated) {
      return createSuccessResponse(
        200,
        {
          gifts: [],
          total: 0,
          enabled: false,
        },
        context
      )
    }

    // Query all gifts for this wedding using GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `WEDDING#${weddingId}#GIFTS`,
        },
      })
    )

    const gifts: GiftItem[] = (result.Items ?? [])
      .map((item) => ({
        id: item.id as string,
        name: item.name as MultilingualText,
        description: item.description as MultilingualText,
        imageUrl: item.imageUrl as string | undefined,
        externalLink: item.externalLink as string,
        priceRange: item.priceRange as string,
        category: item.category as GiftCategory,
        priority: item.priority as GiftPriority,
        notes: item.notes as string | undefined,
        quantityTotal: item.quantityTotal as number,
        quantityReserved: item.quantityReserved as number,
        order: item.order as number,
        createdAt: item.createdAt as string,
      }))
      .sort((a, b) => a.order - b.order)

    // Return response with settings for admin users
    if (isAuthenticated) {
      return createSuccessResponse(
        200,
        {
          gifts,
          total: gifts.length,
          enabled: settings.enabled,
          settings,
        },
        context
      )
    }

    return createSuccessResponse(
      200,
      {
        gifts,
        total: gifts.length,
        enabled: settings.enabled,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /gifts',
        operation: 'listGifts',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
