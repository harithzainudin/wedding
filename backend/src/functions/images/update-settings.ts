/**
 * Update Image Settings Endpoint (Admin)
 *
 * Updates image upload settings for a wedding.
 * Route: PUT /admin/w/{weddingId}/images/settings
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateSettingsUpdate } from '../shared/image-validation'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_IMAGES,
  DEFAULT_SHOW_GALLERY,
  ALLOWED_MIME_TYPES,
} from '../shared/image-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

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

    const validation = validateSettingsUpdate(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Get Current Settings
    // ============================================
    const settingsKey = Keys.settings(weddingId, 'IMAGES')
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    // ============================================
    // 6. Update Settings
    // ============================================
    const now = new Date().toISOString()
    const newSettings = {
      ...settingsKey,
      maxFileSize:
        validation.data.maxFileSize ?? currentResult.Item?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
      maxImages: validation.data.maxImages ?? currentResult.Item?.maxImages ?? DEFAULT_MAX_IMAGES,
      allowedFormats: currentResult.Item?.allowedFormats ?? [...ALLOWED_MIME_TYPES],
      showGallery:
        validation.data.showGallery ?? currentResult.Item?.showGallery ?? DEFAULT_SHOW_GALLERY,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: newSettings,
      })
    )

    return createSuccessResponse(
      200,
      {
        maxFileSize: newSettings.maxFileSize,
        maxImages: newSettings.maxImages,
        allowedFormats: newSettings.allowedFormats,
        showGallery: newSettings.showGallery,
        updatedAt: newSettings.updatedAt,
        updatedBy: newSettings.updatedBy,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/images/settings',
        operation: 'updateImageSettings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to update settings', context, 'DB_ERROR')
  }
}
