/**
 * DELETE /admin/w/{weddingId}/gifts/{id}
 * Admin endpoint to delete a gift
 */
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { validateS3KeyOwnership } from '../shared/s3-keys'
import { isValidWeddingId } from '../shared/validation'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

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

    // Get the gift to check if it exists and get S3 key
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

    const gift = existingResult.Item

    // Delete image from S3 if exists
    if (gift.s3Key) {
      const s3Key = gift.s3Key as string
      // Validate S3 key belongs to this wedding
      if (validateS3KeyOwnership(s3Key, weddingId)) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: Resource.WeddingImageBucket.name,
              Key: s3Key,
            })
          )
        } catch (s3Error) {
          // Log but don't fail - the S3 object might already be deleted
          console.warn('Failed to delete S3 object:', s3Error)
        }
      }
    }

    // Get all reservations for this gift
    const reservationsResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': giftKey.pk,
          ':skPrefix': 'RESERVATION#',
        },
      })
    )

    // Delete all reservations in batch
    const reservations = reservationsResult.Items ?? []
    if (reservations.length > 0) {
      const deleteRequests = reservations.map((reservation) => ({
        DeleteRequest: {
          Key: {
            pk: reservation.pk,
            sk: reservation.sk,
          },
        },
      }))

      // DynamoDB BatchWrite supports max 25 items
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25)
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [Resource.AppDataTable.name]: batch,
            },
          })
        )
      }
    }

    // Delete the gift
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: giftKey,
      })
    )

    return createSuccessResponse(
      200,
      {
        message: 'Gift deleted successfully',
        id: giftId,
        reservationsDeleted: reservations.length,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /admin/w/{weddingId}/gifts/{id}',
        operation: 'deleteGift',
        requestId: context.awsRequestId,
        input: { weddingId, giftId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
