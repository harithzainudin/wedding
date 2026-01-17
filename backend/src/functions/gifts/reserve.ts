/**
 * POST /{weddingSlug}/gifts/{id}/reserve
 * Public endpoint to reserve a gift
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { validateReserveGiftInput } from '../shared/gift-validation'
import { Keys } from '../shared/keys'
import { resolveWeddingSlug, requireActiveWedding } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let giftId: string | undefined
  let guestName: string | undefined
  let weddingSlug: string | undefined

  try {
    // Get weddingSlug from path parameters
    weddingSlug = event.pathParameters?.weddingSlug
    if (!weddingSlug) {
      return createErrorResponse(400, 'Wedding slug is required', context, 'MISSING_SLUG')
    }

    // Resolve wedding slug to get wedding context
    const wedding = await resolveWeddingSlug(docClient, weddingSlug)
    const weddingCheck = requireActiveWedding(wedding)
    if (!weddingCheck.success) {
      return createErrorResponse(
        weddingCheck.statusCode,
        weddingCheck.error,
        context,
        'WEDDING_ERROR'
      )
    }

    const weddingId = weddingCheck.wedding.weddingId

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
    const validation = validateReserveGiftInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation
    guestName = data.guestName

    // Check if gift settings enabled
    const settingsKey = Keys.settings(weddingId, 'GIFTS')
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    if (!settingsResult.Item?.enabled) {
      return createErrorResponse(
        400,
        'Gift wishlist is currently disabled',
        context,
        'FEATURE_DISABLED'
      )
    }

    // Get the gift to check availability
    const giftKey = Keys.gift(weddingId, giftId)
    const giftResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: giftKey,
      })
    )

    if (!giftResult.Item) {
      return createErrorResponse(404, 'Gift not found', context, 'NOT_FOUND')
    }

    const gift = giftResult.Item
    const quantityTotal = gift.quantityTotal as number
    const quantityReserved = gift.quantityReserved as number
    const quantityAvailable = quantityTotal - quantityReserved
    const requestedQuantity = data.quantity ?? 1

    if (requestedQuantity > quantityAvailable) {
      return createErrorResponse(
        400,
        quantityAvailable === 0
          ? 'This gift has been fully reserved'
          : `Only ${quantityAvailable} available for reservation`,
        context,
        'INSUFFICIENT_QUANTITY'
      )
    }

    // Generate reservation ID and timestamp
    const reservationId = uuidv4()
    const timestamp = new Date().toISOString()

    // Use transaction to atomically update gift quantity and create reservation
    // Calculate the maximum allowed reserved quantity after this reservation
    const maxAllowedReserved = quantityTotal - requestedQuantity

    // Get the GSI key for reservation listing
    const reservationGsiKey = Keys.gsi.weddingReservations(weddingId, timestamp)

    try {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              // Update gift's reserved count with condition check
              // Use optimistic locking: only update if quantityReserved hasn't changed
              Update: {
                TableName: Resource.AppDataTable.name,
                Key: giftKey,
                UpdateExpression: 'SET quantityReserved = quantityReserved + :qty',
                ConditionExpression: 'quantityReserved <= :maxAllowed',
                ExpressionAttributeValues: {
                  ':qty': requestedQuantity,
                  ':maxAllowed': maxAllowedReserved,
                },
              },
            },
            {
              // Create reservation record with wedding-scoped keys
              Put: {
                TableName: Resource.AppDataTable.name,
                Item: {
                  pk: giftKey.pk,
                  sk: `RESERVATION#${reservationId}`,
                  ...reservationGsiKey,
                  weddingId,
                  id: reservationId,
                  giftId,
                  guestName: data.guestName,
                  guestPhone: data.guestPhone,
                  rsvpId: data.rsvpId ?? '',
                  quantity: requestedQuantity,
                  message: data.message ?? '',
                  reservedAt: timestamp,
                },
              },
            },
          ],
        })
      )
    } catch (txError) {
      if (txError instanceof Error && txError.name === 'TransactionCanceledException') {
        return createErrorResponse(
          400,
          'Unable to reserve gift - it may have been reserved by someone else. Please try again.',
          context,
          'RESERVATION_CONFLICT'
        )
      }
      throw txError
    }

    return createSuccessResponse(
      201,
      {
        id: reservationId,
        giftId,
        guestName: data.guestName,
        quantity: requestedQuantity,
        reservedAt: timestamp,
        message: 'Reservation successful! Thank you for your generosity.',
        remainingQuantity: quantityAvailable - requestedQuantity,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /{weddingSlug}/gifts/{id}/reserve',
        operation: 'reserveGift',
        requestId: context.awsRequestId,
        input: { weddingSlug, giftId, guestName },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
