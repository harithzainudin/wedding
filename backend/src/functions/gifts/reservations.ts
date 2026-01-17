/**
 * GET /admin/w/{weddingId}/gifts/reservations
 * Admin endpoint to list gift reservations
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import type { MultilingualText } from '../shared/gift-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface ReservationWithGift {
  id: string
  giftId: string
  giftName: MultilingualText
  guestName: string
  guestPhone: string
  rsvpId?: string
  quantity: number
  message?: string
  reservedAt: string
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

    // Optional filter by giftId
    const giftIdFilter = event.queryStringParameters?.giftId

    let reservations: ReservationWithGift[] = []

    if (giftIdFilter) {
      // Query reservations for a specific gift using wedding-scoped key
      const giftKey = Keys.gift(weddingId, giftIdFilter)

      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': giftKey.pk,
            ':skPrefix': 'RESERVATION#',
          },
        })
      )

      // Get the gift details
      const giftResult = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          KeyConditionExpression: 'pk = :pk AND sk = :sk',
          ExpressionAttributeValues: {
            ':pk': giftKey.pk,
            ':sk': giftKey.sk,
          },
        })
      )

      const gift = giftResult.Items?.[0]
      const giftName = (gift?.name as MultilingualText) ?? {
        ms: '',
        en: '',
        zh: '',
        ta: '',
      }

      reservations = (result.Items ?? []).map((item) => ({
        id: item.id as string,
        giftId: item.giftId as string,
        giftName,
        guestName: item.guestName as string,
        guestPhone: item.guestPhone as string,
        rsvpId: item.rsvpId as string | undefined,
        quantity: item.quantity as number,
        message: item.message as string | undefined,
        reservedAt: item.reservedAt as string,
      }))
    } else {
      // Query all reservations for this wedding using GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `WEDDING#${weddingId}#RESERVATIONS`,
          },
          ScanIndexForward: false, // Most recent first
        })
      )

      const reservationItems = result.Items ?? []

      // Get unique gift IDs
      const giftIds = [...new Set(reservationItems.map((item) => item.giftId as string))]

      // Batch get gift details using wedding-scoped keys
      let giftMap: Record<string, MultilingualText> = {}
      if (giftIds.length > 0) {
        // BatchGet has a limit of 100 items
        for (let i = 0; i < giftIds.length; i += 100) {
          const batchIds = giftIds.slice(i, i + 100)
          const batchResult = await docClient.send(
            new BatchGetCommand({
              RequestItems: {
                [Resource.AppDataTable.name]: {
                  Keys: batchIds.map((giftId) => Keys.gift(weddingId!, giftId)),
                },
              },
            })
          )

          const gifts = batchResult.Responses?.[Resource.AppDataTable.name] ?? []
          for (const gift of gifts) {
            giftMap[gift.id as string] = gift.name as MultilingualText
          }
        }
      }

      reservations = reservationItems.map((item) => ({
        id: item.id as string,
        giftId: item.giftId as string,
        giftName: giftMap[item.giftId as string] ?? {
          ms: '',
          en: '',
          zh: '',
          ta: '',
        },
        guestName: item.guestName as string,
        guestPhone: item.guestPhone as string,
        rsvpId: (item.rsvpId as string) || undefined,
        quantity: item.quantity as number,
        message: (item.message as string) || undefined,
        reservedAt: item.reservedAt as string,
      }))
    }

    // Sort by reservedAt (most recent first)
    reservations.sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())

    // Calculate summary
    const totalReservations = reservations.length
    const totalQuantity = reservations.reduce((sum, r) => sum + r.quantity, 0)
    const uniqueGuests = new Set(reservations.map((r) => r.guestPhone)).size

    return createSuccessResponse(
      200,
      {
        reservations,
        summary: {
          totalReservations,
          totalQuantity,
          uniqueGuests,
        },
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /admin/w/{weddingId}/gifts/reservations',
        operation: 'listReservations',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
