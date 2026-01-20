/**
 * Add Music from Library Endpoint (Admin)
 *
 * Adds a track from the global music library to a wedding.
 * Creates a wedding music record that links to the global track.
 *
 * Route: POST /admin/w/{weddingId}/music/add-from-library
 *
 * Body:
 * - globalMusicId: ID of the global music track to add
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
import { getPublicS3Url } from '../shared/s3-keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { DEFAULT_MAX_TRACKS } from '../shared/music-constants'
import {
  type GlobalMusicTrack,
  generateAttributionText,
} from '../shared/global-music-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

interface AddFromLibraryRequest {
  globalMusicId: string
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

async function isTrackAlreadyAdded(weddingId: string, globalMusicId: string): Promise<boolean> {
  // Check if this global track is already in the wedding's music
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      FilterExpression: '#source = :library AND #globalMusicId = :globalMusicId',
      ExpressionAttributeNames: {
        '#source': 'source',
        '#globalMusicId': 'globalMusicId',
      },
      ExpressionAttributeValues: {
        ':pk': `WEDDING#${weddingId}#MUSIC`,
        ':library': 'library',
        ':globalMusicId': globalMusicId,
      },
    })
  )

  return (result.Count ?? 0) > 0
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let weddingId: string | undefined
  let globalMusicId: string | undefined

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

    let body: AddFromLibraryRequest
    try {
      body = JSON.parse(event.body) as AddFromLibraryRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    globalMusicId = body.globalMusicId
    if (!globalMusicId) {
      return createErrorResponse(400, 'globalMusicId is required', context, 'MISSING_GLOBAL_MUSIC_ID')
    }

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
    const alreadyAdded = await isTrackAlreadyAdded(weddingId, globalMusicId)
    if (alreadyAdded) {
      return createErrorResponse(400, 'This track is already in your playlist', context, 'ALREADY_ADDED')
    }

    // ============================================
    // 7. Get Global Track
    // ============================================
    const globalTrackResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.globalMusic(globalMusicId),
      })
    )

    if (!globalTrackResult.Item) {
      return createErrorResponse(404, 'Track not found in library', context, 'TRACK_NOT_FOUND')
    }

    const globalTrack = globalTrackResult.Item as GlobalMusicTrack

    // ============================================
    // 8. Create Wedding Music Record
    // ============================================
    const trackId = uuidv4()
    const order = await getNextOrder(weddingId)
    const now = new Date().toISOString()
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-1'

    const weddingMusicRecord = {
      ...Keys.music(weddingId, trackId),
      ...Keys.gsi.weddingMusic(weddingId, order, trackId),
      id: trackId,
      weddingId,
      title: globalTrack.title,
      ...(globalTrack.artist && { artist: globalTrack.artist }),
      duration: globalTrack.duration,
      filename: globalTrack.filename,
      s3Key: globalTrack.s3Key, // Points to the shared global file
      mimeType: globalTrack.mimeType,
      fileSize: globalTrack.fileSize,
      order,
      source: 'library' as const,
      globalMusicId, // Reference to the global track
      ...(globalTrack.license && { license: globalTrack.license }),
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
    const attribution = generateAttributionText({
      title: globalTrack.title,
      artist: globalTrack.artist,
      license: globalTrack.license,
    })

    return createSuccessResponse(
      201,
      {
        id: trackId,
        title: globalTrack.title,
        ...(globalTrack.artist && { artist: globalTrack.artist }),
        duration: globalTrack.duration,
        filename: globalTrack.filename,
        url: getPublicS3Url(bucketName, region, globalTrack.s3Key),
        mimeType: globalTrack.mimeType,
        fileSize: globalTrack.fileSize,
        order,
        source: 'library',
        globalMusicId,
        ...(globalTrack.license && { license: globalTrack.license }),
        ...(attribution && { attribution }),
        uploadedAt: now,
        uploadedBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/music/add-from-library',
        operation: 'addMusicFromLibrary',
        requestId: context.awsRequestId,
        input: { weddingId, globalMusicId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
