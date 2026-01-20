/**
 * Reset Super Admin Password Endpoint (Master Only)
 *
 * Generates a new temporary password for another super admin.
 * Sets mustChangePassword flag to require password change on next login.
 * Only the master account can use this endpoint.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidUsername } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const BCRYPT_ROUNDS = 12

/**
 * Generate a random temporary password
 * Excludes ambiguous characters (I, L, O, l, i, o, 0, 1)
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
  let targetUsername: string | undefined

  try {
    // ============================================
    // 1. Authorization: Require Super Admin + Master Check
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // Only master can reset super admin passwords
    if (authResult.user.username !== 'master') {
      return createErrorResponse(
        403,
        'Only master account can reset super admin passwords',
        context,
        'FORBIDDEN'
      )
    }

    // ============================================
    // 2. Extract and Validate Parameters
    // ============================================
    targetUsername = event.pathParameters?.username?.toLowerCase()

    if (!targetUsername) {
      return createErrorResponse(400, 'Username is required', context, 'MISSING_USERNAME')
    }

    if (!isValidUsername(targetUsername)) {
      return createErrorResponse(400, 'Invalid username format', context, 'INVALID_USERNAME')
    }

    // Prevent resetting master's own password
    if (targetUsername === 'master') {
      return createErrorResponse(
        403,
        'Cannot reset master account password through this endpoint',
        context,
        'FORBIDDEN'
      )
    }

    // ============================================
    // 3. Verify Super Admin Exists
    // ============================================
    const superAdminKey = Keys.superAdmin(targetUsername)
    const superAdminResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: superAdminKey,
      })
    )

    if (!superAdminResult.Item) {
      return createErrorResponse(
        404,
        `Super admin "${targetUsername}" not found`,
        context,
        'NOT_FOUND'
      )
    }

    // ============================================
    // 4. Generate New Temporary Password
    // ============================================
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)
    const now = new Date().toISOString()

    // ============================================
    // 5. Update Super Admin Record
    // ============================================
    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: superAdminKey,
        UpdateExpression:
          'SET passwordHash = :passwordHash, mustChangePassword = :mustChange, passwordResetAt = :resetAt, passwordResetBy = :resetBy, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':passwordHash': passwordHash,
          ':mustChange': true,
          ':resetAt': now,
          ':resetBy': authResult.user.username,
          ':updatedAt': now,
        },
      })
    )

    // ============================================
    // 6. Return Success with Temporary Password
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: `Password reset for super admin "${targetUsername}"`,
        username: targetUsername,
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
        endpoint: 'POST /superadmin/admins/{username}/reset-password',
        operation: 'resetSuperAdminPassword',
        requestId: context.awsRequestId,
        input: { targetUsername },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
