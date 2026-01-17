/**
 * Update Music Settings Endpoint (Admin)
 *
 * Updates music player settings for a wedding.
 * Route: PUT /admin/w/{weddingId}/music/settings
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateSettingsUpdate } from '../shared/music-validation'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // ============================================
    // 1. Extract and Validate Wedding ID
    // ============================================
    const weddingId = event.pathParameters?.weddingId
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
      return createErrorResponse(
        accessCheck.statusCode,
        accessCheck.error,
        context,
        'ACCESS_DENIED'
      )
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

    const validation = validateSettingsUpdate(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Check if Settings Record Exists
    // ============================================
    const settingsKey = Keys.settings(weddingId, 'MUSIC')
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const now = new Date().toISOString()

    // If settings don't exist, create them
    if (!existingResult.Item) {
      await docClient.send(
        new PutCommand({
          TableName: Resource.AppDataTable.name,
          Item: {
            ...settingsKey,
            ...validation.data,
            updatedAt: now,
            updatedBy: authResult.user.username,
          },
        })
      )

      return createSuccessResponse(
        200,
        {
          message: 'Music settings created successfully',
        },
        context
      )
    }

    // ============================================
    // 6. Build Update Expression
    // ============================================
    const updateParts: string[] = []
    const expressionValues: Record<string, unknown> = {}
    const expressionNames: Record<string, string> = {}

    if (validation.data.enabled !== undefined) {
      updateParts.push('#enabled = :enabled')
      expressionNames['#enabled'] = 'enabled'
      expressionValues[':enabled'] = validation.data.enabled
    }

    if (validation.data.autoplay !== undefined) {
      updateParts.push('autoplay = :autoplay')
      expressionValues[':autoplay'] = validation.data.autoplay
    }

    if (validation.data.volume !== undefined) {
      updateParts.push('volume = :volume')
      expressionValues[':volume'] = validation.data.volume
    }

    if (validation.data.mode !== undefined) {
      updateParts.push('#mode = :mode')
      expressionNames['#mode'] = 'mode'
      expressionValues[':mode'] = validation.data.mode
    }

    if (validation.data.shuffle !== undefined) {
      updateParts.push('shuffle = :shuffle')
      expressionValues[':shuffle'] = validation.data.shuffle
    }

    if (validation.data.loop !== undefined) {
      updateParts.push('#loop = :loop')
      expressionNames['#loop'] = 'loop'
      expressionValues[':loop'] = validation.data.loop
    }

    if (validation.data.selectedTrackId !== undefined) {
      updateParts.push('selectedTrackId = :selectedTrackId')
      expressionValues[':selectedTrackId'] = validation.data.selectedTrackId
    }

    // Always update metadata
    updateParts.push('updatedAt = :updatedAt')
    expressionValues[':updatedAt'] = now

    updateParts.push('updatedBy = :updatedBy')
    expressionValues[':updatedBy'] = authResult.user.username

    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ...(Object.keys(expressionNames).length > 0 && {
          ExpressionAttributeNames: expressionNames,
        }),
      })
    )

    return createSuccessResponse(
      200,
      {
        message: 'Music settings updated successfully',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/music/settings',
        operation: 'updateMusicSettings',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to update music settings', context, 'DB_ERROR')
  }
}
