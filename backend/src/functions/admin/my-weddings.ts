/**
 * Get My Weddings Endpoint
 *
 * Returns all weddings assigned to the authenticated user.
 * - Super admins: Get all weddings
 * - Wedding admins: Get weddings from their weddingIds array
 * - Legacy users: Empty array
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface WeddingMetadata {
  weddingId: string
  slug: string
  displayName: string
  status: 'active' | 'draft' | 'archived'
  weddingDate?: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Authentication
    // ============================================
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    const { user } = authResult
    let weddings: WeddingMetadata[] = []

    // ============================================
    // 2. Fetch weddings based on user type
    // ============================================
    if (user.type === 'super' || user.isMaster) {
      // Super admins get all weddings
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': 'WEDDINGS',
          },
          ScanIndexForward: false, // Most recent first
        })
      )

      weddings = (result.Items ?? []).map((item) => ({
        weddingId: item.weddingId as string,
        slug: item.slug as string,
        displayName: item.displayName as string,
        status: item.status as 'active' | 'draft' | 'archived',
        ...(item.weddingDate && { weddingDate: item.weddingDate as string }),
      }))
    } else if (user.type === 'wedding' && user.weddingIds.length > 0) {
      // Wedding admins get their assigned weddings via batch get
      const keys = user.weddingIds.map((weddingId) => Keys.wedding(weddingId))

      const result = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [Resource.AppDataTable.name]: {
              Keys: keys,
            },
          },
        })
      )

      const items = result.Responses?.[Resource.AppDataTable.name] ?? []
      weddings = items.map((item) => ({
        weddingId: item.weddingId as string,
        slug: item.slug as string,
        displayName: item.displayName as string,
        status: item.status as 'active' | 'draft' | 'archived',
        ...(item.weddingDate && { weddingDate: item.weddingDate as string }),
      }))
    }
    // Legacy users get empty array (no multi-tenant support)

    // ============================================
    // 3. Return Response
    // ============================================
    return createSuccessResponse(
      200,
      {
        weddings,
        primaryWeddingId: user.primaryWeddingId,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /admin/my-weddings',
        operation: 'get-my-weddings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to fetch weddings', context, 'INTERNAL_ERROR')
  }
}
