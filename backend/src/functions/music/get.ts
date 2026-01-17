import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
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

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    // Get music settings
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: 'SETTINGS', sk: 'MUSIC' },
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

    // Get all music tracks ordered by their order field
    const tracksResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': 'MUSIC_TRACKS' },
        ScanIndexForward: true, // ascending order
      })
    )

    const bucketName = Resource.WeddingImageBucket.name
    const tracks: MusicTrack[] = (tracksResult.Items ?? []).map((item) => ({
      id: item.id as string,
      title: item.title as string,
      artist: item.artist as string | undefined,
      duration: item.duration as number,
      filename: item.filename as string,
      url: `https://${bucketName}.s3.ap-southeast-5.amazonaws.com/${item.s3Key}`,
      mimeType: item.mimeType as string,
      fileSize: item.fileSize as number,
      order: item.order as number,
      source: item.source as string,
      externalId: item.externalId as string | undefined,
      externalUrl: item.externalUrl as string | undefined,
      uploadedAt: item.uploadedAt as string,
      uploadedBy: item.uploadedBy as string,
    }))

    return createSuccessResponse(
      200,
      {
        settings,
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
