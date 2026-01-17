/**
 * List RSVPs Endpoint
 *
 * Public: Returns wishes only (messages from guests)
 * Admin: Returns full RSVP data with statistics
 *
 * Public Route: GET /{weddingSlug}/rsvp
 * Admin Route: GET /admin/w/{weddingId}/rsvp
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import {
  resolveWeddingSlug,
  requireActiveWedding,
  getWeddingById,
  requireAdminAccessibleWedding,
} from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface RsvpRecord {
  pk: string
  sk: string
  id: string
  weddingId: string
  title: string
  fullName: string
  isAttending: boolean
  numberOfGuests: number
  phoneNumber: string
  message: string
  submittedAt: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    let weddingId: string
    let isAuthenticated = false

    // ============================================
    // Determine route type and extract wedding context
    // ============================================

    // Check if this is an admin route (has weddingId)
    if (event.pathParameters?.weddingId) {
      // Admin route: /admin/w/{weddingId}/rsvp
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

      isAuthenticated = true
    } else if (event.pathParameters?.weddingSlug) {
      // Public route: /{weddingSlug}/rsvp
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

    const status = event.queryStringParameters?.status

    // ============================================
    // Query RSVPs for this wedding
    // ============================================
    let items: RsvpRecord[] = []

    if (status && ['attending', 'not_attending'].includes(status)) {
      // Query by status using GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `WEDDING#${weddingId}#RSVP_STATUS#${status}`,
          },
          ScanIndexForward: false,
        })
      )
      items = (result.Items ?? []) as RsvpRecord[]
    } else {
      // Query all RSVPs for this wedding using the GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `WEDDING#${weddingId}#RSVPS`,
          },
          ScanIndexForward: false,
        })
      )
      items = (result.Items ?? []) as RsvpRecord[]
    }

    // Transform items for response
    const rsvps = items.map((item) => ({
      id: item.id,
      title: item.title,
      fullName: item.fullName,
      isAttending: item.isAttending,
      numberOfGuests: item.numberOfGuests,
      phoneNumber: item.phoneNumber,
      message: item.message,
      submittedAt: item.submittedAt,
    }))

    // Public response - only wishes for guestbook (no sensitive data)
    if (!isAuthenticated) {
      const wishes = rsvps
        .filter((r) => r.message && r.message.trim() !== '')
        .map((r) => ({
          title: r.title,
          fullName: r.fullName,
          message: r.message,
          submittedAt: r.submittedAt,
        }))

      return createSuccessResponse(200, { rsvps: wishes }, context)
    }

    // Authenticated response - full data with summary statistics
    const attending = rsvps.filter((r) => r.isAttending)
    const totalGuests = attending.reduce((sum, r) => sum + r.numberOfGuests, 0)

    return createSuccessResponse(
      200,
      {
        rsvps,
        summary: {
          total: rsvps.length,
          attending: attending.length,
          notAttending: rsvps.length - attending.length,
          totalGuests,
        },
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /rsvp',
        operation: 'listRsvps',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
