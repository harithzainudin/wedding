import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const imageId = event.pathParameters?.id

  try {
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    if (!imageId) {
      return createErrorResponse(400, 'Image ID is required', context, 'VALIDATION_ERROR')
    }

    // Get the image record
    const getResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `IMAGE#${imageId}`, sk: 'METADATA' },
      })
    )

    if (!getResult.Item) {
      return createErrorResponse(404, 'Image not found', context, 'NOT_FOUND')
    }

    const s3Key = getResult.Item.s3Key as string

    // Delete from S3
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
          endpoint: 'DELETE /images/{id}',
          operation: 'deleteFromS3',
          requestId: context.awsRequestId,
          input: { imageId, s3Key },
        },
        s3Error
      )
      // Continue to delete DB record even if S3 fails
    }

    // Delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `IMAGE#${imageId}`, sk: 'METADATA' },
      })
    )

    return createSuccessResponse(
      200,
      {
        message: 'Image deleted successfully',
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'DELETE /images/{id}',
        operation: 'deleteImage',
        requestId: context.awsRequestId,
        input: { imageId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
