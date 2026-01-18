/**
 * Create Wedding Endpoint (Super Admin Only)
 *
 * Creates a new wedding with an owner. Supports two modes:
 * 1. Assign Staff: Assign an existing staff member as owner
 * 2. Create Client: Create a new client user as owner
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
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

    const {
      slug,
      displayName,
      weddingDate,
      plan,
      assignStaffUsername,
      ownerUsername,
      ownerEmail,
      roleLabel,
    } = validation.data

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

    const weddingId = randomUUID()
    const now = new Date().toISOString()
    const weddingKey = Keys.wedding(weddingId)
    const gsiKeys = Keys.gsi.allWeddings(now)
    const gsi2Keys = Keys.gsi2.bySlug(slug)

    // ============================================
    // MODE 0: No Owner Assignment (Super Admin manages)
    // ============================================
    if (!assignStaffUsername && !ownerUsername) {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            // Wedding record (no ownerId - super admin manages directly)
            {
              Put: {
                TableName: Resource.AppDataTable.name,
                Item: {
                  ...weddingKey,
                  weddingId,
                  slug,
                  displayName,
                  status: 'active',
                  // No ownerId - super admin manages directly
                  coOwnerIds: [],
                  weddingDate,
                  plan: plan ?? 'free',
                  createdAt: now,
                  createdBy: authResult.user.username,
                  ...gsiKeys,
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
            // NO wedding-admin link - super admin has full access anyway
          ],
        })
      )

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
          // No owner field in response - super admin manages directly
          publicUrl: `/${slug}`,
          adminUrl: `/${slug}/admin`,
        },
        context
      )
    }

    // ============================================
    // MODE 1: Assign Existing Staff Member
    // ============================================
    if (assignStaffUsername) {
      const staffKey = Keys.weddingAdmin(assignStaffUsername)
      const existingStaff = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: staffKey,
        })
      )

      if (!existingStaff.Item) {
        return createErrorResponse(
          404,
          `Staff member "${assignStaffUsername}" not found`,
          context,
          'STAFF_NOT_FOUND'
        )
      }

      if (existingStaff.Item.userType !== 'staff') {
        return createErrorResponse(
          400,
          `User "${assignStaffUsername}" is not a staff member`,
          context,
          'NOT_STAFF'
        )
      }

      // Get current weddingIds
      const currentWeddingIds = (existingStaff.Item.weddingIds as string[]) ?? []

      // Create wedding and link staff in transaction
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
                  ownerId: assignStaffUsername,
                  coOwnerIds: [],
                  weddingDate,
                  plan: plan ?? 'free',
                  createdAt: now,
                  createdBy: authResult.user.username,
                  ...gsiKeys,
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
            // Wedding-Admin link
            {
              Put: {
                TableName: Resource.AppDataTable.name,
                Item: {
                  ...Keys.weddingAdminLink(weddingId, assignStaffUsername),
                  role: 'owner',
                  addedAt: now,
                  addedBy: authResult.user.username,
                },
              },
            },
          ],
        })
      )

      // Update staff's weddingIds (separate operation to avoid transaction limits)
      await docClient.send(
        new UpdateCommand({
          TableName: Resource.AppDataTable.name,
          Key: staffKey,
          UpdateExpression: 'SET weddingIds = :weddingIds',
          ExpressionAttributeValues: {
            ':weddingIds': [...currentWeddingIds, weddingId],
          },
        })
      )

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
            username: assignStaffUsername,
            email: existingStaff.Item.email as string | undefined,
            linked: true,
            userType: 'staff',
          },
          publicUrl: `/${slug}`,
          adminUrl: `/${slug}/admin`,
        },
        context
      )
    }

    // ============================================
    // MODE 2: Create New Client User
    // ============================================
    if (!ownerUsername) {
      return createErrorResponse(400, 'Owner username is required', context, 'MISSING_OWNER')
    }

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

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)

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
                ...gsiKeys,
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
          // Client account
          {
            Put: {
              TableName: Resource.AppDataTable.name,
              Item: {
                ...adminKey,
                username: ownerUsername,
                passwordHash,
                ...(ownerEmail && { email: ownerEmail }),
                weddingIds: [weddingId],
                userType: 'client',
                ...(roleLabel && { roleLabel }),
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
          temporaryPassword: tempPassword,
          mustChangePassword: true,
          userType: 'client',
          roleLabel,
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
