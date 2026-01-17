import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateCreateGiftInput, GIFT_LIMITS } from '../shared/gift-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let giftName: string | undefined

  try {
    // Require authentication
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
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
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: 'SETTINGS', sk: 'GIFTS' },
      })
    )

    const maxItems = settingsResult.Item?.maxItems ?? GIFT_LIMITS.maxItems

    // Count existing gifts
    const countResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'GIFTS',
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
          ':pk': 'GIFTS',
        },
        ScanIndexForward: false,
        Limit: 1,
      })
    )

    const lastOrder = orderResult.Items?.[0]?.order ?? 0
    const newOrder = (lastOrder as number) + 1

    // Generate unique ID and timestamp
    const id = uuidv4()
    const timestamp = new Date().toISOString()

    // Create gift record
    const giftItem = {
      pk: `GIFT#${id}`,
      sk: 'METADATA',
      gsi1pk: 'GIFTS',
      gsi1sk: String(newOrder).padStart(5, '0'),
      id,
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
        id,
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
        endpoint: 'POST /gifts',
        operation: 'createGift',
        requestId: context.awsRequestId,
        input: { giftName },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
