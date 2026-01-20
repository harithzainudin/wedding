/**
 * Change Super Admin Password Endpoint
 *
 * Allows super admins to change their own password.
 * Requires current password verification.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireSuperAdmin } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const BCRYPT_ROUNDS = 12

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let username: string | undefined

  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    username = authResult.user.username

    // ============================================
    // 2. Block Master Account
    // ============================================
    // Master account uses environment variable password, cannot be changed here
    if (username === 'master') {
      return createErrorResponse(
        403,
        'Master account password cannot be changed through this endpoint',
        context,
        'FORBIDDEN'
      )
    }

    // ============================================
    // 3. Parse and Validate Request Body
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: ChangePasswordRequest
    try {
      body = JSON.parse(event.body) as ChangePasswordRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    // Validate required fields
    if (!body.currentPassword || !body.newPassword) {
      return createErrorResponse(
        400,
        'Current password and new password are required',
        context,
        'VALIDATION_ERROR'
      )
    }

    // Validate new password length
    if (body.newPassword.length < 6) {
      return createErrorResponse(
        400,
        'New password must be at least 6 characters',
        context,
        'VALIDATION_ERROR'
      )
    }

    // Prevent setting same password
    if (body.currentPassword === body.newPassword) {
      return createErrorResponse(
        400,
        'New password must be different from current password',
        context,
        'VALIDATION_ERROR'
      )
    }

    // ============================================
    // 4. Fetch Super Admin from DynamoDB
    // ============================================
    const keys = Keys.superAdmin(username)
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: keys,
      })
    )

    if (!result.Item) {
      return createErrorResponse(404, 'Super admin not found', context, 'NOT_FOUND')
    }

    // ============================================
    // 5. Verify Current Password
    // ============================================
    const passwordHash = result.Item.passwordHash as string
    const isValidPassword = await bcrypt.compare(body.currentPassword, passwordHash)

    if (!isValidPassword) {
      return createErrorResponse(401, 'Current password is incorrect', context, 'AUTH_ERROR')
    }

    // ============================================
    // 6. Hash New Password and Update
    // ============================================
    const newPasswordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS)

    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: keys,
        UpdateExpression:
          'SET passwordHash = :newHash, updatedAt = :updatedAt REMOVE mustChangePassword',
        ExpressionAttributeValues: {
          ':newHash': newPasswordHash,
          ':updatedAt': new Date().toISOString(),
        },
      })
    )

    return createSuccessResponse(
      200,
      {
        message: 'Password changed successfully',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/password',
        operation: 'changeSuperAdminPassword',
        requestId: context.awsRequestId,
        input: { username },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
