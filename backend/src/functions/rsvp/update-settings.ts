/**
 * Update RSVP Settings Endpoint (Admin)
 *
 * Updates RSVP settings (showRsvp toggle) for a specific wedding.
 * Route: PUT /admin/w/{weddingId}/rsvp/settings
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
import {
  type RsvpSettings,
  DEFAULT_RSVP_SETTINGS,
  validateRsvpSettingsUpdate,
} from '../shared/rsvp-validation'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
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
  // 3b. Check Wedding Status (block archived for non-super admins)
  // ============================================
  const isSuperAdmin = authResult.user.type === 'super' || authResult.user.isMaster
  const accessCheck = requireAdminAccessibleWedding(wedding, isSuperAdmin)
  if (!accessCheck.success) {
    return createErrorResponse(accessCheck.statusCode, accessCheck.error, context, 'ACCESS_DENIED')
  }

  // ============================================
  // 4. Validate Request Body
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

  const validation = validateRsvpSettingsUpdate(body)
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
  }

  // ============================================
  // 5. Validate deadline against event date
  // ============================================
  if (validation.data.rsvpDeadline) {
    const eventDate = wedding.weddingDate
    if (eventDate) {
      const deadline = new Date(validation.data.rsvpDeadline)
      const event = new Date(eventDate)
      if (deadline > event) {
        return createErrorResponse(
          400,
          'RSVP deadline cannot be after the event date',
          context,
          'INVALID_DEADLINE'
        )
      }
    }
  }

  // ============================================
  // 6. Get existing RSVP settings and merge
  // ============================================
  try {
    const settingsKey = Keys.settings(weddingId, 'RSVP')

    // Get existing data
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const existingData = existingResult.Item || {}
    const existingSettings: RsvpSettings = existingData.settings || DEFAULT_RSVP_SETTINGS

    // Merge new settings
    const updatedSettings: RsvpSettings = {
      showRsvp:
        validation.data.showRsvp !== undefined
          ? validation.data.showRsvp
          : existingSettings.showRsvp,
      acceptingRsvps:
        validation.data.acceptingRsvps !== undefined
          ? validation.data.acceptingRsvps
          : existingSettings.acceptingRsvps,
    }

    // Handle rsvpDeadline: null means remove, undefined means keep existing
    if (validation.data.rsvpDeadline === null) {
      // Remove deadline - don't include it in the settings
      delete updatedSettings.rsvpDeadline
    } else if (validation.data.rsvpDeadline !== undefined) {
      // Set new deadline
      updatedSettings.rsvpDeadline = validation.data.rsvpDeadline
    } else if (existingSettings.rsvpDeadline) {
      // Keep existing deadline
      updatedSettings.rsvpDeadline = existingSettings.rsvpDeadline
    }

    const now = new Date().toISOString()

    // Update with merged settings
    const rsvpSettingsItem = {
      ...settingsKey,
      settings: updatedSettings,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: rsvpSettingsItem,
      })
    )

    return createSuccessResponse(200, { settings: updatedSettings }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/rsvp/settings',
        operation: 'updateRsvpSettings',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Failed to update RSVP settings', context, 'DB_ERROR')
  }
}
