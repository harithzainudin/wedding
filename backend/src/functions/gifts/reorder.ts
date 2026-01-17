/**
 * PUT /admin/w/{weddingId}/gifts/reorder
 * Admin endpoint to reorder gifts
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'

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
    const validation = validateReorderInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation
    const timestamp = new Date().toISOString()

    // Build transaction items for reordering using wedding-scoped keys
    // DynamoDB TransactWrite supports max 100 items
    const transactItems = data.giftIds.map((giftId, index) => {
      const giftKey = Keys.gift(weddingId!, giftId)
      const gsiKey = Keys.gsi.weddingGifts(weddingId!, index + 1, giftId)

      return {
        Update: {
          TableName: Resource.AppDataTable.name,
          Key: giftKey,
          UpdateExpression:
            'SET #order = :order, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk, updatedAt = :updatedAt, updatedBy = :updatedBy',
          ExpressionAttributeNames: {
            '#order': 'order',
          },
          ExpressionAttributeValues: {
            ':order': index + 1,
            ':gsi1pk': gsiKey.gsi1pk,
            ':gsi1sk': gsiKey.gsi1sk,
            ':updatedAt': timestamp,
            ':updatedBy': authResult.user.username,
          },
          ConditionExpression: 'attribute_exists(pk)',
        },
      }
    })

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
        endpoint: 'PUT /admin/w/{weddingId}/gifts/reorder',
        operation: 'reorderGifts',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
