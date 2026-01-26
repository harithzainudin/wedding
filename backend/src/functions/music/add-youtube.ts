/**
 * Add YouTube Track Endpoint (Admin)
 *
 * Adds a YouTube video/music track to a wedding's playlist.
 * Fetches metadata from YouTube oEmbed API.
 *
 * Route: POST /admin/w/{weddingId}/music/add-youtube
 *
 * Body:
 * - youtubeUrl: Full YouTube URL (various formats supported)
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { DEFAULT_MAX_TRACKS } from '../shared/music-constants'
import { validateAddYouTubeRequest } from '../shared/music-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

interface YouTubeOEmbedResponse {
  title: string
  author_name: string
  author_url: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  html: string
  width: number
  height: number
  version: string
  provider_name: string
  provider_url: string
  type: string
}

async function getMusicSettings(weddingId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: Keys.settings(weddingId, 'MUSIC'),
    })
  )

  return {
    maxTracks: (result.Item?.maxTracks as number) ?? DEFAULT_MAX_TRACKS,
  }
}

async function getCurrentTrackCount(weddingId: string): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#MUSIC` },
      Select: 'COUNT',
    })
  )
  return result.Count ?? 0
}

async function getNextOrder(weddingId: string): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#MUSIC` },
      ScanIndexForward: false,
      Limit: 1,
    })
  )

  if (!result.Items || result.Items.length === 0) {
    return 0
  }

  return ((result.Items[0]?.order as number) ?? 0) + 1
}

async function isYouTubeTrackAlreadyAdded(weddingId: string, videoId: string): Promise<boolean> {
  // Check if this YouTube video is already in the wedding's music
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      FilterExpression: '#source = :youtube AND #externalId = :videoId',
      ExpressionAttributeNames: {
        '#source': 'source',
        '#externalId': 'externalId',
      },
      ExpressionAttributeValues: {
        ':pk': `WEDDING#${weddingId}#MUSIC`,
        ':youtube': 'youtube',
        ':videoId': videoId,
      },
    })
  )

  return (result.Count ?? 0) > 0
}

async function fetchYouTubeMetadata(
  youtubeUrl: string
): Promise<{ success: true; data: YouTubeOEmbedResponse } | { success: false; error: string }> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`

    const response = await fetch(oEmbedUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'This video cannot be embedded (embedding disabled)' }
      }
      if (response.status === 404) {
        return { success: false, error: 'Video not found or unavailable' }
      }
      return { success: false, error: `Failed to fetch video info (status: ${response.status})` }
    }

    const data = (await response.json()) as YouTubeOEmbedResponse
    return { success: true, data }
  } catch (error) {
    console.error('fetchYouTubeMetadata error:', youtubeUrl, error)
    return { success: false, error: 'Failed to fetch video information' }
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let weddingId: string | undefined
  let youtubeUrl: string | undefined

  try {
    // ============================================
    // 1. Extract and Validate Wedding ID
    // ============================================
    weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 2. Authorization: Require Wedding Access
    // ============================================
    const authResult = requireWeddingAccess(event, weddingId)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 3. Verify Wedding Exists
    // ============================================
    const wedding = await getWeddingById(docClient, weddingId)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    const isSuperAdmin = authResult.user.type === 'super' || authResult.user.isMaster
    const accessCheck = requireAdminAccessibleWedding(wedding, isSuperAdmin)
    if (!accessCheck.success) {
      return createErrorResponse(accessCheck.statusCode, accessCheck.error, context, 'ACCESS_DENIED')
    }

    // ============================================
    // 4. Parse and Validate Input
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

    const validation = validateAddYouTubeRequest(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    youtubeUrl = validation.data.youtubeUrl
    const videoId = validation.videoId

    // ============================================
    // 5. Check Track Limit
    // ============================================
    const settings = await getMusicSettings(weddingId)
    const currentCount = await getCurrentTrackCount(weddingId)

    if (currentCount >= settings.maxTracks) {
      return createErrorResponse(
        400,
        `Maximum of ${settings.maxTracks} tracks reached`,
        context,
        'LIMIT_EXCEEDED'
      )
    }

    // ============================================
    // 6. Check if Already Added
    // ============================================
    const alreadyAdded = await isYouTubeTrackAlreadyAdded(weddingId, videoId)
    if (alreadyAdded) {
      return createErrorResponse(
        400,
        'This YouTube video is already in your playlist',
        context,
        'ALREADY_ADDED'
      )
    }

    // ============================================
    // 7. Fetch YouTube Metadata
    // ============================================
    const metadataResult = await fetchYouTubeMetadata(youtubeUrl)
    if (!metadataResult.success) {
      return createErrorResponse(400, metadataResult.error, context, 'YOUTUBE_FETCH_ERROR')
    }

    const metadata = metadataResult.data

    // ============================================
    // 8. Create Wedding Music Record
    // ============================================
    const trackId = uuidv4()
    const order = await getNextOrder(weddingId)
    const now = new Date().toISOString()

    // Get highest quality thumbnail
    // YouTube thumbnails: default (120x90), mqdefault (320x180), hqdefault (480x360), sddefault (640x480), maxresdefault (1280x720)
    const thumbnailUrl = metadata.thumbnail_url.replace('hqdefault', 'mqdefault')

    const weddingMusicRecord = {
      ...Keys.music(weddingId, trackId),
      ...Keys.gsi.weddingMusic(weddingId, order, trackId),
      id: trackId,
      weddingId,
      title: metadata.title,
      artist: metadata.author_name, // YouTube channel name
      duration: 0, // oEmbed doesn't provide duration, will be fetched client-side
      filename: '', // No file for YouTube
      s3Key: null, // No S3 file for YouTube
      mimeType: 'video/youtube',
      fileSize: 0,
      order,
      source: 'youtube' as const,
      externalId: videoId,
      externalUrl: youtubeUrl,
      thumbnailUrl,
      uploadedAt: now,
      uploadedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: weddingMusicRecord,
      })
    )

    // ============================================
    // 9. Return Created Track
    // ============================================
    return createSuccessResponse(
      201,
      {
        id: trackId,
        title: metadata.title,
        artist: metadata.author_name,
        duration: 0,
        filename: '',
        url: '', // No S3 URL for YouTube
        mimeType: 'video/youtube',
        fileSize: 0,
        order,
        source: 'youtube',
        externalId: videoId,
        externalUrl: youtubeUrl,
        thumbnailUrl,
        uploadedAt: now,
        uploadedBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/music/add-youtube',
        operation: 'addYouTubeTrack',
        requestId: context.awsRequestId,
        input: { weddingId, youtubeUrl },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
