/**
 * Create Wedding Endpoint (Super Admin Only)
 *
 * Creates a new wedding and its owner account.
 * - Creates wedding record with unique slug
 * - Creates slug lookup record for public URL resolution
 * - Creates owner account with temporary password
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { validateCreateWeddingInput } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const BCRYPT_ROUNDS = 12

/**
 * Generate a random temporary password
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
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

    const validation = validateCreateWeddingInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { slug, displayName, ownerUsername, ownerEmail, weddingDate, plan } = validation.data

    // ============================================
    // 3. Check for Existing Slug
    // ============================================
    const slugKey = Keys.weddingSlug(slug)
    const existingSlug = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: slugKey,
      })
    )

    if (existingSlug.Item) {
      return createErrorResponse(
        409,
        `Wedding slug "${slug}" is already taken`,
        context,
        'SLUG_EXISTS'
      )
    }

    // ============================================
    // 4. Check for Existing Username
    // ============================================
    const adminKey = Keys.weddingAdmin(ownerUsername)
    const existingAdmin = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: adminKey,
      })
    )

    if (existingAdmin.Item) {
      return createErrorResponse(
        409,
        `Username "${ownerUsername}" is already taken`,
        context,
        'USERNAME_EXISTS'
      )
    }

    // ============================================
    // 5. Generate IDs and Timestamps
    // ============================================
    const weddingId = randomUUID()
    const now = new Date().toISOString()
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)

    // ============================================
    // 6. Create Wedding + Slug + Owner in Transaction
    // ============================================
    const weddingKey = Keys.wedding(weddingId)
    const gsiKeys = Keys.gsi.allWeddings(now)
    const gsi2Keys = Keys.gsi2.bySlug(slug)

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          // Wedding record
          {
            Put: {
              TableName: Resource.AppDataTable.name,
              Item: {
                ...weddingKey,
                weddingId,
                slug,
                displayName,
                status: 'active',
                ownerId: ownerUsername,
                coOwnerIds: [],
                weddingDate,
                plan: plan ?? 'free',
                createdAt: now,
                createdBy: authResult.user.username,
                // GSI1: List all weddings
                ...gsiKeys,
                // GSI2: Slug lookup
                ...gsi2Keys,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          // Slug lookup record
          {
            Put: {
              TableName: Resource.AppDataTable.name,
              Item: {
                ...slugKey,
                weddingId,
                slug,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          // Owner account
          {
            Put: {
              TableName: Resource.AppDataTable.name,
              Item: {
                ...adminKey,
                username: ownerUsername,
                passwordHash,
                email: ownerEmail,
                weddingIds: [weddingId],
                createdAt: now,
                createdBy: authResult.user.username,
                mustChangePassword: true,
                // GSI1: List all admins
                gsi1pk: 'ADMINS',
                gsi1sk: now,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          // Wedding-Admin link
          {
            Put: {
              TableName: Resource.AppDataTable.name,
              Item: {
                ...Keys.weddingAdminLink(weddingId, ownerUsername),
                role: 'owner',
                addedAt: now,
                addedBy: authResult.user.username,
              },
            },
          },
        ],
      })
    )

    // ============================================
    // 7. Return Success with Temporary Password
    // ============================================
    return createSuccessResponse(
      201,
      {
        wedding: {
          weddingId,
          slug,
          displayName,
          status: 'active',
          weddingDate,
          plan: plan ?? 'free',
          createdAt: now,
        },
        owner: {
          username: ownerUsername,
          email: ownerEmail,
          temporaryPassword: tempPassword, // Send to owner via email in production
          mustChangePassword: true,
        },
        publicUrl: `/${slug}`,
        adminUrl: `/${slug}/admin`,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/weddings',
        operation: 'create-wedding',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
