/**
 * POST /admin/w/{weddingId}/gifts/bulk
 * Admin endpoint to bulk create gifts
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateBulkCreateGiftInput, GIFT_LIMITS } from '../shared/gift-validation'
import { Keys } from '../shared/keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const BATCH_SIZE = 25 // DynamoDB BatchWriteCommand limit

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let weddingId: string | undefined
  let giftCount: number | undefined

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
    const validation = validateBulkCreateGiftInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const validatedGifts = validation.data
    giftCount = validatedGifts.length

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
    if (currentCount + giftCount > maxItems) {
      return createErrorResponse(
        400,
        `Cannot add ${giftCount} gifts. Would exceed limit of ${maxItems} (current: ${currentCount})`,
        context,
        'LIMIT_EXCEEDED'
      )
    }

    // Get the last order number
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

    const lastOrder = (orderResult.Items?.[0]?.order as number) ?? 0
    const timestamp = new Date().toISOString()

    // Build all gift items
    const giftItems = validatedGifts.map((gift, index) => {
      const giftId = uuidv4()
      const order = lastOrder + index + 1
      const giftKey = Keys.gift(weddingId!, giftId)
      const gsiKey = Keys.gsi.weddingGifts(weddingId!, order, giftId)

      return {
        ...giftKey,
        ...gsiKey,
        weddingId,
        id: giftId,
        name: gift.name,
        description: gift.description,
        externalLink: gift.externalLink,
        priceRange: gift.priceRange,
        category: gift.category,
        priority: gift.priority,
        notes: gift.notes ?? '',
        quantityTotal: gift.quantityTotal,
        quantityReserved: 0,
        order,
        createdAt: timestamp,
        createdBy: authResult.user.username,
      }
    })

    // Write in batches of 25 (DynamoDB limit)
    const createdIds: string[] = []
    for (let i = 0; i < giftItems.length; i += BATCH_SIZE) {
      const batch = giftItems.slice(i, i + BATCH_SIZE)
      const putRequests = batch.map((item) => ({
        PutRequest: { Item: item },
      }))

      let response = await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [Resource.AppDataTable.name]: putRequests,
          },
        })
      )

      // Handle unprocessed items with exponential backoff retry
      let retries = 0
      while (response.UnprocessedItems?.[Resource.AppDataTable.name]?.length && retries < 3) {
        await delay(Math.pow(2, retries) * 100)
        response = await docClient.send(
          new BatchWriteCommand({
            RequestItems: response.UnprocessedItems,
          })
        )
        retries++
      }

      // Track created IDs
      createdIds.push(...batch.map((item) => item.id))
    }

    return createSuccessResponse(
      201,
      {
        message: `Successfully created ${createdIds.length} gift${createdIds.length !== 1 ? 's' : ''}`,
        created: {
          count: createdIds.length,
          giftIds: createdIds,
        },
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/gifts/bulk',
        operation: 'bulkCreateGifts',
        requestId: context.awsRequestId,
        input: { weddingId, giftCount },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
