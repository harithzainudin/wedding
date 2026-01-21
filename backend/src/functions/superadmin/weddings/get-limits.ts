/**
 * Get Wedding Limits Endpoint (Super Admin Only)
 *
 * Returns combined gallery and gift limit settings for a wedding.
 * Route: GET /superadmin/weddings/{weddingId}/limits
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId } from '../../shared/validation'
import { getWeddingById } from '../../shared/wedding-middleware'
import { Resource } from 'sst'
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_IMAGES,
  ALLOWED_MIME_TYPES,
} from '../../shared/image-constants'
import { GIFT_LIMITS } from '../../shared/gift-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface WeddingLimits {
  gallery: {
    maxFileSize: number
    maxImages: number
    allowedFormats: readonly string[]
  }
  gifts: {
    maxItems: number
    maxFileSize: number
    allowedFormats: readonly string[]
  }
  updatedAt?: string
  updatedBy?: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Extract and Validate Wedding ID
    // ============================================
    const weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 3. Verify Wedding Exists
    // ============================================
    const wedding = await getWeddingById(docClient, weddingId)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // ============================================
    // 4. Fetch Gallery and Gift Settings
    // ============================================
    const [galleryResult, giftResult] = await Promise.all([
      docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: Keys.settings(weddingId, 'IMAGES'),
          ConsistentRead: true,
        })
      ),
      docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: Keys.settings(weddingId, 'GIFTS'),
          ConsistentRead: true,
        })
      ),
    ])

    // ============================================
    // 5. Build Response with Defaults
    // ============================================
    const gallerySettings = galleryResult.Item
    const giftSettings = giftResult.Item

    // Determine most recent update
    const galleryUpdatedAt = gallerySettings?.updatedAt as string | undefined
    const giftUpdatedAt = giftSettings?.updatedAt as string | undefined
    let updatedAt: string | undefined
    let updatedBy: string | undefined

    if (galleryUpdatedAt && giftUpdatedAt) {
      if (galleryUpdatedAt > giftUpdatedAt) {
        updatedAt = galleryUpdatedAt
        updatedBy = gallerySettings?.updatedBy as string | undefined
      } else {
        updatedAt = giftUpdatedAt
        updatedBy = giftSettings?.updatedBy as string | undefined
      }
    } else if (galleryUpdatedAt) {
      updatedAt = galleryUpdatedAt
      updatedBy = gallerySettings?.updatedBy as string | undefined
    } else if (giftUpdatedAt) {
      updatedAt = giftUpdatedAt
      updatedBy = giftSettings?.updatedBy as string | undefined
    }

    const limits: WeddingLimits = {
      gallery: {
        maxFileSize: (gallerySettings?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
        maxImages: (gallerySettings?.maxImages as number) ?? DEFAULT_MAX_IMAGES,
        allowedFormats: (gallerySettings?.allowedFormats as string[]) ?? ALLOWED_MIME_TYPES,
      },
      gifts: {
        maxItems: (giftSettings?.maxItems as number) ?? GIFT_LIMITS.maxItems,
        maxFileSize: (giftSettings?.maxFileSize as number) ?? GIFT_LIMITS.maxFileSize,
        allowedFormats: (giftSettings?.allowedFormats as string[]) ?? GIFT_LIMITS.allowedFormats,
      },
      ...(updatedAt && { updatedAt }),
      ...(updatedBy && { updatedBy }),
    }

    return createSuccessResponse(200, limits, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /superadmin/weddings/{weddingId}/limits',
        operation: 'get-wedding-limits',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
