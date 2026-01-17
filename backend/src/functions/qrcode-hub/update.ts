import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import {
  validateQRCodeHubUpdate,
  mergeQRCodeHubSettings,
  DEFAULT_QRCODE_HUB_SETTINGS,
  type QRCodeHubSettings,
} from '../shared/qrcode-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const authResult = requireAuth(event)
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
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
    // Get existing settings to merge with updates
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: 'SETTINGS', sk: 'QR_CODE_HUB' },
      })
    )

    const existingSettings: QRCodeHubSettings = existingResult.Item
      ? {
          hubEnabled: existingResult.Item.hubEnabled ?? DEFAULT_QRCODE_HUB_SETTINGS.hubEnabled,
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

    const settingsItem = {
      pk: 'SETTINGS',
      sk: 'QR_CODE_HUB',
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
        endpoint: 'PUT /qrcode-hub',
        operation: 'updateQRCodeHubSettings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to update QR Code Hub settings', context, 'DB_ERROR')
  }
}
