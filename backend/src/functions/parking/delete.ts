/**
 * Delete Parking Image Endpoint (Admin)
 *
 * Deletes a parking image from S3 and DynamoDB.
 * Route: DELETE /admin/w/{weddingId}/parking/{id}
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const imageId = event.pathParameters?.id

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

    // ============================================
    // 3b. Check Wedding Status (block archived for non-super admins)
    // ============================================
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
    // 4. Validate Image ID
    // ============================================
    if (!imageId) {
      return createErrorResponse(400, 'Image ID is required', context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Get Parking Image Record
    // ============================================
    const parkingKeys = Keys.parking(weddingId, imageId)
    const getResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: parkingKeys,
      })
    )

    if (!getResult.Item) {
      return createErrorResponse(404, 'Parking image not found', context, 'NOT_FOUND')
    }

    const s3Key = getResult.Item.s3Key as string

    // ============================================
    // 6. Delete from S3
    // ============================================
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: Resource.WeddingImageBucket.name,
          Key: s3Key,
        })
      )
    } catch (s3Error) {
      logError(
        {
          endpoint: 'DELETE /admin/w/{weddingId}/parking/{id}',
          operation: 'deleteFromS3',
          requestId: context.awsRequestId,
          input: { imageId, s3Key },
        },
        s3Error
      )
      // Continue to delete DB record even if S3 fails
    }

    // ============================================
    // 7. Delete from DynamoDB
    // ============================================
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: parkingKeys,
      })
    )

    return createSuccessResponse(
      200,
      {
        message: 'Parking image deleted successfully',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /admin/w/{weddingId}/parking/{id}',
        operation: 'deleteParkingImage',
        requestId: context.awsRequestId,
        input: { imageId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
