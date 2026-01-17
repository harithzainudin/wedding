/**
 * Remove Owner from Wedding Endpoint (Super Admin Only)
 *
 * Removes an admin's access to a specific wedding.
 * Does NOT delete the admin account - they may still have access to other weddings.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId, isValidUsername } from '../../shared/validation'
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
    // 2. Extract and Validate Parameters
    // ============================================
    const weddingId = event.pathParameters?.weddingId
    const username = event.pathParameters?.username

    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    if (!username) {
      return createErrorResponse(400, 'Username is required', context, 'MISSING_USERNAME')
    }

    if (!isValidUsername(username)) {
      return createErrorResponse(400, 'Invalid username format', context, 'INVALID_USERNAME')
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

    // ============================================
    // 4. Check if User is Linked to This Wedding
    // ============================================
    const linkKey = Keys.weddingAdminLink(weddingId, username)
    const existingLink = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: linkKey,
      })
    )

    if (!existingLink.Item) {
      return createErrorResponse(
        404,
        `User "${username}" is not linked to this wedding`,
        context,
        'NOT_LINKED'
      )
    }

    // ============================================
    // 5. Prevent Removing Last Owner
    // ============================================
    const adminsResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `WEDDING#${weddingId}#ADMINS`,
        },
      })
    )

    const adminCount = adminsResult.Items?.length ?? 0
    if (adminCount <= 1) {
      return createErrorResponse(
        400,
        'Cannot remove the last owner from a wedding',
        context,
        'LAST_OWNER'
      )
    }

    // ============================================
    // 6. Get Admin Record
    // ============================================
    const adminKey = Keys.weddingAdmin(username)
    const adminResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
      })
    )

    if (!adminResult.Item) {
      return createErrorResponse(404, `Admin "${username}" not found`, context, 'ADMIN_NOT_FOUND')
    }

    // ============================================
    // 7. Remove Wedding from Admin's weddingIds
    // ============================================
    const currentWeddingIds = (adminResult.Item.weddingIds as string[]) ?? []
    const updatedWeddingIds = currentWeddingIds.filter((id) => id !== weddingId)

    // Update admin's weddingIds
    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
        UpdateExpression: 'SET weddingIds = :weddingIds',
        ExpressionAttributeValues: {
          ':weddingIds': updatedWeddingIds,
        },
      })
    )

    // ============================================
    // 8. Delete Wedding-Admin Link
    // ============================================
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: linkKey,
      })
    )

    // ============================================
    // 9. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: `User "${username}" removed from wedding`,
        username,
        weddingId,
        remainingWeddings: updatedWeddingIds,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /superadmin/weddings/{weddingId}/users/{username}',
        operation: 'remove-owner',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
