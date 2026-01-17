import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_IMAGES,
  DEFAULT_SHOW_GALLERY,
  ALLOWED_MIME_TYPES,
} from '../shared/image-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Auth is optional for listing images - public can view, admin gets extra details
  const authResult = requireAuth(event)
  const isAuthenticated = authResult.authenticated

  try {
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'

    // Query all images ordered by gsi1sk
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': 'IMAGES' },
        ScanIndexForward: true, // Ascending order
      })
    )

    const images = (result.Items ?? []).map((item) => ({
      id: item.id as string,
      filename: item.filename as string,
      mimeType: item.mimeType as string,
      fileSize: item.fileSize as number,
      order: item.order as number,
      uploadedAt: item.uploadedAt as string,
      uploadedBy: item.uploadedBy as string,
      url: `https://${bucketName}.s3.${region}.amazonaws.com/${item.s3Key}`,
    }))

    // Get settings (needed for both admin and public)
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: 'SETTINGS', sk: 'IMAGES' },
      })
    )

    const showGallery = (settingsResult.Item?.showGallery as boolean) ?? DEFAULT_SHOW_GALLERY

    // If authenticated admin, include full settings info
    if (isAuthenticated) {
      const settings = {
        maxFileSize: (settingsResult.Item?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
        maxImages: (settingsResult.Item?.maxImages as number) ?? DEFAULT_MAX_IMAGES,
        allowedFormats: (settingsResult.Item?.allowedFormats as string[]) ?? [
          ...ALLOWED_MIME_TYPES,
        ],
        showGallery,
      }

      return createSuccessResponse(
        200,
        {
          images,
          total: images.length,
          settings,
          remainingSlots: settings.maxImages - images.length,
        },
        context
      )
    }

    // Public response - images and showGallery flag
    return createSuccessResponse(
      200,
      {
        images,
        total: images.length,
        showGallery,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /images',
        operation: 'listImages',
        requestId: context.awsRequestId,
        input: { isAuthenticated },
      },
      error
    )
    return createErrorResponse(500, 'Failed to list images', context, 'DB_ERROR')
  }
}
