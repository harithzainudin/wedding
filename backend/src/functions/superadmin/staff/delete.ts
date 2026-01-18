/**
 * Delete Staff Endpoint (Super Admin Only)
 *
 * Deletes a staff member and removes them from all weddings they manage.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidUsername } from '../../shared/validation'
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
    // 2. Extract and Validate Username
    // ============================================
    const username = event.pathParameters?.username
    if (!username) {
      return createErrorResponse(400, 'Username is required', context, 'MISSING_USERNAME')
    }

    if (!isValidUsername(username)) {
      return createErrorResponse(400, 'Invalid username format', context, 'INVALID_USERNAME')
    }

    // ============================================
    // 3. Verify Staff Exists and is Staff Type
    // ============================================
    const adminKey = Keys.weddingAdmin(username)
    const existingAdmin = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
      })
    )

    if (!existingAdmin.Item) {
      return createErrorResponse(
        404,
        `Staff member "${username}" not found`,
        context,
        'STAFF_NOT_FOUND'
      )
    }

    if (existingAdmin.Item.userType !== 'staff') {
      return createErrorResponse(
        400,
        `User "${username}" is not a staff member`,
        context,
        'NOT_STAFF'
      )
    }

    // ============================================
    // 4. Get Wedding IDs to Remove Links
    // ============================================
    const weddingIds = (existingAdmin.Item.weddingIds as string[]) ?? []

    // ============================================
    // 5. Delete Wedding-Admin Links in Batches
    // ============================================
    if (weddingIds.length > 0) {
      // DynamoDB BatchWrite supports max 25 items per request
      const BATCH_SIZE = 25
      for (let i = 0; i < weddingIds.length; i += BATCH_SIZE) {
        const batch = weddingIds.slice(i, i + BATCH_SIZE)
        const deleteRequests = batch.map((weddingId) => ({
          DeleteRequest: {
            Key: Keys.weddingAdminLink(weddingId, username),
          },
        }))

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [Resource.AppDataTable.name]: deleteRequests,
            },
          })
        )
      }
    }

    // ============================================
    // 6. Delete Staff Member Record
    // ============================================
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
      })
    )

    // ============================================
    // 7. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: 'Staff member deleted successfully',
        username,
        removedFromWeddings: weddingIds.length,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /superadmin/staff/{username}',
        operation: 'delete-staff',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
