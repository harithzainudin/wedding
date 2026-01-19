/**
 * Get Schedule Endpoint
 *
 * Fetches schedule for a specific wedding.
 * Public Route: GET /{weddingSlug}/schedule
 * Admin Route: GET /admin/w/{weddingId}/schedule
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import {
  DEFAULT_SCHEDULE,
  DEFAULT_SCHEDULE_SETTINGS,
  type ScheduleData,
} from '../shared/schedule-validation'
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
      // Admin route: /admin/w/{weddingId}/schedule
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
      // Public route: /{weddingSlug}/schedule
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

    // ============================================
    // Fetch Schedule Data
    // ============================================
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'SCHEDULE'),
      })
    )

    if (!result.Item) {
      // Return default schedule if none exists in database
      return createSuccessResponse(200, DEFAULT_SCHEDULE, context)
    }

    const scheduleData: ScheduleData = {
      items: result.Item.items,
      settings: result.Item.settings || DEFAULT_SCHEDULE_SETTINGS,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    }

    return createSuccessResponse(200, scheduleData, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /schedule',
        operation: 'fetchSchedule',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch schedule', context, 'DB_ERROR')
  }
}
