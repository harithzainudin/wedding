/**
 * List Global Music Library Endpoint (Admin - Read Only)
 *
 * Returns all tracks in the global music library for wedding admins to browse.
 * Route: GET /admin/music-library
 *
 * Query Parameters:
 * - category: Filter by category (optional)
 * - limit: Max items per page (default 50, max 100)
 * - lastKey: Pagination cursor
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireAuth } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Resource } from 'sst'
import { getPublicS3Url } from '../../shared/s3-keys'
import {
  type GlobalMusicTrack,
  type MusicCategory,
  isValidMusicCategory,
  MUSIC_CATEGORIES,
  generateAttributionText,
} from '../../shared/global-music-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface GlobalMusicListItem extends Omit<GlobalMusicTrack, 's3Key'> {
  url: string
  attribution?: string | null
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Authorization: Require Any Admin Auth
    // ============================================
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Parse Query Parameters
    // ============================================
    const limit = Math.min(parseInt(event.queryStringParameters?.limit ?? '50', 10), 100)
    const lastKey = event.queryStringParameters?.lastKey
    const categoryFilter = event.queryStringParameters?.category

    // Validate category filter if provided
    if (categoryFilter && !isValidMusicCategory(categoryFilter)) {
      return createErrorResponse(
        400,
        `Invalid category. Must be one of: ${MUSIC_CATEGORIES.join(', ')}`,
        context,
        'INVALID_CATEGORY'
      )
    }

    // ============================================
    // 3. Query Global Music from GSI1
    // ============================================
    let keyConditionExpression = 'gsi1pk = :pk'
    const expressionAttributeValues: Record<string, string> = {
      ':pk': 'GLOBALMUSIC',
    }

    // If category filter is provided, add it to the key condition
    if (categoryFilter) {
      keyConditionExpression += ' AND begins_with(gsi1sk, :category)'
      expressionAttributeValues[':category'] = `${categoryFilter}#`
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit,
        ScanIndexForward: true, // Order by category then order
        ...(lastKey && {
          ExclusiveStartKey: JSON.parse(Buffer.from(lastKey, 'base64').toString()),
        }),
      })
    )

    // ============================================
    // 4. Format Response
    // ============================================
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-1'

    const tracks: GlobalMusicListItem[] = (result.Items ?? []).map((item) => {
      const track = {
        id: item.id as string,
        title: item.title as string,
        artist: item.artist as string | undefined,
        duration: item.duration as number,
        filename: item.filename as string,
        url: getPublicS3Url(bucketName, region, item.s3Key as string),
        mimeType: item.mimeType as string,
        fileSize: item.fileSize as number,
        category: item.category as MusicCategory,
        order: item.order as number,
        ...(item.license && { license: item.license as GlobalMusicTrack['license'] }),
        uploadedAt: item.uploadedAt as string,
        uploadedBy: item.uploadedBy as string,
      }

      // Generate attribution text for display
      const attribution = generateAttributionText({
        title: track.title,
        artist: track.artist,
        license: track.license,
      })

      return {
        ...track,
        ...(attribution !== null && { attribution }),
      }
    })

    const nextKey = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null

    return createSuccessResponse(
      200,
      {
        tracks,
        total: tracks.length,
        hasMore: !!result.LastEvaluatedKey,
        nextKey,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /admin/music-library',
        operation: 'list-global-music-admin',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
