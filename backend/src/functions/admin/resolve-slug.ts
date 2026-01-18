/**
 * Resolve Wedding Slug Endpoint
 *
 * Resolves a wedding slug to its weddingId.
 * Requires authentication - returns the weddingId only if the user has access.
 *
 * Route: GET /admin/resolve-slug/{slug}
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import { resolveWeddingSlug, userHasWeddingAccess } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Require authentication
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    const slug = event.pathParameters?.slug
    if (!slug) {
      return createErrorResponse(400, 'Wedding slug is required', context, 'MISSING_SLUG')
    }

    // Resolve the slug to get wedding context
    const wedding = await resolveWeddingSlug(docClient, slug)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // Check access - super admins can access any wedding, others need explicit access
    const isSuperAdmin = authResult.user.type === 'super' || authResult.user.isMaster
    if (!isSuperAdmin) {
      // For wedding admins, check if they have access to this wedding
      const hasAccess = userHasWeddingAccess(wedding, authResult.user.username)
      if (!hasAccess) {
        return createErrorResponse(
          403,
          'You do not have access to this wedding',
          context,
          'ACCESS_DENIED'
        )
      }
    }

    return createSuccessResponse(
      200,
      {
        weddingId: wedding.weddingId,
        slug: wedding.slug,
        displayName: wedding.displayName,
        status: wedding.status,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /admin/resolve-slug/{slug}',
        operation: 'resolve-slug',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
