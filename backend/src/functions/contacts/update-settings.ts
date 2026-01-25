/**
 * Update Contacts Settings Endpoint (Admin)
 *
 * Updates contacts settings for a specific wedding.
 * Note: Visibility is now controlled by Design Tab's section settings.
 * Route: PUT /admin/w/{weddingId}/contacts/settings
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
import { type ContactsSettings, DEFAULT_CONTACTS_SETTINGS } from '../shared/contacts-validation'
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
  // 4. Get existing contacts data and update metadata
  // ============================================
  // Note: Contacts visibility is now controlled by Design Tab.
  // This endpoint is kept for backward compatibility and future contacts-specific settings.
  try {
    const settingsKey = Keys.settings(weddingId, 'CONTACTS')

    // Get existing data
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const existingData = existingResult.Item || {}

    // Settings is empty for now (visibility moved to Design Tab)
    const updatedSettings: ContactsSettings = DEFAULT_CONTACTS_SETTINGS

    const now = new Date().toISOString()

    // Update with settings and metadata
    const contactsItem = {
      ...settingsKey,
      contacts: existingData.contacts || [],
      settings: updatedSettings,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: contactsItem,
      })
    )

    return createSuccessResponse(200, { settings: updatedSettings }, context)
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/contacts/settings',
        operation: 'updateContactsSettings',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Failed to update contacts settings', context, 'DB_ERROR')
  }
}
