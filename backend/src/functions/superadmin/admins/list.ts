/**
 * List Super Admins Endpoint (Master Only)
 *
 * Returns all super admin accounts in the platform.
 * Only accessible by the master account.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface SuperAdminListItem {
  username: string
  email?: string
  createdAt: string
  createdBy?: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Authorization: Require Super Admin + Master Check
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // Only master can list super admins
    if (authResult.user.username !== 'master') {
      return createErrorResponse(
        403,
        'Only master account can list super admins',
        context,
        'FORBIDDEN'
      )
    }

    // ============================================
    // 2. Scan for Super Admin Profiles
    // ============================================
    // Super admins are stored with pk: SUPERADMIN#{username}, sk: PROFILE
    // Since there are typically only a few super admins, a scan is acceptable
    const result = await docClient.send(
      new ScanCommand({
        TableName: Resource.AppDataTable.name,
        FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'SUPERADMIN#',
          ':sk': 'PROFILE',
        },
        ProjectionExpression: 'pk, email, createdAt, createdBy',
      })
    )

    // ============================================
    // 3. Format Response
    // ============================================
    const superAdmins: SuperAdminListItem[] = (result.Items ?? [])
      .map((item) => {
        // Extract username from pk (SUPERADMIN#{username})
        const pk = item.pk as string
        const username = pk.replace('SUPERADMIN#', '')

        return {
          username,
          email: item.email as string | undefined,
          createdAt: (item.createdAt as string) ?? new Date().toISOString(),
          createdBy: item.createdBy as string | undefined,
        }
      })
      // Exclude master from the list (master can't have password reset)
      .filter((admin) => admin.username !== 'master')
      // Sort by createdAt descending (most recent first)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return createSuccessResponse(
      200,
      {
        superAdmins,
        total: superAdmins.length,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /superadmin/admins',
        operation: 'listSuperAdmins',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
