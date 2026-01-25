/**
 * PUT /admin/w/{weddingId}/qrcode-hub
 *
 * Admin endpoint to update QR Code Hub settings for a wedding.
 * Requires authentication and wedding access.
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import {
  validateQRCodeHubUpdate,
  mergeQRCodeHubSettings,
  DEFAULT_QRCODE_HUB_SETTINGS,
  type QRCodeHubSettings,
} from '../shared/qrcode-validation'
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
  // Extract and validate weddingId from path
  const weddingId = event.pathParameters?.weddingId
  if (!weddingId || !isValidWeddingId(weddingId)) {
    return createErrorResponse(400, 'Invalid wedding ID', context, 'INVALID_WEDDING_ID')
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
    return createErrorResponse(accessCheck.statusCode, accessCheck.error, context, 'ACCESS_DENIED')
  }

  if (!event.body) {
    return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
  }

  let body: unknown
  try {
    body = JSON.parse(event.body)
  } catch {
    return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
  }

  const validation = validateQRCodeHubUpdate(body)
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
  }

  try {
    // Get existing settings using wedding-scoped key
    const settingsKey = Keys.settings(weddingId, 'QRCODE_HUB')
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    // hubEnabled is removed - visibility is now controlled by Design Tab's section settings
    const existingSettings: QRCodeHubSettings = existingResult.Item
      ? {
          website: existingResult.Item.website ?? DEFAULT_QRCODE_HUB_SETTINGS.website,
          restuDigital: {
            enabled:
              existingResult.Item.restuDigital?.enabled ??
              DEFAULT_QRCODE_HUB_SETTINGS.restuDigital.enabled,
            useImage:
              existingResult.Item.restuDigital?.useImage ??
              DEFAULT_QRCODE_HUB_SETTINGS.restuDigital.useImage,
            qrImageUrl: existingResult.Item.restuDigital?.qrImageUrl,
            bankAccountNumber: existingResult.Item.restuDigital?.bankAccountNumber,
            bankAccountName: existingResult.Item.restuDigital?.bankAccountName,
            bankName: existingResult.Item.restuDigital?.bankName,
            tagline:
              existingResult.Item.restuDigital?.tagline ??
              DEFAULT_QRCODE_HUB_SETTINGS.restuDigital.tagline,
          },
          location: {
            enabled:
              existingResult.Item.location?.enabled ?? DEFAULT_QRCODE_HUB_SETTINGS.location.enabled,
            preferredApp:
              existingResult.Item.location?.preferredApp ??
              DEFAULT_QRCODE_HUB_SETTINGS.location.preferredApp,
          },
          wifi: {
            enabled: existingResult.Item.wifi?.enabled ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.enabled,
            ssid: existingResult.Item.wifi?.ssid ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.ssid,
            password:
              existingResult.Item.wifi?.password ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.password,
            encryption:
              existingResult.Item.wifi?.encryption ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.encryption,
            hidden: existingResult.Item.wifi?.hidden ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.hidden,
          },
          rsvp: existingResult.Item.rsvp ?? DEFAULT_QRCODE_HUB_SETTINGS.rsvp,
          calendar: existingResult.Item.calendar ?? DEFAULT_QRCODE_HUB_SETTINGS.calendar,
          hashtag: existingResult.Item.hashtag ?? DEFAULT_QRCODE_HUB_SETTINGS.hashtag,
          displayOrder:
            existingResult.Item.displayOrder ?? DEFAULT_QRCODE_HUB_SETTINGS.displayOrder,
        }
      : DEFAULT_QRCODE_HUB_SETTINGS

    // Merge existing settings with updates
    const mergedSettings = mergeQRCodeHubSettings(existingSettings, validation.data)

    const now = new Date().toISOString()

    // Store with wedding-scoped key
    const settingsItem = {
      ...settingsKey,
      weddingId,
      ...mergedSettings,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: settingsItem,
      })
    )

    const responseData: QRCodeHubSettings = {
      ...mergedSettings,
      updatedAt: now,
      updatedBy: authResult.user.username,
    }

    return createSuccessResponse(200, responseData, context)
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/qrcode-hub',
        operation: 'updateQRCodeHubSettings',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Failed to update QR Code Hub settings', context, 'DB_ERROR')
  }
}
