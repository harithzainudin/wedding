/**
 * Unified Login Endpoint
 *
 * Supports:
 * 1. Super Admin login (SUPERADMIN#{username})
 * 2. Wedding Admin login (ADMIN#{username})
 * 3. Legacy master password (for backward compatibility)
 *
 * Returns appropriate token type based on user type.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import {
  generateSuperAdminTokens,
  generateWeddingAdminTokens,
  generateAccessToken,
  generateRefreshToken,
} from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface LoginRequest {
  username: string
  password: string
}

interface SuperAdminRecord {
  pk: string
  sk: string
  username: string
  passwordHash: string
  email?: string
  createdAt: string
  createdBy?: string
}

interface WeddingAdminRecord {
  pk: string
  sk: string
  username: string
  passwordHash: string
  email?: string
  weddingIds: string[]
  createdAt: string
  createdBy?: string
  mustChangePassword?: boolean
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let username: string | undefined

  try {
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: LoginRequest
    try {
      body = JSON.parse(event.body) as LoginRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    if (!body.username || !body.password) {
      return createErrorResponse(
        400,
        'Username and password are required',
        context,
        'VALIDATION_ERROR'
      )
    }

    username = body.username.trim().toLowerCase()

    // ============================================
    // 1. Check for legacy master password (backward compatibility)
    // ============================================
    const masterPassword = Resource.AdminPassword.value
    if (username === 'master' && body.password === masterPassword) {
      // Generate super admin tokens for master
      const tokens = generateSuperAdminTokens('master')
      return createSuccessResponse(
        200,
        {
          // Legacy fields for backward compatibility
          token: tokens.accessToken,
          isMaster: true,
          // New multi-tenant fields
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          username: 'master',
          userType: 'super',
        },
        context
      )
    }

    // ============================================
    // 2. Check for Super Admin in DynamoDB
    // ============================================
    const superAdminKey = Keys.superAdmin(username)
    const superAdminResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: superAdminKey,
      })
    )

    if (superAdminResult.Item) {
      const superAdmin = superAdminResult.Item as SuperAdminRecord
      const isValidPassword = await bcrypt.compare(body.password, superAdmin.passwordHash)

      if (isValidPassword) {
        const tokens = generateSuperAdminTokens(username)
        return createSuccessResponse(
          200,
          {
            // Legacy fields for backward compatibility
            token: tokens.accessToken,
            isMaster: true,
            // New multi-tenant fields
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            username,
            userType: 'super',
          },
          context
        )
      }
      // Password invalid, fall through to check wedding admin
    }

    // ============================================
    // 3. Check for Wedding Admin in DynamoDB
    // ============================================
    const weddingAdminKey = Keys.weddingAdmin(username)
    const weddingAdminResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingAdminKey,
      })
    )

    if (weddingAdminResult.Item) {
      const weddingAdmin = weddingAdminResult.Item as WeddingAdminRecord
      const isValidPassword = await bcrypt.compare(body.password, weddingAdmin.passwordHash)

      if (isValidPassword) {
        const weddingIds = weddingAdmin.weddingIds ?? []
        const primaryWeddingId = weddingIds[0] ?? ''

        const tokens = generateWeddingAdminTokens(username, weddingIds, primaryWeddingId)

        return createSuccessResponse(
          200,
          {
            // Legacy fields for backward compatibility
            token: tokens.accessToken,
            isMaster: false,
            // New multi-tenant fields
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            username,
            userType: 'wedding',
            weddingIds,
            primaryWeddingId,
            mustChangePassword: weddingAdmin.mustChangePassword ?? false,
          },
          context
        )
      }
    }

    // ============================================
    // 4. Legacy Admin check (for backward compatibility during migration)
    // ============================================
    const legacyAdminResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `ADMIN#${username}`,
          sk: 'PROFILE',
        },
      })
    )

    if (legacyAdminResult.Item) {
      const passwordHash = legacyAdminResult.Item.passwordHash as string
      const isValidPassword = await bcrypt.compare(body.password, passwordHash)

      if (isValidPassword) {
        // Generate legacy tokens for old admin accounts
        const accessToken = generateAccessToken(username, false)
        const refreshToken = generateRefreshToken(username, false)
        const mustChangePassword = legacyAdminResult.Item.mustChangePassword === true

        return createSuccessResponse(
          200,
          {
            token: accessToken,
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
            username,
            isMaster: false,
            userType: 'legacy',
            ...(mustChangePassword && { mustChangePassword: true }),
          },
          context
        )
      }
    }

    // No valid credentials found
    return createErrorResponse(401, 'Invalid username or password', context, 'AUTH_ERROR')
  } catch (error) {
    logError(
      {
        endpoint: 'POST /auth/login',
        operation: 'authenticate',
        requestId: context.awsRequestId,
        input: { username },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
