/**
 * Delete (Archive) Wedding Endpoint (Super Admin Only)
 *
 * Soft deletes a wedding by setting its status to 'archived'.
 * The wedding data is preserved but hidden from public access.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Extract and Validate Wedding ID
    // ============================================
    const weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 3. Verify Wedding Exists
    // ============================================
    const weddingKey = Keys.wedding(weddingId)
    const existingWedding = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
      })
    )

    if (!existingWedding.Item) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // Check if already archived
    if (existingWedding.Item.status === 'archived') {
      return createErrorResponse(400, 'Wedding is already archived', context, 'ALREADY_ARCHIVED')
    }

    // ============================================
    // 4. Update Status to Archived
    // ============================================
    const now = new Date().toISOString()

    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
        UpdateExpression:
          'SET #status = :status, #archivedAt = :archivedAt, #archivedBy = :archivedBy',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#archivedAt': 'archivedAt',
          '#archivedBy': 'archivedBy',
        },
        ExpressionAttributeValues: {
          ':status': 'archived',
          ':archivedAt': now,
          ':archivedBy': authResult.user.username,
        },
      })
    )

    // ============================================
    // 5. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: 'Wedding archived successfully',
        weddingId,
        archivedAt: now,
        archivedBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /superadmin/weddings/{weddingId}',
        operation: 'archive-wedding',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
