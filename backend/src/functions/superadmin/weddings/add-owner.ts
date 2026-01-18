/**
 * Add Owner to Wedding Endpoint (Super Admin Only)
 *
 * Creates a new admin account or links an existing admin to a wedding.
 * Supports two modes:
 * - Create new user: { username, password, email? }
 * - Link existing user: { existingUsername }
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
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

interface CreateNewUserInput {
  username: string
  password: string
  email?: string
  roleLabel?: string // 'Bride', 'Groom', 'Parent', or custom text
}

interface LinkExistingUserInput {
  existingUsername: string
}

type AddOwnerInput = CreateNewUserInput | LinkExistingUserInput

function isCreateNewUser(input: AddOwnerInput): input is CreateNewUserInput {
  return 'username' in input && 'password' in input
}

function validateAddOwnerInput(
  body: unknown
): { valid: true; data: AddOwnerInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as Record<string, unknown>

  // Mode 1: Link existing user
  if (input.existingUsername !== undefined) {
    if (typeof input.existingUsername !== 'string') {
      return { valid: false, error: 'existingUsername must be a string' }
    }
    if (!isValidUsername(input.existingUsername)) {
      return {
        valid: false,
        error: 'Invalid username format (3-30 alphanumeric characters or underscores)',
      }
    }
    return { valid: true, data: { existingUsername: input.existingUsername } }
  }

  // Mode 2: Create new user
  if (input.username === undefined || input.password === undefined) {
    return { valid: false, error: 'Either provide (username, password) or (existingUsername)' }
  }

  if (typeof input.username !== 'string') {
    return { valid: false, error: 'username must be a string' }
  }

  if (!isValidUsername(input.username)) {
    return {
      valid: false,
      error: 'Invalid username format (3-30 alphanumeric characters or underscores)',
    }
  }

  if (typeof input.password !== 'string' || input.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }

  const data: CreateNewUserInput = {
    username: input.username,
    password: input.password,
  }

  if (input.email !== undefined) {
    if (typeof input.email !== 'string') {
      return { valid: false, error: 'email must be a string' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return { valid: false, error: 'Invalid email format' }
    }
    data.email = input.email
  }

  // Validate roleLabel (optional - any string up to 50 chars)
  if (input.roleLabel !== undefined && input.roleLabel !== '') {
    if (typeof input.roleLabel !== 'string' || input.roleLabel.trim().length > 50) {
      return { valid: false, error: 'Role label must be a string up to 50 characters' }
    }
    data.roleLabel = input.roleLabel.trim()
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

    const validation = validateAddOwnerInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

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

    const now = new Date().toISOString()

    // ============================================
    // 5. Handle Based on Input Mode
    // ============================================
    if (isCreateNewUser(validation.data)) {
      // Mode: Create New Client User
      const { username, password, email, roleLabel } = validation.data

      // Check if username already exists
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

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            // Create new client account
            {
              Put: {
                TableName: Resource.AppDataTable.name,
                Item: {
                  ...adminKey,
                  username,
                  passwordHash,
                  ...(email && { email }),
                  weddingIds: [weddingId],
                  userType: 'client',
                  ...(roleLabel && { roleLabel }),
                  createdAt: now,
                  createdBy: authResult.user.username,
                  mustChangePassword: true,
                  gsi1pk: 'ADMINS',
                  gsi1sk: now,
                },
                ConditionExpression: 'attribute_not_exists(pk)',
              },
            },
            // Create wedding-admin link
            {
              Put: {
                TableName: Resource.AppDataTable.name,
                Item: {
                  ...Keys.weddingAdminLink(weddingId, username),
                  role: 'coowner',
                  addedAt: now,
                  addedBy: authResult.user.username,
                },
              },
            },
          ],
        })
      )

      return createSuccessResponse(
        201,
        {
          message: 'New client created and added to wedding',
          admin: {
            username,
            email,
            role: 'coowner',
            userType: 'client',
            roleLabel,
            mustChangePassword: true,
          },
          weddingId,
        },
        context
      )
    } else {
      // Mode: Link Existing User
      const { existingUsername } = validation.data

      // Verify user exists
      const adminKey = Keys.weddingAdmin(existingUsername)
      const existingAdmin = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: adminKey,
        })
      )

      if (!existingAdmin.Item) {
        return createErrorResponse(
          404,
          `User "${existingUsername}" not found`,
          context,
          'USER_NOT_FOUND'
        )
      }

      // Check if already linked
      const linkKey = Keys.weddingAdminLink(weddingId, existingUsername)
      const existingLink = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: linkKey,
        })
      )

      if (existingLink.Item) {
        return createErrorResponse(
          409,
          `User "${existingUsername}" already has access to this wedding`,
          context,
          'ALREADY_LINKED'
        )
      }

      // Get current weddingIds
      const currentWeddingIds = (existingAdmin.Item.weddingIds as string[]) ?? []

      // Add weddingId to user's weddingIds and create link
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            // Update admin's weddingIds
            {
              Update: {
                TableName: Resource.AppDataTable.name,
                Key: adminKey,
                UpdateExpression: 'SET weddingIds = :weddingIds',
                ExpressionAttributeValues: {
                  ':weddingIds': [...currentWeddingIds, weddingId],
                },
              },
            },
            // Create wedding-admin link
            {
              Put: {
                TableName: Resource.AppDataTable.name,
                Item: {
                  ...linkKey,
                  role: 'coowner',
                  addedAt: now,
                  addedBy: authResult.user.username,
                },
              },
            },
          ],
        })
      )

      return createSuccessResponse(
        200,
        {
          message: 'Existing user linked to wedding',
          admin: {
            username: existingUsername,
            email: existingAdmin.Item.email as string | undefined,
            role: 'coowner',
          },
          weddingId,
        },
        context
      )
    }
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/weddings/{weddingId}/users',
        operation: 'add-owner',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
