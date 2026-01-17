/**
 * List Weddings Endpoint (Super Admin Only)
 *
 * Returns all weddings in the platform with pagination.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface WeddingListItem {
  weddingId: string
  slug: string
  displayName: string
  status: 'active' | 'inactive' | 'archived'
  weddingDate: string
  plan: string
  ownerId: string
  createdAt: string
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
    // 2. Parse Query Parameters
    // ============================================
    const limit = Math.min(parseInt(event.queryStringParameters?.limit ?? '50', 10), 100)
    const lastKey = event.queryStringParameters?.lastKey
    const status = event.queryStringParameters?.status // Filter by status

    // ============================================
    // 3. Query Weddings from GSI1
    // ============================================
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'WEDDINGS',
          ...(status && { ':status': status }),
        },
        ...(status && {
          FilterExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
        }),
        Limit: limit,
        ScanIndexForward: false, // Most recent first
        ...(lastKey && {
          ExclusiveStartKey: JSON.parse(Buffer.from(lastKey, 'base64').toString()),
        }),
      })
    )

    // ============================================
    // 4. Format Response
    // ============================================
    const weddings: WeddingListItem[] = (result.Items ?? []).map((item) => ({
      weddingId: item.weddingId as string,
      slug: item.slug as string,
      displayName: item.displayName as string,
      status: item.status as 'active' | 'inactive' | 'archived',
      weddingDate: item.weddingDate as string,
      plan: item.plan as string,
      ownerId: item.ownerId as string,
      createdAt: item.createdAt as string,
    }))

    const nextKey = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null

    return createSuccessResponse(
      200,
      {
        weddings,
        total: weddings.length,
        hasMore: !!result.LastEvaluatedKey,
        nextKey,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /superadmin/weddings',
        operation: 'list-weddings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
