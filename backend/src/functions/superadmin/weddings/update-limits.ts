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
  DEFAULT_MAX_VIDEO_SIZE,
  DEFAULT_MAX_IMAGES,
  ALLOWED_MIME_TYPES,
} from '../../shared/image-constants'
import { GIFT_LIMITS } from '../../shared/gift-validation'
import {
  HERO_IMAGE_DEFAULT_MAX_SIZE,
  HERO_VIDEO_DEFAULT_MAX_SIZE,
  HERO_IMAGE_MIN_LIMIT,
  HERO_IMAGE_MAX_LIMIT,
  HERO_VIDEO_MIN_LIMIT,
  HERO_VIDEO_MAX_LIMIT,
} from '../../shared/hero-background-constants'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

interface UpdateLimitsInput {
  gallery?: {
    maxFileSize?: number
    maxVideoSize?: number
    maxImages?: number
  }
  gifts?: {
    maxItems?: number
    maxFileSize?: number
  }
  heroBackground?: {
    maxImageSize?: number
    maxVideoSize?: number
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

    // Validate maxVideoSize (25MB to 500MB)
    if (gallery.maxVideoSize !== undefined) {
      const maxVideoSize = Number(gallery.maxVideoSize)
      if (
        isNaN(maxVideoSize) ||
        maxVideoSize < 25 * 1024 * 1024 ||
        maxVideoSize > 500 * 1024 * 1024
      ) {
        return { valid: false, error: 'Gallery max video size must be between 25MB and 500MB' }
      }
      data.gallery.maxVideoSize = maxVideoSize
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

  // Validate heroBackground limits
  if (body.heroBackground !== undefined) {
    if (typeof body.heroBackground !== 'object' || body.heroBackground === null) {
      return { valid: false, error: 'Hero background must be an object' }
    }

    const heroBackground = body.heroBackground as Record<string, unknown>
    data.heroBackground = {}

    // Validate maxImageSize (1MB to 20MB)
    if (heroBackground.maxImageSize !== undefined) {
      const maxImageSize = Number(heroBackground.maxImageSize)
      if (
        isNaN(maxImageSize) ||
        maxImageSize < HERO_IMAGE_MIN_LIMIT ||
        maxImageSize > HERO_IMAGE_MAX_LIMIT
      ) {
        return { valid: false, error: 'Hero image max size must be between 1MB and 20MB' }
      }
      data.heroBackground.maxImageSize = maxImageSize
    }

    // Validate maxVideoSize (10MB to 100MB)
    if (heroBackground.maxVideoSize !== undefined) {
      const maxVideoSize = Number(heroBackground.maxVideoSize)
      if (
        isNaN(maxVideoSize) ||
        maxVideoSize < HERO_VIDEO_MIN_LIMIT ||
        maxVideoSize > HERO_VIDEO_MAX_LIMIT
      ) {
        return { valid: false, error: 'Hero video max size must be between 10MB and 100MB' }
      }
      data.heroBackground.maxVideoSize = maxVideoSize
    }
  }

  // At least one setting must be provided
  if (!data.gallery && !data.gifts && !data.heroBackground) {
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

      // Visibility is now controlled by Design Tab's section settings
      const newGallerySettings = {
        ...galleryKey,
        maxFileSize:
          validation.data.gallery.maxFileSize ??
          currentGallery.Item?.maxFileSize ??
          DEFAULT_MAX_FILE_SIZE,
        maxVideoSize:
          validation.data.gallery.maxVideoSize ??
          currentGallery.Item?.maxVideoSize ??
          DEFAULT_MAX_VIDEO_SIZE,
        maxImages:
          validation.data.gallery.maxImages ?? currentGallery.Item?.maxImages ?? DEFAULT_MAX_IMAGES,
        allowedFormats: currentGallery.Item?.allowedFormats ?? [...ALLOWED_MIME_TYPES],
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
        maxVideoSize: newGallerySettings.maxVideoSize,
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
    // 7. Update Hero Background Settings if Provided
    // ============================================
    let heroBackgroundSettings: Record<string, unknown> | undefined
    if (validation.data.heroBackground) {
      const heroBackgroundKey = Keys.settings(weddingId, 'HERO_BACKGROUND')
      const currentHeroBackground = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: heroBackgroundKey,
        })
      )

      const newHeroBackgroundSettings = {
        ...heroBackgroundKey,
        // Preserve existing settings
        mediaType: currentHeroBackground.Item?.mediaType ?? 'none',
        uploadMode: currentHeroBackground.Item?.uploadMode ?? 'single',
        overlay: currentHeroBackground.Item?.overlay ?? {
          enabled: true,
          color: 'black',
          opacity: 30,
        },
        // Update limits
        maxImageSize:
          validation.data.heroBackground.maxImageSize ??
          currentHeroBackground.Item?.maxImageSize ??
          HERO_IMAGE_DEFAULT_MAX_SIZE,
        maxVideoSize:
          validation.data.heroBackground.maxVideoSize ??
          currentHeroBackground.Item?.maxVideoSize ??
          HERO_VIDEO_DEFAULT_MAX_SIZE,
        // Preserve media items if they exist
        ...(currentHeroBackground.Item?.desktop && { desktop: currentHeroBackground.Item.desktop }),
        ...(currentHeroBackground.Item?.mobile && { mobile: currentHeroBackground.Item.mobile }),
        ...(currentHeroBackground.Item?.universal && {
          universal: currentHeroBackground.Item.universal,
        }),
        ...(currentHeroBackground.Item?.posterUrl && {
          posterUrl: currentHeroBackground.Item.posterUrl,
        }),
        updatedAt: now,
        updatedBy: username,
      }

      await docClient.send(
        new PutCommand({
          TableName: Resource.AppDataTable.name,
          Item: newHeroBackgroundSettings,
        })
      )

      heroBackgroundSettings = {
        maxImageSize: newHeroBackgroundSettings.maxImageSize,
        maxVideoSize: newHeroBackgroundSettings.maxVideoSize,
      }
    }

    // ============================================
    // 8. Return Updated Limits
    // ============================================
    return createSuccessResponse(
      200,
      {
        ...(gallerySettings && { gallery: gallerySettings }),
        ...(giftSettings && { gifts: giftSettings }),
        ...(heroBackgroundSettings && { heroBackground: heroBackgroundSettings }),
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
