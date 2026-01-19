/**
 * Get RSVP Settings Endpoint (Public)
 *
 * Returns RSVP settings for a wedding (whether RSVPs are enabled).
 * Route: GET /{weddingSlug}/rsvp/settings
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { resolveWeddingSlug, requireActiveWedding } from '../shared/wedding-middleware'
import { DEFAULT_RSVP_SETTINGS, type RsvpSettings, canAcceptRsvp } from '../shared/rsvp-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Extract and Validate Wedding Slug
    // ============================================
    const weddingSlug = event.pathParameters?.weddingSlug
    if (!weddingSlug) {
      return createErrorResponse(400, 'Wedding slug is required', context, 'MISSING_SLUG')
    }

    // ============================================
    // 2. Resolve Slug to Wedding
    // ============================================
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

    const { weddingId } = weddingCheck.wedding

    // ============================================
    // 3. Get RSVP Settings
    // ============================================
    const settingsKey = Keys.settings(weddingId, 'RSVP')
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
        ConsistentRead: true,
      })
    )

    const settings: RsvpSettings = result.Item?.settings || DEFAULT_RSVP_SETTINGS

    // Get event date for deadline calculation
    const eventDate = weddingCheck.wedding.weddingDate

    // Compute whether RSVPs are currently accepting submissions
    const isAcceptingRsvps = canAcceptRsvp(settings, eventDate)

    return createSuccessResponse(
      200,
      {
        settings,
        eventDate,
        isAcceptingRsvps,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /{weddingSlug}/rsvp/settings',
        operation: 'getRsvpSettings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
