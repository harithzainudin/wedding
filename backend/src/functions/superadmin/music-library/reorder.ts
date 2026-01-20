/**
 * Reorder Global Music Tracks Endpoint (Super Admin Only)
 *
 * Reorders tracks within a category.
 * Route: PUT /superadmin/music-library/reorder
 *
 * Body:
 * - category: The category to reorder tracks in
 * - trackIds: Array of track IDs in the new order
 *
 * SECURITY: Requires super admin authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand, PutCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import {
  type MusicCategory,
  isValidMusicCategory,
  MUSIC_CATEGORIES,
} from '../../shared/global-music-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

interface ReorderRequest {
  category: string
  trackIds: string[]
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let category: string | undefined
  let trackIds: string[] | undefined

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

    let body: ReorderRequest
    try {
      body = JSON.parse(event.body) as ReorderRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    category = body.category
    trackIds = body.trackIds

    if (!category) {
      return createErrorResponse(400, 'category is required', context, 'MISSING_CATEGORY')
    }

    if (!isValidMusicCategory(category)) {
      return createErrorResponse(
        400,
        `Invalid category. Must be one of: ${MUSIC_CATEGORIES.join(', ')}`,
        context,
        'INVALID_CATEGORY'
      )
    }

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return createErrorResponse(400, 'trackIds must be a non-empty array', context, 'INVALID_TRACK_IDS')
    }

    // Check for duplicates
    const uniqueIds = new Set(trackIds)
    if (uniqueIds.size !== trackIds.length) {
      return createErrorResponse(400, 'trackIds contains duplicates', context, 'DUPLICATE_TRACK_IDS')
    }

    // ============================================
    // 3. Verify All Tracks Exist and Belong to Category
    // ============================================
    // Batch get all tracks
    const batchGetResponse = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [Resource.AppDataTable.name]: {
            Keys: trackIds.map(id => Keys.globalMusic(id)),
          },
        },
      })
    )

    const existingTracks = batchGetResponse.Responses?.[Resource.AppDataTable.name] ?? []

    if (existingTracks.length !== trackIds.length) {
      const foundIds = new Set(existingTracks.map(t => t.id as string))
      const missingIds = trackIds.filter(id => !foundIds.has(id))
      return createErrorResponse(
        404,
        `Tracks not found: ${missingIds.join(', ')}`,
        context,
        'TRACKS_NOT_FOUND'
      )
    }

    // Verify all tracks belong to the specified category
    const wrongCategoryTracks = existingTracks.filter(t => t.category !== category)
    if (wrongCategoryTracks.length > 0) {
      return createErrorResponse(
        400,
        `Some tracks do not belong to category "${category}": ${wrongCategoryTracks.map(t => t.id).join(', ')}`,
        context,
        'WRONG_CATEGORY'
      )
    }

    // ============================================
    // 4. Update Order for Each Track
    // ============================================
    // We need to delete and recreate each record because the GSI key includes the order
    const now = new Date().toISOString()

    for (let i = 0; i < trackIds.length; i++) {
      const trackId = trackIds[i]!
      const newOrder = i
      const existingTrack = existingTracks.find(t => t.id === trackId)!

      // Only update if order changed
      if (existingTrack.order !== newOrder) {
        // Delete old record
        await docClient.send(
          new DeleteCommand({
            TableName: Resource.AppDataTable.name,
            Key: Keys.globalMusic(trackId),
          })
        )

        // Create new record with updated order
        const updatedRecord = {
          ...existingTrack,
          ...Keys.globalMusic(trackId),
          ...Keys.gsi.allGlobalMusic(category as MusicCategory, newOrder, trackId),
          order: newOrder,
          updatedAt: now,
          updatedBy: authResult.user.username,
        }

        await docClient.send(
          new PutCommand({
            TableName: Resource.AppDataTable.name,
            Item: updatedRecord,
          })
        )
      }
    }

    // ============================================
    // 5. Return Success
    // ============================================
    return createSuccessResponse(
      200,
      {
        success: true,
        category,
        trackIds,
        reorderedCount: trackIds.length,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/music-library/reorder',
        operation: 'reorderGlobalMusic',
        requestId: context.awsRequestId,
        input: { category, trackIds },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
