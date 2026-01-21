/**
 * Update Wedding Limits Endpoint (Super Admin Only)
 *
 * Updates gallery and gift limit settings for a wedding.
 * Route: PUT /superadmin/weddings/{weddingId}/limits
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
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
  DEFAULT_SHOW_GALLERY,
  ALLOWED_MIME_TYPES,
} from '../../shared/image-constants'
import { GIFT_LIMITS } from '../../shared/gift-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

interface UpdateLimitsInput {
  gallery?: {
    maxFileSize?: number
    maxImages?: number
  }
  gifts?: {
    maxItems?: number
    maxFileSize?: number
  }
}

interface ValidationResult {
  valid: true
  data: UpdateLimitsInput
}

interface ValidationError {
  valid: false
  error: string
}

function validateUpdateLimitsInput(input: unknown): ValidationResult | ValidationError {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const data: UpdateLimitsInput = {}

  // Validate gallery limits
  if (body.gallery !== undefined) {
    if (typeof body.gallery !== 'object' || body.gallery === null) {
      return { valid: false, error: 'Gallery must be an object' }
    }

    const gallery = body.gallery as Record<string, unknown>
    data.gallery = {}

    // Validate maxFileSize (1MB to 50MB)
    if (gallery.maxFileSize !== undefined) {
      const maxFileSize = Number(gallery.maxFileSize)
      if (isNaN(maxFileSize) || maxFileSize < 1024 * 1024 || maxFileSize > 50 * 1024 * 1024) {
        return { valid: false, error: 'Gallery max file size must be between 1MB and 50MB' }
      }
      data.gallery.maxFileSize = maxFileSize
    }

    // Validate maxImages (10 to 200)
    if (gallery.maxImages !== undefined) {
      const maxImages = Number(gallery.maxImages)
      if (isNaN(maxImages) || maxImages < 10 || maxImages > 200) {
        return { valid: false, error: 'Gallery max images must be between 10 and 200' }
      }
      data.gallery.maxImages = maxImages
    }
  }

  // Validate gifts limits
  if (body.gifts !== undefined) {
    if (typeof body.gifts !== 'object' || body.gifts === null) {
      return { valid: false, error: 'Gifts must be an object' }
    }

    const gifts = body.gifts as Record<string, unknown>
    data.gifts = {}

    // Validate maxItems (1 to 100)
    if (gifts.maxItems !== undefined) {
      const maxItems = Number(gifts.maxItems)
      if (isNaN(maxItems) || maxItems < 1 || maxItems > 100) {
        return { valid: false, error: 'Gift max items must be between 1 and 100' }
      }
      data.gifts.maxItems = maxItems
    }

    // Validate maxFileSize (1MB to 10MB)
    if (gifts.maxFileSize !== undefined) {
      const maxFileSize = Number(gifts.maxFileSize)
      if (isNaN(maxFileSize) || maxFileSize < 1024 * 1024 || maxFileSize > 10 * 1024 * 1024) {
        return { valid: false, error: 'Gift max file size must be between 1MB and 10MB' }
      }
      data.gifts.maxFileSize = maxFileSize
    }
  }

  // At least one setting must be provided
  if (!data.gallery && !data.gifts) {
    return { valid: false, error: 'At least one limit setting must be provided' }
  }

  return { valid: true, data }
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

    const validation = validateUpdateLimitsInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const now = new Date().toISOString()
    const username = authResult.user.username

    // ============================================
    // 5. Update Gallery Settings if Provided
    // ============================================
    let gallerySettings: Record<string, unknown> | undefined
    if (validation.data.gallery) {
      const galleryKey = Keys.settings(weddingId, 'IMAGES')
      const currentGallery = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: galleryKey,
        })
      )

      const newGallerySettings = {
        ...galleryKey,
        maxFileSize:
          validation.data.gallery.maxFileSize ??
          currentGallery.Item?.maxFileSize ??
          DEFAULT_MAX_FILE_SIZE,
        maxImages:
          validation.data.gallery.maxImages ??
          currentGallery.Item?.maxImages ??
          DEFAULT_MAX_IMAGES,
        allowedFormats: currentGallery.Item?.allowedFormats ?? [...ALLOWED_MIME_TYPES],
        showGallery: currentGallery.Item?.showGallery ?? DEFAULT_SHOW_GALLERY,
        updatedAt: now,
        updatedBy: username,
      }

      await docClient.send(
        new PutCommand({
          TableName: Resource.AppDataTable.name,
          Item: newGallerySettings,
        })
      )

      gallerySettings = {
        maxFileSize: newGallerySettings.maxFileSize,
        maxImages: newGallerySettings.maxImages,
        allowedFormats: newGallerySettings.allowedFormats,
      }
    }

    // ============================================
    // 6. Update Gift Settings if Provided
    // ============================================
    let giftSettings: Record<string, unknown> | undefined
    if (validation.data.gifts) {
      const giftKey = Keys.settings(weddingId, 'GIFTS')
      const currentGift = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: giftKey,
        })
      )

      const newGiftSettings = {
        ...giftKey,
        enabled: currentGift.Item?.enabled ?? false,
        maxItems:
          validation.data.gifts.maxItems ?? currentGift.Item?.maxItems ?? GIFT_LIMITS.maxItems,
        maxFileSize:
          validation.data.gifts.maxFileSize ??
          currentGift.Item?.maxFileSize ??
          GIFT_LIMITS.maxFileSize,
        allowedFormats: currentGift.Item?.allowedFormats ?? GIFT_LIMITS.allowedFormats,
        updatedAt: now,
        updatedBy: username,
      }

      await docClient.send(
        new PutCommand({
          TableName: Resource.AppDataTable.name,
          Item: newGiftSettings,
        })
      )

      giftSettings = {
        maxItems: newGiftSettings.maxItems,
        maxFileSize: newGiftSettings.maxFileSize,
        allowedFormats: newGiftSettings.allowedFormats,
      }
    }

    // ============================================
    // 7. Return Updated Limits
    // ============================================
    return createSuccessResponse(
      200,
      {
        ...(gallerySettings && { gallery: gallerySettings }),
        ...(giftSettings && { gifts: giftSettings }),
        updatedAt: now,
        updatedBy: username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/weddings/{weddingId}/limits',
        operation: 'update-wedding-limits',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
