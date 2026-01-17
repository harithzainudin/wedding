import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface ReorderRequest {
  giftIds: string[]
}

function validateReorderInput(input: unknown):
  | {
      valid: true
      data: ReorderRequest
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (!Array.isArray(body.giftIds)) {
    return { valid: false, error: 'giftIds must be an array' }
  }

  if (body.giftIds.length === 0) {
    return { valid: false, error: 'giftIds cannot be empty' }
  }

  if (body.giftIds.length > 50) {
    return { valid: false, error: 'Cannot reorder more than 50 items at once' }
  }

  for (const id of body.giftIds) {
    if (typeof id !== 'string' || !id.trim()) {
      return { valid: false, error: 'All gift IDs must be non-empty strings' }
    }
  }

  // Check for duplicates
  const uniqueIds = new Set(body.giftIds)
  if (uniqueIds.size !== body.giftIds.length) {
    return { valid: false, error: 'Duplicate gift IDs are not allowed' }
  }

  return {
    valid: true,
    data: {
      giftIds: body.giftIds as string[],
    },
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
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
    const validation = validateReorderInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation
    const timestamp = new Date().toISOString()

    // Build transaction items for reordering
    // DynamoDB TransactWrite supports max 100 items
    const transactItems = data.giftIds.map((giftId, index) => ({
      Update: {
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `GIFT#${giftId}`,
          sk: 'METADATA',
        },
        UpdateExpression:
          'SET #order = :order, gsi1sk = :gsi1sk, updatedAt = :updatedAt, updatedBy = :updatedBy',
        ExpressionAttributeNames: {
          '#order': 'order',
        },
        ExpressionAttributeValues: {
          ':order': index + 1,
          ':gsi1sk': String(index + 1).padStart(5, '0'),
          ':updatedAt': timestamp,
          ':updatedBy': authResult.user.username,
        },
        ConditionExpression: 'attribute_exists(pk)',
      },
    }))

    // Execute in batches of 100 (TransactWrite limit)
    for (let i = 0; i < transactItems.length; i += 100) {
      const batch = transactItems.slice(i, i + 100)
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: batch,
        })
      )
    }

    return createSuccessResponse(
      200,
      {
        message: 'Gifts reordered successfully',
        count: data.giftIds.length,
      },
      context
    )
  } catch (error) {
    // Check for condition check failure (gift not found)
    if (error instanceof Error && error.name === 'TransactionCanceledException') {
      return createErrorResponse(400, 'One or more gift IDs not found', context, 'NOT_FOUND')
    }

    logError(
      {
        endpoint: 'PUT /gifts/reorder',
        operation: 'reorderGifts',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
