/**
 * Cleanup Orphan Data Endpoint (Super Admin Only)
 *
 * One-time cleanup script to remove legacy single-tenant data
 * that doesn't follow the multi-tenant key pattern.
 *
 * POST /superadmin/cleanup-orphan-data
 *
 * Request body:
 * {
 *   "dryRun": true  // Set to false to actually delete
 * }
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireSuperAdmin } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { Resource } from 'sst'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

interface OrphanData {
  pk: string
  sk: string
  type: string
}

interface CleanupResult {
  dryRun: boolean
  orphanItems: {
    images: OrphanData[]
    music: OrphanData[]
    gifts: OrphanData[]
    giftReservations: OrphanData[]
    parking: OrphanData[]
    rsvps: OrphanData[]
    settings: OrphanData[]
    schedule: OrphanData[]
  }
  orphanAdmins: {
    username: string
    orphanWeddingIds: string[]
  }[]
  orphanS3Objects: string[]
  deletedCounts: {
    images: number
    music: number
    gifts: number
    giftReservations: number
    parking: number
    rsvps: number
    settings: number
    schedule: number
    adminWeddingIds: number
    s3Objects: number
  }
}

/**
 * Scan the entire table to find orphan items
 */
async function findOrphanItems(): Promise<CleanupResult['orphanItems']> {
  const orphanItems: CleanupResult['orphanItems'] = {
    images: [],
    music: [],
    gifts: [],
    giftReservations: [],
    parking: [],
    rsvps: [],
    settings: [],
    schedule: [],
  }

  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: Resource.AppDataTable.name,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    const items = result.Items ?? []
    lastEvaluatedKey = result.LastEvaluatedKey

    for (const item of items) {
      const pk = item.pk as string
      const sk = item.sk as string

      // Legacy IMAGE# pattern (should be WEDDING#{id}#IMAGE#)
      if (pk.startsWith('IMAGE#') && !pk.includes('WEDDING#')) {
        orphanItems.images.push({ pk, sk, type: 'legacy-image' })
      }
      // Legacy MUSIC# pattern
      else if (pk.startsWith('MUSIC#') && !pk.includes('WEDDING#')) {
        orphanItems.music.push({ pk, sk, type: 'legacy-music' })
      }
      // Legacy GIFT# pattern (including reservations)
      else if (pk.startsWith('GIFT#') && !pk.includes('WEDDING#')) {
        if (sk.startsWith('RESERVATION#')) {
          orphanItems.giftReservations.push({ pk, sk, type: 'legacy-gift-reservation' })
        } else {
          orphanItems.gifts.push({ pk, sk, type: 'legacy-gift' })
        }
      }
      // Legacy PARKING# pattern
      else if (pk.startsWith('PARKING#') && !pk.includes('WEDDING#')) {
        orphanItems.parking.push({ pk, sk, type: 'legacy-parking' })
      }
      // Legacy RSVP# pattern
      else if (pk.startsWith('RSVP#') && !pk.includes('WEDDING#')) {
        orphanItems.rsvps.push({ pk, sk, type: 'legacy-rsvp' })
      }
      // Legacy SETTINGS pattern (should be WEDDING#{id}#SETTINGS)
      else if (pk === 'SETTINGS' && !pk.includes('WEDDING#')) {
        orphanItems.settings.push({ pk, sk, type: 'legacy-settings' })
      }
      // Legacy SCHEDULE pattern
      else if (pk === 'SCHEDULE' && !pk.includes('WEDDING#')) {
        orphanItems.schedule.push({ pk, sk, type: 'legacy-schedule' })
      }
    }
  } while (lastEvaluatedKey)

  return orphanItems
}

/**
 * Find admin profiles with wedding IDs that don't exist
 */
async function findOrphanAdmins(): Promise<CleanupResult['orphanAdmins']> {
  const orphanAdmins: CleanupResult['orphanAdmins'] = []
  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: Resource.AppDataTable.name,
        FilterExpression: 'begins_with(pk, :adminPrefix) AND sk = :profile',
        ExpressionAttributeValues: {
          ':adminPrefix': 'ADMIN#',
          ':profile': 'PROFILE',
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    const items = result.Items ?? []
    lastEvaluatedKey = result.LastEvaluatedKey

    for (const item of items) {
      const username = (item.pk as string).replace('ADMIN#', '')
      const weddingIds = item.weddingIds as Set<string> | string[] | undefined

      if (weddingIds) {
        const idsArray = Array.isArray(weddingIds) ? weddingIds : Array.from(weddingIds)
        const orphanWeddingIds: string[] = []

        // Check each wedding ID to see if the wedding exists
        for (const weddingId of idsArray) {
          const weddingKey = Keys.wedding(weddingId)
          const wedding = await docClient.send(
            new GetCommand({
              TableName: Resource.AppDataTable.name,
              Key: weddingKey,
            })
          )

          if (!wedding.Item) {
            orphanWeddingIds.push(weddingId)
          }
        }

        if (orphanWeddingIds.length > 0) {
          orphanAdmins.push({ username, orphanWeddingIds })
        }
      }
    }
  } while (lastEvaluatedKey)

  return orphanAdmins
}

/**
 * Find S3 objects that are not in the weddings/ prefix (legacy uploads)
 */
async function findOrphanS3Objects(): Promise<string[]> {
  const orphanObjects: string[] = []
  let continuationToken: string | undefined

  // List objects NOT in weddings/ prefix
  const prefixesToCheck = ['gallery/', 'music/', 'gifts/', 'parking/']

  for (const prefix of prefixesToCheck) {
    continuationToken = undefined
    do {
      const result: ListObjectsV2CommandOutput = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: Resource.WeddingImageBucket.name,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )

      const objects = result.Contents ?? []
      continuationToken = result.NextContinuationToken

      for (const obj of objects) {
        if (obj.Key) {
          orphanObjects.push(obj.Key)
        }
      }
    } while (continuationToken)
  }

  return orphanObjects
}

/**
 * Delete orphan items in batches
 */
async function deleteOrphanItems(items: OrphanData[]): Promise<number> {
  let deletedCount = 0

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

  return deletedCount
}

/**
 * Clean up admin profiles by removing orphan wedding IDs
 */
async function cleanupAdminProfiles(orphanAdmins: CleanupResult['orphanAdmins']): Promise<number> {
  let cleanedCount = 0

  for (const admin of orphanAdmins) {
    for (const weddingId of admin.orphanWeddingIds) {
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: Resource.AppDataTable.name,
            Key: Keys.weddingAdmin(admin.username),
            UpdateExpression: 'DELETE weddingIds :weddingIdSet',
            ExpressionAttributeValues: {
              ':weddingIdSet': new Set([weddingId]),
            },
          })
        )
        cleanedCount++
      } catch {
        console.log({
          level: 'WARN',
          message: `Could not remove orphan weddingId from admin ${admin.username}`,
          weddingId,
        })
      }
    }

    // Also delete any orphan admin link records
    for (const weddingId of admin.orphanWeddingIds) {
      try {
        await docClient.send(
          new DeleteCommand({
            TableName: Resource.AppDataTable.name,
            Key: Keys.weddingAdminLink(weddingId, admin.username),
          })
        )
      } catch {
        // Link might not exist, ignore
      }
    }
  }

  return cleanedCount
}

/**
 * Delete orphan S3 objects
 */
async function deleteOrphanS3Objects(keys: string[]): Promise<number> {
  let deletedCount = 0

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000)
    const objectsToDelete = batch.map((key) => ({ Key: key }))

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

  return deletedCount
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
    // 2. Parse Request Body
    // ============================================
    let dryRun = true
    if (event.body) {
      try {
        const body = JSON.parse(event.body)
        dryRun = body.dryRun !== false // Default to dry run
      } catch {
        return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_BODY')
      }
    }

    console.log({
      level: 'INFO',
      endpoint: 'POST /superadmin/cleanup-orphan-data',
      operation: 'cleanup-start',
      requestId: context.awsRequestId,
      dryRun,
      performedBy: authResult.user.username,
      timestamp: new Date().toISOString(),
    })

    // ============================================
    // 3. Find All Orphan Data
    // ============================================
    const orphanItems = await findOrphanItems()
    const orphanAdmins = await findOrphanAdmins()
    const orphanS3Objects = await findOrphanS3Objects()

    // ============================================
    // 4. Delete If Not Dry Run
    // ============================================
    const deletedCounts = {
      images: 0,
      music: 0,
      gifts: 0,
      giftReservations: 0,
      parking: 0,
      rsvps: 0,
      settings: 0,
      schedule: 0,
      adminWeddingIds: 0,
      s3Objects: 0,
    }

    if (!dryRun) {
      deletedCounts.images = await deleteOrphanItems(orphanItems.images)
      deletedCounts.music = await deleteOrphanItems(orphanItems.music)
      deletedCounts.gifts = await deleteOrphanItems(orphanItems.gifts)
      deletedCounts.giftReservations = await deleteOrphanItems(orphanItems.giftReservations)
      deletedCounts.parking = await deleteOrphanItems(orphanItems.parking)
      deletedCounts.rsvps = await deleteOrphanItems(orphanItems.rsvps)
      deletedCounts.settings = await deleteOrphanItems(orphanItems.settings)
      deletedCounts.schedule = await deleteOrphanItems(orphanItems.schedule)
      deletedCounts.adminWeddingIds = await cleanupAdminProfiles(orphanAdmins)
      deletedCounts.s3Objects = await deleteOrphanS3Objects(orphanS3Objects)
    }

    // ============================================
    // 5. Log and Return Result
    // ============================================
    const result: CleanupResult = {
      dryRun,
      orphanItems,
      orphanAdmins,
      orphanS3Objects,
      deletedCounts,
    }

    console.log({
      level: 'INFO',
      endpoint: 'POST /superadmin/cleanup-orphan-data',
      operation: 'cleanup-complete',
      requestId: context.awsRequestId,
      dryRun,
      performedBy: authResult.user.username,
      summary: {
        orphanImages: orphanItems.images.length,
        orphanMusic: orphanItems.music.length,
        orphanGifts: orphanItems.gifts.length,
        orphanGiftReservations: orphanItems.giftReservations.length,
        orphanParking: orphanItems.parking.length,
        orphanRsvps: orphanItems.rsvps.length,
        orphanSettings: orphanItems.settings.length,
        orphanSchedule: orphanItems.schedule.length,
        orphanAdmins: orphanAdmins.length,
        orphanS3Objects: orphanS3Objects.length,
      },
      deletedCounts,
      timestamp: new Date().toISOString(),
    })

    return createSuccessResponse(
      200,
      {
        message: dryRun
          ? 'Dry run complete - no data was deleted'
          : 'Cleanup complete - orphan data has been deleted',
        ...result,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/cleanup-orphan-data',
        operation: 'cleanup-orphan-data',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
