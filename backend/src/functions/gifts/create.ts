/**
 * POST /admin/w/{weddingId}/gifts
 * Admin endpoint to create a new gift
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateCreateGiftInput, GIFT_LIMITS } from '../shared/gift-validation'
import { Keys } from '../shared/keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let giftName: string | undefined
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

    // Parse request body
    let body: unknown
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', context, 'INVALID_JSON')
    }

    // Validate input
    const validation = validateCreateGiftInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation
    giftName = data.name.en

    // Check gift settings for max items limit
    const settingsKey = Keys.settings(weddingId, 'GIFTS')
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const maxItems = settingsResult.Item?.maxItems ?? GIFT_LIMITS.maxItems

    // Count existing gifts for this wedding
    const countResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `WEDDING#${weddingId}#GIFTS`,
        },
        Select: 'COUNT',
      })
    )

    const currentCount = countResult.Count ?? 0
    if (currentCount >= maxItems) {
      return createErrorResponse(
        400,
        `Maximum number of gifts (${maxItems}) reached`,
        context,
        'LIMIT_EXCEEDED'
      )
    }

    // Get the next order number
    const orderResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `WEDDING#${weddingId}#GIFTS`,
        },
        ScanIndexForward: false,
        Limit: 1,
      })
    )

    const lastOrder = orderResult.Items?.[0]?.order ?? 0
    const newOrder = (lastOrder as number) + 1

    // Generate unique ID and timestamp
    const giftId = uuidv4()
    const timestamp = new Date().toISOString()

    // Create gift record with wedding-scoped keys
    const giftKey = Keys.gift(weddingId, giftId)
    const gsiKey = Keys.gsi.weddingGifts(weddingId, newOrder, giftId)

    const giftItem = {
      ...giftKey,
      ...gsiKey,
      weddingId,
      id: giftId,
      name: data.name,
      description: data.description,
      externalLink: data.externalLink,
      priceRange: data.priceRange,
      category: data.category,
      priority: data.priority,
      notes: data.notes ?? '',
      quantityTotal: data.quantityTotal,
      quantityReserved: 0,
      order: newOrder,
      createdAt: timestamp,
      createdBy: authResult.user.username,
    }

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: giftItem,
      })
    )

    return createSuccessResponse(
      201,
      {
        id: giftId,
        name: data.name,
        description: data.description,
        externalLink: data.externalLink,
        priceRange: data.priceRange,
        category: data.category,
        priority: data.priority,
        notes: data.notes,
        quantityTotal: data.quantityTotal,
        quantityReserved: 0,
        order: newOrder,
        createdAt: timestamp,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/gifts',
        operation: 'createGift',
        requestId: context.awsRequestId,
        input: { weddingId, giftName },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
