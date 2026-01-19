/**
 * Update Contacts Settings Endpoint (Admin)
 *
 * Updates contacts settings (showContacts toggle) for a specific wedding.
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

interface ContactsSettingsUpdateRequest {
  showContacts?: boolean
}

function validateSettingsUpdate(
  input: unknown
): { valid: true; data: ContactsSettingsUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // At least one setting must be provided
  if (body.showContacts === undefined) {
    return { valid: false, error: 'At least one setting (showContacts) must be provided' }
  }

  // Validate showContacts if provided
  if (body.showContacts !== undefined && typeof body.showContacts !== 'boolean') {
    return { valid: false, error: 'showContacts must be a boolean' }
  }

  return {
    valid: true,
    data: {
      showContacts: body.showContacts as boolean | undefined,
    },
  }
}

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

  const validation = validateSettingsUpdate(body)
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
  }

  // ============================================
  // 5. Get existing contacts data and merge settings
  // ============================================
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
    const existingSettings: ContactsSettings = existingData.settings || DEFAULT_CONTACTS_SETTINGS

    // Merge new settings
    const updatedSettings: ContactsSettings = {
      showContacts:
        validation.data.showContacts !== undefined
          ? validation.data.showContacts
          : existingSettings.showContacts,
    }

    const now = new Date().toISOString()

    // Update with merged settings
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
