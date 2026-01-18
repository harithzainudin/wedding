/**
 * Create Staff Endpoint (Super Admin Only)
 *
 * Creates a new staff member account.
 * Staff members can be assigned to multiple weddings.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
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

interface CreateStaffInput {
  username: string
  password: string
  email?: string
}

function validateCreateStaffInput(
  body: unknown
): { valid: true; data: CreateStaffInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as Record<string, unknown>

  // Validate username
  if (typeof input.username !== 'string' || !isValidUsername(input.username)) {
    return {
      valid: false,
      error:
        'Invalid username. Must be 3-30 characters, start with a letter, alphanumeric and underscores only',
    }
  }

  // Validate password
  if (typeof input.password !== 'string' || input.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }

  // Validate email (optional)
  if (input.email !== undefined && input.email !== '') {
    if (typeof input.email !== 'string' || !isValidEmail(input.email)) {
      return { valid: false, error: 'Invalid email format' }
    }
  }

  return {
    valid: true,
    data: {
      username: input.username,
      password: input.password,
      ...(input.email &&
        typeof input.email === 'string' &&
        input.email !== '' && { email: input.email }),
    },
  }
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
    // 2. Parse and Validate Input
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

    const validation = validateCreateStaffInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { username, password, email } = validation.data

    // ============================================
    // 3. Check for Existing Username
    // ============================================
    const adminKey = Keys.weddingAdmin(username)
    const existingAdmin = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
      })
    )

    if (existingAdmin.Item) {
      return createErrorResponse(
        409,
        `Username "${username}" is already taken`,
        context,
        'USERNAME_EXISTS'
      )
    }

    // ============================================
    // 4. Create Staff Member
    // ============================================
    const now = new Date().toISOString()
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const gsiKeys = Keys.gsi.allStaff(now)

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: {
          ...adminKey,
          username,
          passwordHash,
          ...(email && { email }),
          weddingIds: [],
          userType: 'staff',
          createdAt: now,
          createdBy: authResult.user.username,
          mustChangePassword: false,
          // GSI1: List all staff
          ...gsiKeys,
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      })
    )

    // ============================================
    // 5. Return Success
    // ============================================
    return createSuccessResponse(
      201,
      {
        message: 'Staff member created successfully',
        staff: {
          username,
          email,
          weddingIds: [],
          createdAt: now,
        },
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/staff',
        operation: 'create-staff',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
