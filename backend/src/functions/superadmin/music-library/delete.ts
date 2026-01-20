/**
 * Delete Global Music Track Endpoint (Super Admin Only)
 *
 * Deletes a track from the global music library.
 * If the track is used by weddings, a replacement track must be provided.
 *
 * Route: DELETE /superadmin/music-library/{id}
 *
 * Query Parameters:
 * - preview: If "true", returns usage count without deleting
 *
 * Body (when track is in use):
 * - replacementTrackId: ID of the track to replace this one with
 *
 * SECURITY: Requires super admin authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { getPublicS3Url } from '../../shared/s3-keys'
import { type GlobalMusicTrack } from '../../shared/global-music-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

interface WeddingMusicUsage {
  pk: string
  sk: string
  weddingId: string
  trackId: string
  title: string
}

async function findWeddingMusicUsages(globalMusicId: string): Promise<WeddingMusicUsage[]> {
  // Scan for wedding music tracks that reference this global track
  // Note: In a production system with many weddings, consider using a GSI for this
  const usages: WeddingMusicUsage[] = []
  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: Resource.AppDataTable.name,
        FilterExpression: '#source = :library AND #globalMusicId = :globalMusicId',
        ExpressionAttributeNames: {
          '#source': 'source',
          '#globalMusicId': 'globalMusicId',
        },
        ExpressionAttributeValues: {
          ':library': 'library',
          ':globalMusicId': globalMusicId,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    for (const item of result.Items ?? []) {
      usages.push({
        pk: item.pk as string,
        sk: item.sk as string,
        weddingId: item.weddingId as string,
        trackId: item.id as string,
        title: item.title as string,
      })
    }

    lastEvaluatedKey = result.LastEvaluatedKey
  } while (lastEvaluatedKey)

  return usages
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let trackId: string | undefined

  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Extract Track ID and Query Parameters
    // ============================================
    trackId = event.pathParameters?.id
    if (!trackId) {
      return createErrorResponse(400, 'Track ID is required', context, 'MISSING_TRACK_ID')
    }

    const isPreview = event.queryStringParameters?.preview === 'true'

    // ============================================
    // 3. Get Track to Delete
    // ============================================
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.globalMusic(trackId),
      })
    )

    if (!existingResult.Item) {
      return createErrorResponse(404, 'Track not found', context, 'NOT_FOUND')
    }

    const track = existingResult.Item as GlobalMusicTrack & { pk: string; sk: string }

    // ============================================
    // 4. Check Usage
    // ============================================
    const usages = await findWeddingMusicUsages(trackId)
    const usageCount = usages.length

    // Get unique wedding IDs
    const affectedWeddings = [...new Set(usages.map(u => u.weddingId))]

    // If preview mode, return usage stats
    if (isPreview) {
      return createSuccessResponse(
        200,
        {
          trackId,
          title: track.title,
          usageCount,
          affectedWeddings,
          requiresReplacement: usageCount > 0,
        },
        context
      )
    }

    // ============================================
    // 5. Handle Replacement if Track is in Use
    // ============================================
    let replacementTrack: GlobalMusicTrack | null = null

    if (usageCount > 0) {
      // Parse body for replacement track ID
      let replacementTrackId: string | undefined

      if (event.body) {
        try {
          const body = JSON.parse(event.body) as { replacementTrackId?: string }
          replacementTrackId = body.replacementTrackId
        } catch {
          return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
        }
      }

      if (!replacementTrackId) {
        return createErrorResponse(
          400,
          `This track is used by ${usageCount} wedding(s). Please provide a replacementTrackId to replace it.`,
          context,
          'REPLACEMENT_REQUIRED'
        )
      }

      if (replacementTrackId === trackId) {
        return createErrorResponse(
          400,
          'Replacement track cannot be the same as the track being deleted',
          context,
          'INVALID_REPLACEMENT'
        )
      }

      // Get replacement track
      const replacementResult = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: Keys.globalMusic(replacementTrackId),
        })
      )

      if (!replacementResult.Item) {
        return createErrorResponse(404, 'Replacement track not found', context, 'REPLACEMENT_NOT_FOUND')
      }

      replacementTrack = replacementResult.Item as GlobalMusicTrack

      // Update all wedding music records with replacement
      const bucketName = Resource.WeddingImageBucket.name
      const region = process.env.AWS_REGION ?? 'ap-southeast-1'

      for (const usage of usages) {
        await docClient.send(
          new UpdateCommand({
            TableName: Resource.AppDataTable.name,
            Key: { pk: usage.pk, sk: usage.sk },
            UpdateExpression: 'SET #globalMusicId = :globalMusicId, #title = :title, #artist = :artist, #duration = :duration, #s3Key = :s3Key, #mimeType = :mimeType, #fileSize = :fileSize, #url = :url',
            ExpressionAttributeNames: {
              '#globalMusicId': 'globalMusicId',
              '#title': 'title',
              '#artist': 'artist',
              '#duration': 'duration',
              '#s3Key': 's3Key',
              '#mimeType': 'mimeType',
              '#fileSize': 'fileSize',
              '#url': 'url',
            },
            ExpressionAttributeValues: {
              ':globalMusicId': replacementTrack.id,
              ':title': replacementTrack.title,
              ':artist': replacementTrack.artist ?? null,
              ':duration': replacementTrack.duration,
              ':s3Key': replacementTrack.s3Key,
              ':mimeType': replacementTrack.mimeType,
              ':fileSize': replacementTrack.fileSize,
              ':url': getPublicS3Url(bucketName, region, replacementTrack.s3Key),
            },
          })
        )
      }
    }

    // ============================================
    // 6. Delete Track Record
    // ============================================
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.globalMusic(trackId),
      })
    )

    // ============================================
    // 7. Delete S3 File
    // ============================================
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: track.s3Key,
      })
    )

    // ============================================
    // 8. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        success: true,
        deletedTrackId: trackId,
        ...(usageCount > 0 && {
          replacedCount: usageCount,
          replacementTrackId: replacementTrack?.id,
          affectedWeddings,
        }),
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /superadmin/music-library/{id}',
        operation: 'deleteGlobalMusic',
        requestId: context.awsRequestId,
        input: { trackId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
