/**
 * Get Single Wedding Endpoint (Super Admin Only)
 *
 * Returns wedding details along with the list of admins who have access.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface WeddingAdmin {
  username: string
  email?: string
  role: 'owner' | 'coowner'
  addedAt: string
  addedBy: string
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
    // 3. Fetch Wedding Record
    // ============================================
    const weddingKey = Keys.wedding(weddingId)
    const weddingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
      })
    )

    if (!weddingResult.Item) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    const wedding = weddingResult.Item

    // ============================================
    // 4. Fetch Admins Linked to This Wedding
    // ============================================
    const adminsResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `WEDDING#${weddingId}#ADMINS`,
        },
      })
    )

    // Fetch admin details for each linked user
    const admins: WeddingAdmin[] = []
    for (const link of adminsResult.Items ?? []) {
      const username = link.sk as string
      const adminKey = Keys.weddingAdmin(username)

      const adminResult = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: adminKey,
        })
      )

      if (adminResult.Item) {
        admins.push({
          username: adminResult.Item.username as string,
          email: adminResult.Item.email as string | undefined,
          role: link.role as 'owner' | 'coowner',
          addedAt: link.addedAt as string,
          addedBy: link.addedBy as string,
        })
      }
    }

    // ============================================
    // 5. Return Wedding Details with Admins
    // ============================================
    return createSuccessResponse(
      200,
      {
        wedding: {
          weddingId: wedding.weddingId as string,
          slug: wedding.slug as string,
          displayName: wedding.displayName as string,
          status: wedding.status as string,
          weddingDate: wedding.weddingDate as string | undefined,
          plan: wedding.plan as string,
          ownerId: wedding.ownerId as string,
          coOwnerIds: (wedding.coOwnerIds as string[]) ?? [],
          createdAt: wedding.createdAt as string,
          createdBy: wedding.createdBy as string | undefined,
          updatedAt: wedding.updatedAt as string | undefined,
        },
        admins,
        publicUrl: `/${wedding.slug as string}`,
        adminUrl: `/${wedding.slug as string}/admin`,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /superadmin/weddings/{weddingId}',
        operation: 'get-wedding',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
