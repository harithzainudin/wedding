/**
 * List Staff Endpoint (Super Admin Only)
 *
 * Returns all staff members in the platform.
 * Staff members are users with userType='staff' who can be assigned to multiple weddings.
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

interface StaffListItem {
  username: string
  email?: string
  weddingIds: string[]
  createdAt: string
  createdBy: string
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

    // ============================================
    // 3. Query Staff from GSI1
    // ============================================
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'STAFF',
        },
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
    const staff: StaffListItem[] = (result.Items ?? []).map((item) => ({
      username: item.username as string,
      email: item.email as string | undefined,
      weddingIds: (item.weddingIds as string[]) ?? [],
      createdAt: item.createdAt as string,
      createdBy: item.createdBy as string,
    }))

    const nextKey = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null

    return createSuccessResponse(
      200,
      {
        staff,
        total: staff.length,
        hasMore: !!result.LastEvaluatedKey,
        nextKey,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /superadmin/staff',
        operation: 'list-staff',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
