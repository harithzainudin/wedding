/**
 * PUT /admin/w/{weddingId}/gifts/{id}
 * Admin endpoint to update a gift
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateUpdateGiftInput } from '../shared/gift-validation'
import { Keys } from '../shared/keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let giftId: string | undefined
  let weddingId: string | undefined

  try {
    // Get weddingId from path parameters
    weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    // Validate wedding ID format
    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // Require authentication and wedding access
    const authResult = requireWeddingAccess(event, weddingId)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // Verify wedding exists
    const wedding = await getWeddingById(docClient, weddingId)
    if (!wedding) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    // Check wedding status (block archived for non-super admins)
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

    // Get gift ID from path
    giftId = event.pathParameters?.id
    if (!giftId) {
      return createErrorResponse(400, 'Gift ID is required', context, 'MISSING_ID')
    }

    // Parse request body
    let body: unknown
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', context, 'INVALID_JSON')
    }

    // Validate input
    const validation = validateUpdateGiftInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation

    // Check if gift exists using wedding-scoped key
    const giftKey = Keys.gift(weddingId, giftId)
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: giftKey,
      })
    )

    if (!existingResult.Item) {
      return createErrorResponse(404, 'Gift not found', context, 'NOT_FOUND')
    }

    // Check if reducing quantity below reserved amount
    if (data.quantityTotal !== undefined) {
      const currentReserved = existingResult.Item.quantityReserved as number
      if (data.quantityTotal < currentReserved) {
        return createErrorResponse(
          400,
          `Cannot reduce quantity below reserved amount (${currentReserved})`,
          context,
          'INVALID_QUANTITY'
        )
      }
    }

    // Build update expression dynamically
    const updateExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, unknown> = {}

    const timestamp = new Date().toISOString()

    if (data.name !== undefined) {
      updateExpressions.push('#name = :name')
      expressionAttributeNames['#name'] = 'name'
      expressionAttributeValues[':name'] = data.name
    }

    if (data.description !== undefined) {
      updateExpressions.push('description = :description')
      expressionAttributeValues[':description'] = data.description
    }

    if (data.externalLink !== undefined) {
      updateExpressions.push('externalLink = :externalLink')
      expressionAttributeValues[':externalLink'] = data.externalLink
    }

    if (data.priceRange !== undefined) {
      updateExpressions.push('priceRange = :priceRange')
      expressionAttributeValues[':priceRange'] = data.priceRange
    }

    if (data.category !== undefined) {
      updateExpressions.push('category = :category')
      expressionAttributeValues[':category'] = data.category
    }

    if (data.priority !== undefined) {
      updateExpressions.push('priority = :priority')
      expressionAttributeValues[':priority'] = data.priority
    }

    if (data.notes !== undefined) {
      updateExpressions.push('notes = :notes')
      expressionAttributeValues[':notes'] = data.notes ?? ''
    }

    if (data.quantityTotal !== undefined) {
      updateExpressions.push('quantityTotal = :quantityTotal')
      expressionAttributeValues[':quantityTotal'] = data.quantityTotal
    }

    if (data.imageUrl !== undefined) {
      updateExpressions.push('imageUrl = :imageUrl')
      expressionAttributeValues[':imageUrl'] = data.imageUrl
    }

    // Always update metadata
    updateExpressions.push('updatedAt = :updatedAt')
    expressionAttributeValues[':updatedAt'] = timestamp

    updateExpressions.push('updatedBy = :updatedBy')
    expressionAttributeValues[':updatedBy'] = authResult.user.username

    if (updateExpressions.length === 2) {
      // Only updatedAt and updatedBy - nothing to update
      return createErrorResponse(400, 'No fields to update', context, 'NO_UPDATES')
    }

    // Update the gift using wedding-scoped key
    const updateResult = await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: giftKey,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    )

    const updatedGift = updateResult.Attributes

    return createSuccessResponse(
      200,
      {
        id: updatedGift?.id,
        name: updatedGift?.name,
        description: updatedGift?.description,
        imageUrl: updatedGift?.imageUrl,
        externalLink: updatedGift?.externalLink,
        priceRange: updatedGift?.priceRange,
        category: updatedGift?.category,
        priority: updatedGift?.priority,
        notes: updatedGift?.notes,
        quantityTotal: updatedGift?.quantityTotal,
        quantityReserved: updatedGift?.quantityReserved,
        order: updatedGift?.order,
        createdAt: updatedGift?.createdAt,
        updatedAt: updatedGift?.updatedAt,
        updatedBy: updatedGift?.updatedBy,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/gifts/{id}',
        operation: 'updateGift',
        requestId: context.awsRequestId,
        input: { weddingId, giftId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
