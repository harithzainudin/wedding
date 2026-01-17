import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { logError } from '../shared/logger'
import { MAX_PARKING_IMAGES } from '../shared/parking-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'

    // Query all parking images ordered by gsi1sk
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': 'PARKING#IMAGES' },
        ScanIndexForward: true, // Ascending order
      })
    )

    const images = (result.Items ?? []).map((item) => ({
      id: item.id as string,
      filename: item.filename as string,
      s3Key: item.s3Key as string,
      mimeType: item.mimeType as string,
      fileSize: item.fileSize as number,
      caption: (item.caption as string) || undefined,
      order: item.order as number,
      uploadedAt: item.uploadedAt as string,
      uploadedBy: item.uploadedBy as string,
      url: `https://${bucketName}.s3.${region}.amazonaws.com/${item.s3Key}`,
    }))

    return createSuccessResponse(
      200,
      {
        images,
        total: images.length,
        maxImages: MAX_PARKING_IMAGES,
        remainingSlots: MAX_PARKING_IMAGES - images.length,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /parking/images',
        operation: 'listParkingImages',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Failed to list parking images', context, 'DB_ERROR')
  }
}
