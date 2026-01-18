/**
 * Update Staff Endpoint (Super Admin Only)
 *
 * Updates a staff member's details (email, password).
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidUsername, isValidEmail } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const BCRYPT_ROUNDS = 12

interface UpdateStaffInput {
  email?: string
  password?: string
}

function validateUpdateStaffInput(
  body: unknown
): { valid: true; data: UpdateStaffInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as Record<string, unknown>
  const data: UpdateStaffInput = {}

  // Validate email (optional)
  if (input.email !== undefined) {
    if (input.email === '' || input.email === null) {
      // Allow clearing email
      data.email = ''
    } else if (typeof input.email !== 'string' || !isValidEmail(input.email)) {
      return { valid: false, error: 'Invalid email format' }
    } else {
      data.email = input.email
    }
  }

  // Validate password (optional)
  if (input.password !== undefined) {
    if (typeof input.password !== 'string' || input.password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' }
    }
    data.password = input.password
  }

  // At least one field must be provided
  if (Object.keys(data).length === 0) {
    return { valid: false, error: 'At least one field (email or password) must be provided' }
  }

  return { valid: true, data }
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
    // 3. Parse and Validate Input
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: unknown
    try {
      body = JSON.parse(event.body)
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    const validation = validateUpdateStaffInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 4. Verify Staff Exists and is Staff Type
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
    // 5. Build Update Expression
    // ============================================
    const { email, password } = validation.data
    const updateExpressions: string[] = []
    const expressionAttributeValues: Record<string, unknown> = {}
    const expressionAttributeNames: Record<string, string> = {}

    if (email !== undefined) {
      if (email === '') {
        // Remove email
        updateExpressions.push('REMOVE email')
      } else {
        updateExpressions.push('SET email = :email')
        expressionAttributeValues[':email'] = email
      }
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
      updateExpressions.push('SET passwordHash = :passwordHash')
      expressionAttributeValues[':passwordHash'] = passwordHash
    }

    // Add updatedAt
    updateExpressions.push('SET updatedAt = :updatedAt')
    expressionAttributeValues[':updatedAt'] = new Date().toISOString()

    // Combine SET expressions
    const setExpressions = updateExpressions
      .filter((e) => e.startsWith('SET '))
      .map((e) => e.replace('SET ', ''))
    const removeExpressions = updateExpressions.filter((e) => e.startsWith('REMOVE '))

    let updateExpression = ''
    if (setExpressions.length > 0) {
      updateExpression += `SET ${setExpressions.join(', ')}`
    }
    if (removeExpressions.length > 0) {
      updateExpression += ` ${removeExpressions.join(' ')}`
    }

    // ============================================
    // 6. Update Staff Member
    // ============================================
    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
        UpdateExpression: updateExpression.trim(),
        ...(Object.keys(expressionAttributeValues).length > 0 && {
          ExpressionAttributeValues: expressionAttributeValues,
        }),
        ...(Object.keys(expressionAttributeNames).length > 0 && {
          ExpressionAttributeNames: expressionAttributeNames,
        }),
      })
    )

    // ============================================
    // 7. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: 'Staff member updated successfully',
        username,
        updated: {
          ...(email !== undefined && { email: email || null }),
          ...(password && { passwordChanged: true }),
        },
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/staff/{username}',
        operation: 'update-staff',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
