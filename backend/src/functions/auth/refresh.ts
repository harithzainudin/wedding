/**
 * Token Refresh Endpoint
 *
 * Refreshes access tokens using a valid refresh token.
 * Supports all token types (super admin, wedding admin, legacy).
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import {
  validateRefreshToken,
  generateSuperAdminTokens,
  generateWeddingAdminTokens,
  generateAccessToken,
  generateRefreshToken,
} from '../shared/auth'
import { logError } from '../shared/logger'

interface RefreshRequest {
  refreshToken: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: RefreshRequest
    try {
      body = JSON.parse(event.body) as RefreshRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    if (!body.refreshToken) {
      return createErrorResponse(400, 'Refresh token is required', context, 'VALIDATION_ERROR')
    }

    // Validate the refresh token
    const authResult = validateRefreshToken(body.refreshToken)

    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'TOKEN_INVALID')
    }

    const user = authResult.user

    // Generate new tokens based on user type
    if (user.type === 'super') {
      const tokens = generateSuperAdminTokens(user.username)
      return createSuccessResponse(
        200,
        {
          // Legacy fields
          token: tokens.accessToken,
          isMaster: true,
          // New fields
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          username: user.username,
          userType: 'super',
        },
        context
      )
    }

    if (user.type === 'wedding') {
      const tokens = generateWeddingAdminTokens(
        user.username,
        user.weddingIds,
        user.primaryWeddingId ?? user.weddingIds[0] ?? ''
      )
      return createSuccessResponse(
        200,
        {
          // Legacy fields
          token: tokens.accessToken,
          isMaster: false,
          // New fields
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          username: user.username,
          userType: 'wedding',
          weddingIds: user.weddingIds,
          primaryWeddingId: user.primaryWeddingId,
        },
        context
      )
    }

    // Legacy token - generate legacy tokens
    const accessToken = generateAccessToken(user.username, user.isMaster)
    const refreshToken = generateRefreshToken(user.username, user.isMaster)

    return createSuccessResponse(
      200,
      {
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
        username: user.username,
        isMaster: user.isMaster,
        userType: 'legacy',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /auth/refresh',
        operation: 'refresh-token',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
