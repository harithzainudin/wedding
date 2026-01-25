/**
 * Get QR Code Hub Settings Endpoint
 *
 * Fetches QR Code Hub settings for a specific wedding.
 * Public Route: GET /{weddingSlug}/qrcode-hub
 * Admin Route: GET /admin/w/{weddingId}/qrcode-hub
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { DEFAULT_QRCODE_HUB_SETTINGS, type QRCodeHubSettings } from '../shared/qrcode-validation'
import { Keys } from '../shared/keys'
import {
  resolveWeddingSlug,
  requireActiveWedding,
  getWeddingById,
} from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    let weddingId: string

    // ============================================
    // Determine route type and extract wedding context
    // ============================================

    if (event.pathParameters?.weddingId) {
      // Admin route: /admin/w/{weddingId}/qrcode-hub
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
    } else if (event.pathParameters?.weddingSlug) {
      // Public route: /{weddingSlug}/qrcode-hub
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

    // Fetch QR Code Hub settings using wedding-scoped key
    const settingsKey = Keys.settings(weddingId, 'QRCODE_HUB')
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
        ConsistentRead: true,
      })
    )

    if (!result.Item) {
      // Return default settings if none exists in database
      return createSuccessResponse(200, DEFAULT_QRCODE_HUB_SETTINGS, context)
    }

    // hubEnabled is removed - visibility is now controlled by Design Tab's section settings
    const settings: QRCodeHubSettings = {
      website: result.Item.website ?? DEFAULT_QRCODE_HUB_SETTINGS.website,
      restuDigital: {
        enabled:
          result.Item.restuDigital?.enabled ?? DEFAULT_QRCODE_HUB_SETTINGS.restuDigital.enabled,
        useImage:
          result.Item.restuDigital?.useImage ?? DEFAULT_QRCODE_HUB_SETTINGS.restuDigital.useImage,
        qrImageUrl: result.Item.restuDigital?.qrImageUrl,
        bankAccountNumber: result.Item.restuDigital?.bankAccountNumber,
        bankAccountName: result.Item.restuDigital?.bankAccountName,
        bankName: result.Item.restuDigital?.bankName,
        tagline:
          result.Item.restuDigital?.tagline ?? DEFAULT_QRCODE_HUB_SETTINGS.restuDigital.tagline,
      },
      location: {
        enabled: result.Item.location?.enabled ?? DEFAULT_QRCODE_HUB_SETTINGS.location.enabled,
        preferredApp:
          result.Item.location?.preferredApp ?? DEFAULT_QRCODE_HUB_SETTINGS.location.preferredApp,
      },
      wifi: {
        enabled: result.Item.wifi?.enabled ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.enabled,
        ssid: result.Item.wifi?.ssid ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.ssid,
        password: result.Item.wifi?.password ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.password,
        encryption: result.Item.wifi?.encryption ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.encryption,
        hidden: result.Item.wifi?.hidden ?? DEFAULT_QRCODE_HUB_SETTINGS.wifi.hidden,
      },
      rsvp: result.Item.rsvp ?? DEFAULT_QRCODE_HUB_SETTINGS.rsvp,
      calendar: result.Item.calendar ?? DEFAULT_QRCODE_HUB_SETTINGS.calendar,
      hashtag: result.Item.hashtag ?? DEFAULT_QRCODE_HUB_SETTINGS.hashtag,
      displayOrder: result.Item.displayOrder ?? DEFAULT_QRCODE_HUB_SETTINGS.displayOrder,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    }

    return createSuccessResponse(200, settings, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /{weddingSlug}/qrcode-hub',
        operation: 'fetchQRCodeHubSettings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch QR Code Hub settings', context, 'DB_ERROR')
  }
}
