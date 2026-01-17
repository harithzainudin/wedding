/**
 * Admin Delete RSVP Endpoint
 *
 * Allows admins to delete RSVPs.
 * Route: DELETE /admin/w/{weddingId}/rsvp/{id}
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let rsvpId: string | undefined

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
    // 4. Extract and Validate RSVP ID
    // ============================================
    rsvpId = event.pathParameters?.id
    if (!rsvpId) {
      return createErrorResponse(400, 'RSVP ID is required', context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Verify RSVP Exists
    // ============================================
    const rsvpKeys = Keys.rsvp(weddingId, rsvpId)
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: rsvpKeys,
      })
    )

    if (!existingResult.Item) {
      return createErrorResponse(404, 'RSVP not found', context, 'NOT_FOUND')
    }

    // ============================================
    // 6. Delete RSVP Record
    // ============================================
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: rsvpKeys,
      })
    )

    return createSuccessResponse(
      200,
      {
        message: 'RSVP deleted successfully',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /admin/w/{weddingId}/rsvp/{id}',
        operation: 'deleteRsvp',
        requestId: context.awsRequestId,
        input: { rsvpId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
