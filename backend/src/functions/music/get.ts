/**
 * Get Music Endpoint
 *
 * Public: Returns music tracks and player settings for a wedding
 * Admin: Returns full data with admin settings
 *
 * Public Route: GET /{weddingSlug}/music
 * Admin Route: GET /admin/w/{weddingId}/music
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getPublicS3Url } from '../shared/s3-keys'
import {
  resolveWeddingSlug,
  requireActiveWedding,
  getWeddingById,
  requireAdminAccessibleWedding,
} from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_TRACKS,
  DEFAULT_VOLUME,
  DEFAULT_ENABLED,
  DEFAULT_AUTOPLAY,
  DEFAULT_MODE,
  DEFAULT_SHUFFLE,
  DEFAULT_LOOP,
  ALLOWED_AUDIO_MIME_TYPES,
} from '../shared/music-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

interface MusicTrack {
  id: string
  title: string
  artist?: string
  duration: number
  filename: string
  url: string
  mimeType: string
  fileSize: number
  order: number
  source: string
  externalId?: string
  externalUrl?: string
  uploadedAt: string
  uploadedBy: string
}

interface MusicSettings {
  enabled: boolean
  autoplay: boolean
  volume: number
  mode: string
  shuffle: boolean
  loop: boolean
  selectedTrackId?: string
  maxFileSize: number
  maxTracks: number
  allowedFormats: string[]
  updatedAt?: string
  updatedBy?: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    let weddingId: string
    let isAuthenticated = false

    // ============================================
    // Determine route type and extract wedding context
    // ============================================

    if (event.pathParameters?.weddingId) {
      // Admin route: /admin/w/{weddingId}/music
      weddingId = event.pathParameters.weddingId

      if (!isValidWeddingId(weddingId)) {
        return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
      }

      const authResult = requireWeddingAccess(event, weddingId)
      if (!authResult.authenticated) {
        return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
      }

      const wedding = await getWeddingById(docClient, weddingId)
      if (!wedding) {
        return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
      }

      const isSuperAdmin = authResult.user.type === 'super' || authResult.user.isMaster
      const accessCheck = requireAdminAccessibleWedding(wedding, isSuperAdmin)
      if (!accessCheck.success) {
        return createErrorResponse(
          accessCheck.statusCode,
          accessCheck.error,
          context,
          'ACCESS_DENIED'
        )
      }

      isAuthenticated = true
    } else if (event.pathParameters?.weddingSlug) {
      // Public route: /{weddingSlug}/music
      const weddingSlug = event.pathParameters.weddingSlug
      const wedding = await resolveWeddingSlug(docClient, weddingSlug)
      const weddingCheck = requireActiveWedding(wedding)
      if (!weddingCheck.success) {
        return createErrorResponse(
          weddingCheck.statusCode,
          weddingCheck.error,
          context,
          'WEDDING_ERROR'
        )
      }
      weddingId = weddingCheck.wedding.weddingId
    } else {
      return createErrorResponse(400, 'Wedding identifier is required', context, 'MISSING_WEDDING')
    }

    // Get music settings
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'MUSIC'),
        ConsistentRead: true,
      })
    )

    const settings: MusicSettings = {
      enabled: (settingsResult.Item?.enabled as boolean) ?? DEFAULT_ENABLED,
      autoplay: (settingsResult.Item?.autoplay as boolean) ?? DEFAULT_AUTOPLAY,
      volume: (settingsResult.Item?.volume as number) ?? DEFAULT_VOLUME,
      mode: (settingsResult.Item?.mode as string) ?? DEFAULT_MODE,
      shuffle: (settingsResult.Item?.shuffle as boolean) ?? DEFAULT_SHUFFLE,
      loop: (settingsResult.Item?.loop as boolean) ?? DEFAULT_LOOP,
      selectedTrackId: settingsResult.Item?.selectedTrackId as string | undefined,
      maxFileSize: (settingsResult.Item?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
      maxTracks: (settingsResult.Item?.maxTracks as number) ?? DEFAULT_MAX_TRACKS,
      allowedFormats: (settingsResult.Item?.allowedFormats as string[]) ?? [
        ...ALLOWED_AUDIO_MIME_TYPES,
      ],
      updatedAt: settingsResult.Item?.updatedAt as string | undefined,
      updatedBy: settingsResult.Item?.updatedBy as string | undefined,
    }

    // Get all music tracks for this wedding
    const tracksResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#MUSIC` },
        ScanIndexForward: true,
      })
    )

    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'

    const tracks: MusicTrack[] = (tracksResult.Items ?? []).map((item) => ({
      id: item.id as string,
      title: item.title as string,
      artist: item.artist as string | undefined,
      duration: item.duration as number,
      filename: item.filename as string,
      url: getPublicS3Url(bucketName, region, item.s3Key as string),
      mimeType: item.mimeType as string,
      fileSize: item.fileSize as number,
      order: item.order as number,
      source: item.source as string,
      externalId: item.externalId as string | undefined,
      externalUrl: item.externalUrl as string | undefined,
      uploadedAt: item.uploadedAt as string,
      uploadedBy: item.uploadedBy as string,
    }))

    // Return response based on authentication
    if (isAuthenticated) {
      return createSuccessResponse(
        200,
        {
          settings,
          tracks,
        },
        context
      )
    }

    // Public response - only player settings and tracks
    return createSuccessResponse(
      200,
      {
        settings: {
          enabled: settings.enabled,
          autoplay: settings.autoplay,
          volume: settings.volume,
          mode: settings.mode,
          shuffle: settings.shuffle,
          loop: settings.loop,
          selectedTrackId: settings.selectedTrackId,
        },
        tracks,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /music',
        operation: 'getMusicData',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to get music data', context, 'DB_ERROR')
  }
}
