/**
 * Update Owner Endpoint (Super Admin Only)
 *
 * Updates an admin's details (email, role) for a specific wedding.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId, isValidUsername } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface UpdateOwnerInput {
  email?: string
  role?: 'owner' | 'coowner'
}

function validateUpdateInput(
  body: unknown
): { valid: true; data: UpdateOwnerInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as Record<string, unknown>
  const data: UpdateOwnerInput = {}

  // Validate email
  if (input.email !== undefined) {
    if (input.email !== null && input.email !== '') {
      if (typeof input.email !== 'string') {
        return { valid: false, error: 'Email must be a string' }
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(input.email)) {
        return { valid: false, error: 'Invalid email format' }
      }
      data.email = input.email
    } else {
      // Allow clearing email by passing null or empty string
      data.email = ''
    }
  }

  // Validate role
  if (input.role !== undefined) {
    const validRoles = ['owner', 'coowner']
    if (!validRoles.includes(input.role as string)) {
      return { valid: false, error: `Role must be one of: ${validRoles.join(', ')}` }
    }
    data.role = input.role as 'owner' | 'coowner'
  }

  // Ensure at least one field is being updated
  if (Object.keys(data).length === 0) {
    return { valid: false, error: 'At least one field must be provided for update' }
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

    const validation = validateUpdateInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { email, role } = validation.data

    // ============================================
    // 4. Verify Wedding Exists
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
    // 5. Verify User is Linked to This Wedding
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
    // 6. Verify Admin Exists
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
    // 7. Update Admin Record (email)
    // ============================================
    const now = new Date().toISOString()

    if (email !== undefined) {
      const updateExpressions: string[] = ['#updatedAt = :updatedAt']
      const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' }
      const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': now }

      if (email === '') {
        // Remove email
        updateExpressions.push('REMOVE #email')
        expressionAttributeNames['#email'] = 'email'
      } else {
        updateExpressions.push('#email = :email')
        expressionAttributeNames['#email'] = 'email'
        expressionAttributeValues[':email'] = email
      }

      await docClient.send(
        new UpdateCommand({
          TableName: Resource.AppDataTable.name,
          Key: adminKey,
          UpdateExpression: `SET ${updateExpressions.filter((e) => e.startsWith('#')).join(', ')}${updateExpressions.some((e) => e.startsWith('REMOVE')) ? ' ' + updateExpressions.filter((e) => e.startsWith('REMOVE')).join(' ') : ''}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues:
            Object.keys(expressionAttributeValues).length > 0
              ? expressionAttributeValues
              : undefined,
        })
      )
    }

    // ============================================
    // 8. Update Link Record (role)
    // ============================================
    if (role !== undefined) {
      await docClient.send(
        new UpdateCommand({
          TableName: Resource.AppDataTable.name,
          Key: linkKey,
          UpdateExpression: 'SET #role = :role, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#role': 'role',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':role': role,
            ':updatedAt': now,
          },
        })
      )
    }

    // ============================================
    // 9. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        message: `Admin "${username}" updated successfully`,
        username,
        weddingId,
        ...(email !== undefined && { email: email || null }),
        ...(role !== undefined && { role }),
        updatedAt: now,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/weddings/{weddingId}/users/{username}',
        operation: 'update-owner',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
