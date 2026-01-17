/**
 * Reset Owner Password Endpoint (Super Admin Only)
 *
 * Generates a new temporary password for a wedding admin.
 * Sets mustChangePassword flag to require password change on next login.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId, isValidUsername } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const BCRYPT_ROUNDS = 12

/**
 * Generate a random temporary password
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

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
    // 4. Verify User is Linked to This Wedding
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
    // 5. Verify Admin Exists
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
    // 6. Generate New Temporary Password
    // ============================================
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)
    const now = new Date().toISOString()

    // ============================================
    // 7. Update Admin Record
    // ============================================
    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
        UpdateExpression:
          'SET passwordHash = :passwordHash, mustChangePassword = :mustChange, passwordResetAt = :resetAt, passwordResetBy = :resetBy',
        ExpressionAttributeValues: {
          ':passwordHash': passwordHash,
          ':mustChange': true,
          ':resetAt': now,
          ':resetBy': authResult.user.username,
        },
      })
    )

    // ============================================
    // 8. Return Success with Temporary Password
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: `Password reset for "${username}"`,
        username,
        temporaryPassword: tempPassword,
        mustChangePassword: true,
        resetAt: now,
        resetBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/weddings/{weddingId}/users/{username}/reset-password',
        operation: 'reset-owner-password',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
