/**
 * Hard Delete Wedding Endpoint (Super Admin Only)
 *
 * Permanently deletes a wedding and ALL associated data from DynamoDB and S3.
 * This action is irreversible. Only works on archived weddings.
 *
 * DELETE /superadmin/weddings/{weddingId}/hard-delete
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type ObjectIdentifier,
} from '@aws-sdk/client-s3'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId } from '../../shared/validation'
import { Resource } from 'sst'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

interface DeletionCounts {
  settings: number
  admins: number
  deletedAdmins: number
  rsvps: number
  images: number
  music: number
  gifts: number
  giftReservations: number
  parking: number
  qrCodes: number
  s3Objects: number
}

interface AdminCleanupResult {
  cleanedAdmins: string[] // Admins whose weddingIds were updated
  deletedAdmins: string[] // Admins whose profiles were deleted (had no other weddings)
}

/**
 * Query all items with a given pk prefix and delete them in batches
 */
async function queryAndDeleteItems(pkPrefix: string, skPrefix?: string): Promise<number> {
  let deletedCount = 0
  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const queryParams: {
      TableName: string
      KeyConditionExpression: string
      ExpressionAttributeValues: Record<string, string>
      ExclusiveStartKey?: Record<string, unknown>
    } = {
      TableName: Resource.AppDataTable.name,
      KeyConditionExpression: skPrefix ? 'pk = :pk AND begins_with(sk, :sk)' : 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': pkPrefix,
        ...(skPrefix ? { ':sk': skPrefix } : {}),
      },
      ExclusiveStartKey: lastEvaluatedKey,
    }

    const result = await docClient.send(new QueryCommand(queryParams))
    const items = result.Items ?? []
    lastEvaluatedKey = result.LastEvaluatedKey

    if (items.length > 0) {
      // DynamoDB BatchWrite supports max 25 items
      for (let i = 0; i < items.length; i += 25) {
        const batch = items.slice(i, i + 25)
        const deleteRequests = batch.map((item) => ({
          DeleteRequest: {
            Key: {
              pk: item.pk,
              sk: item.sk,
            },
          },
        }))

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [Resource.AppDataTable.name]: deleteRequests,
            },
          })
        )
        deletedCount += batch.length
      }
    }
  } while (lastEvaluatedKey)

  return deletedCount
}

/**
 * Query items using GSI and delete them
 */
async function queryGsiAndDeleteItems(gsi1pkValue: string): Promise<number> {
  let deletedCount = 0
  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': gsi1pkValue,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    const items = result.Items ?? []
    lastEvaluatedKey = result.LastEvaluatedKey

    if (items.length > 0) {
      for (let i = 0; i < items.length; i += 25) {
        const batch = items.slice(i, i + 25)
        const deleteRequests = batch.map((item) => ({
          DeleteRequest: {
            Key: {
              pk: item.pk,
              sk: item.sk,
            },
          },
        }))

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [Resource.AppDataTable.name]: deleteRequests,
            },
          })
        )
        deletedCount += batch.length
      }
    }
  } while (lastEvaluatedKey)

  return deletedCount
}

/**
 * Remove weddingId from admin profiles and delete admin link records.
 * If an admin has no more weddings after removal, delete their profile entirely.
 * Returns the usernames of admins that were cleaned up and deleted.
 */
async function cleanupAdminProfiles(weddingId: string): Promise<AdminCleanupResult> {
  const cleanedAdmins: string[] = []
  const deletedAdmins: string[] = []
  let lastEvaluatedKey: Record<string, unknown> | undefined

  // Query all admin links for this wedding
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `WEDDING#${weddingId}#ADMINS`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    const items = result.Items ?? []
    lastEvaluatedKey = result.LastEvaluatedKey

    // For each admin link, update their profile to remove this weddingId
    for (const item of items) {
      const username = item.sk as string
      const adminKey = Keys.weddingAdmin(username)

      // Update admin profile to remove this weddingId from their weddingIds array
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: Resource.AppDataTable.name,
            Key: adminKey,
            UpdateExpression: 'DELETE weddingIds :weddingIdSet',
            ExpressionAttributeValues: {
              ':weddingIdSet': new Set([weddingId]),
            },
          })
        )

        // Check if admin has any remaining weddings
        const updatedAdmin = await docClient.send(
          new GetCommand({
            TableName: Resource.AppDataTable.name,
            Key: adminKey,
          })
        )

        if (updatedAdmin.Item) {
          const remainingWeddingIds = updatedAdmin.Item.weddingIds as
            | string[]
            | Set<string>
            | undefined
          const hasNoWeddings =
            !remainingWeddingIds ||
            (Array.isArray(remainingWeddingIds) && remainingWeddingIds.length === 0) ||
            (remainingWeddingIds instanceof Set && remainingWeddingIds.size === 0)

          if (hasNoWeddings) {
            // Delete the admin profile entirely
            await docClient.send(
              new DeleteCommand({
                TableName: Resource.AppDataTable.name,
                Key: adminKey,
              })
            )
            deletedAdmins.push(username)
            console.log({
              level: 'INFO',
              message: `Deleted empty admin profile: ${username}`,
              weddingId,
            })
          } else {
            cleanedAdmins.push(username)
          }
        }
      } catch {
        // If admin profile doesn't exist or update fails, continue
        // The admin link will still be deleted
        console.log({
          level: 'WARN',
          message: `Could not update admin profile for ${username}`,
          weddingId,
        })
      }

      // Delete the admin link record
      await docClient.send(
        new DeleteCommand({
          TableName: Resource.AppDataTable.name,
          Key: {
            pk: item.pk,
            sk: item.sk,
          },
        })
      )
    }
  } while (lastEvaluatedKey)

  return { cleanedAdmins, deletedAdmins }
}

/**
 * Delete all S3 objects with a given prefix
 */
async function deleteS3ObjectsByPrefix(prefix: string): Promise<number> {
  let deletedCount = 0
  let continuationToken: string | undefined

  do {
    const listResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: Resource.WeddingImageBucket.name,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    const objects = listResult.Contents ?? []
    continuationToken = listResult.NextContinuationToken

    if (objects.length > 0) {
      // DeleteObjects supports max 1000 items per request
      for (let i = 0; i < objects.length; i += 1000) {
        const batch = objects.slice(i, i + 1000)
        const objectsToDelete: ObjectIdentifier[] = batch
          .filter((obj) => obj.Key)
          .map((obj) => ({ Key: obj.Key! }))

        if (objectsToDelete.length > 0) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: Resource.WeddingImageBucket.name,
              Delete: {
                Objects: objectsToDelete,
                Quiet: true,
              },
            })
          )
          deletedCount += objectsToDelete.length
        }
      }
    }
  } while (continuationToken)

  return deletedCount
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let weddingId: string | undefined

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
    weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 3. Verify Wedding Exists and is Archived
    // ============================================
    const weddingKey = Keys.wedding(weddingId)
    const existingWedding = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
      })
    )

    if (!existingWedding.Item) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // Only allow hard delete on archived weddings
    if (existingWedding.Item.status !== 'archived') {
      return createErrorResponse(
        400,
        'Wedding must be archived before permanent deletion',
        context,
        'NOT_ARCHIVED'
      )
    }

    const weddingSlug = existingWedding.Item.slug as string

    console.log({
      level: 'INFO',
      endpoint: 'DELETE /superadmin/weddings/{weddingId}/hard-delete',
      operation: 'hard-delete-start',
      requestId: context.awsRequestId,
      weddingId,
      weddingSlug,
      deletedBy: authResult.user.username,
      timestamp: new Date().toISOString(),
    })

    // ============================================
    // 4. Delete All Wedding Data from DynamoDB
    // ============================================
    const counts: DeletionCounts = {
      settings: 0,
      admins: 0,
      deletedAdmins: 0,
      rsvps: 0,
      images: 0,
      music: 0,
      gifts: 0,
      giftReservations: 0,
      parking: 0,
      qrCodes: 0,
      s3Objects: 0,
    }

    // Delete settings (pk: WEDDING#{weddingId}#SETTINGS)
    counts.settings = await queryAndDeleteItems(`WEDDING#${weddingId}#SETTINGS`)

    // Clean up admin profiles and delete admin links
    // This removes weddingId from each admin's weddingIds array
    // If admin has no more weddings, delete their profile entirely
    const adminResult = await cleanupAdminProfiles(weddingId)
    counts.admins = adminResult.cleanedAdmins.length + adminResult.deletedAdmins.length
    counts.deletedAdmins = adminResult.deletedAdmins.length

    // Delete RSVPs using GSI
    counts.rsvps = await queryGsiAndDeleteItems(`WEDDING#${weddingId}#RSVPS`)

    // Delete images using GSI
    counts.images = await queryGsiAndDeleteItems(`WEDDING#${weddingId}#IMAGES`)

    // Delete music using GSI
    counts.music = await queryGsiAndDeleteItems(`WEDDING#${weddingId}#MUSIC`)

    // Delete gifts using GSI (also delete reservations)
    counts.gifts = await queryGsiAndDeleteItems(`WEDDING#${weddingId}#GIFTS`)
    counts.giftReservations = await queryGsiAndDeleteItems(`WEDDING#${weddingId}#RESERVATIONS`)

    // Delete parking images using GSI
    counts.parking = await queryGsiAndDeleteItems(`WEDDING#${weddingId}#PARKING`)

    // Delete QR codes - query by pk prefix since they may not have GSI
    // QR codes use pk: WEDDING#{weddingId}#QRCODE#{imageId}
    // We need to scan for these since they might not be indexed
    let qrCodeCount = 0
    let lastKey: Record<string, unknown> | undefined
    do {
      const scanResult = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': `WEDDING#${weddingId}#QRCODES`,
          },
          ExclusiveStartKey: lastKey,
        })
      )
      const items = scanResult.Items ?? []
      lastKey = scanResult.LastEvaluatedKey

      if (items.length > 0) {
        for (let i = 0; i < items.length; i += 25) {
          const batch = items.slice(i, i + 25)
          const deleteRequests = batch.map((item) => ({
            DeleteRequest: {
              Key: { pk: item.pk, sk: item.sk },
            },
          }))
          await docClient.send(
            new BatchWriteCommand({
              RequestItems: { [Resource.AppDataTable.name]: deleteRequests },
            })
          )
          qrCodeCount += batch.length
        }
      }
    } while (lastKey)
    counts.qrCodes = qrCodeCount

    // Delete the slug lookup record
    const slugKey = Keys.weddingSlug(weddingSlug)
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: slugKey,
      })
    )

    // Delete the wedding metadata record
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
      })
    )

    // ============================================
    // 5. Delete All S3 Objects for this Wedding
    // ============================================
    counts.s3Objects = await deleteS3ObjectsByPrefix(`weddings/${weddingId}/`)

    // ============================================
    // 6. Log and Return Success
    // ============================================
    console.log({
      level: 'INFO',
      endpoint: 'DELETE /superadmin/weddings/{weddingId}/hard-delete',
      operation: 'hard-delete-complete',
      requestId: context.awsRequestId,
      weddingId,
      weddingSlug,
      deletedBy: authResult.user.username,
      counts,
      cleanedAdmins: adminResult.cleanedAdmins,
      deletedAdmins: adminResult.deletedAdmins,
      timestamp: new Date().toISOString(),
    })

    return createSuccessResponse(
      200,
      {
        message: 'Wedding permanently deleted',
        weddingId,
        deletedAt: new Date().toISOString(),
        deletedBy: authResult.user.username,
        counts,
        cleanedAdmins: adminResult.cleanedAdmins,
        deletedAdmins: adminResult.deletedAdmins,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /superadmin/weddings/{weddingId}/hard-delete',
        operation: 'hard-delete-wedding',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
