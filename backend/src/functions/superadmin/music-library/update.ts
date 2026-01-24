/**
 * Update Global Music Track Endpoint (Super Admin Only)
 *
 * Updates metadata for a global music track.
 * Route: PUT /superadmin/music-library/{id}
 *
 * SECURITY: Requires super admin authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { getPublicS3Url } from '../../shared/s3-keys'
import {
  validateGlobalMusicUpdateRequest,
  type GlobalMusicUpdateRequest,
  type GlobalMusicTrack,
} from '../../shared/global-music-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

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
    // 2. Extract Track ID
    // ============================================
    trackId = event.pathParameters?.id
    if (!trackId) {
      return createErrorResponse(400, 'Track ID is required', context, 'MISSING_TRACK_ID')
    }

    // ============================================
    // 3. Get Existing Track
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

    const existingTrack = existingResult.Item as GlobalMusicTrack & {
      pk: string
      sk: string
      gsi1pk: string
      gsi1sk: string
    }

    // ============================================
    // 4. Parse and Validate Input
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: GlobalMusicUpdateRequest
    try {
      body = JSON.parse(event.body) as GlobalMusicUpdateRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    const validation = validateGlobalMusicUpdateRequest(body, existingTrack.license)
    if ('error' in validation) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Handle Category Change (requires GSI key update)
    // ============================================
    const now = new Date().toISOString()
    const newCategory = validation.category ?? existingTrack.category

    if (validation.category && validation.category !== existingTrack.category) {
      // Category changed - need to delete and recreate with new GSI key
      // Keep the same order number for simplicity

      const updatedRecord = {
        ...Keys.globalMusic(trackId),
        ...Keys.gsi.allGlobalMusic(newCategory, existingTrack.order, trackId),
        id: existingTrack.id,
        title: validation.title ?? existingTrack.title,
        ...(validation.artist !== undefined
          ? validation.artist
            ? { artist: validation.artist }
            : {}
          : existingTrack.artist
            ? { artist: existingTrack.artist }
            : {}),
        duration: existingTrack.duration,
        filename: existingTrack.filename,
        s3Key: existingTrack.s3Key,
        mimeType: existingTrack.mimeType,
        fileSize: existingTrack.fileSize,
        category: newCategory,
        order: existingTrack.order,
        ...(validation.license
          ? { license: validation.license }
          : existingTrack.license
            ? { license: existingTrack.license }
            : {}),
        uploadedAt: existingTrack.uploadedAt,
        uploadedBy: existingTrack.uploadedBy,
        updatedAt: now,
        updatedBy: authResult.user.username,
      }

      // Delete old record and create new one
      await docClient.send(
        new DeleteCommand({
          TableName: Resource.AppDataTable.name,
          Key: Keys.globalMusic(trackId),
        })
      )

      await docClient.send(
        new PutCommand({
          TableName: Resource.AppDataTable.name,
          Item: updatedRecord,
        })
      )
    } else {
      // Simple update without category change
      const updateExpressions: string[] = ['#updatedAt = :updatedAt', '#updatedBy = :updatedBy']
      const expressionAttributeNames: Record<string, string> = {
        '#updatedAt': 'updatedAt',
        '#updatedBy': 'updatedBy',
      }
      const expressionAttributeValues: Record<string, unknown> = {
        ':updatedAt': now,
        ':updatedBy': authResult.user.username,
      }

      if (validation.title !== undefined) {
        updateExpressions.push('#title = :title')
        expressionAttributeNames['#title'] = 'title'
        expressionAttributeValues[':title'] = validation.title
      }

      if (validation.artist !== undefined) {
        if (validation.artist) {
          updateExpressions.push('#artist = :artist')
          expressionAttributeNames['#artist'] = 'artist'
          expressionAttributeValues[':artist'] = validation.artist
        } else {
          updateExpressions.push('REMOVE #artist')
          expressionAttributeNames['#artist'] = 'artist'
        }
      }

      if (validation.license !== undefined) {
        updateExpressions.push('#license = :license')
        expressionAttributeNames['#license'] = 'license'
        expressionAttributeValues[':license'] = validation.license
      }

      await docClient.send(
        new UpdateCommand({
          TableName: Resource.AppDataTable.name,
          Key: Keys.globalMusic(trackId),
          UpdateExpression: `SET ${updateExpressions.filter((e) => !e.startsWith('REMOVE')).join(', ')}${updateExpressions.filter((e) => e.startsWith('REMOVE')).length > 0 ? ' ' + updateExpressions.filter((e) => e.startsWith('REMOVE')).join(' ') : ''}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues:
            Object.keys(expressionAttributeValues).length > 0
              ? expressionAttributeValues
              : undefined,
        })
      )
    }

    // ============================================
    // 6. Return Updated Track
    // ============================================
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-1'

    return createSuccessResponse(
      200,
      {
        id: trackId,
        title: validation.title ?? existingTrack.title,
        artist: validation.artist !== undefined ? validation.artist : existingTrack.artist,
        duration: existingTrack.duration,
        filename: existingTrack.filename,
        url: getPublicS3Url(bucketName, region, existingTrack.s3Key),
        mimeType: existingTrack.mimeType,
        fileSize: existingTrack.fileSize,
        category: newCategory,
        order: existingTrack.order,
        license: validation.license ?? existingTrack.license,
        uploadedAt: existingTrack.uploadedAt,
        uploadedBy: existingTrack.uploadedBy,
        updatedAt: now,
        updatedBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/music-library/{id}',
        operation: 'updateGlobalMusic',
        requestId: context.awsRequestId,
        input: { trackId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
