import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateParkingImageUpload } from '../shared/parking-validation'
import {
  MAX_PARKING_IMAGES,
  PARKING_S3_PREFIX,
  MIME_TO_EXTENSION,
} from '../shared/parking-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

async function getCurrentParkingImageCount(): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': 'PARKING#IMAGES' },
      Select: 'COUNT',
    })
  )
  return result.Count ?? 0
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let mimeType: string | undefined
  let fileSize: number | undefined

  try {
    const authResult = requireAuth(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: unknown
    try {
      body = JSON.parse(event.body)
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    // Get current count
    const currentCount = await getCurrentParkingImageCount()

    // Validate request
    const validation = validateParkingImageUpload(body, currentCount, MAX_PARKING_IMAGES)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    mimeType = validation.data.mimeType
    fileSize = validation.data.fileSize
    const imageId = uuidv4()
    const extension = MIME_TO_EXTENSION[mimeType] ?? ''
    const s3Key = `${PARKING_S3_PREFIX}${imageId}${extension}`

    // Generate presigned URL (valid for 10 minutes)
    const command = new PutObjectCommand({
      Bucket: Resource.WeddingImageBucket.name,
      Key: s3Key,
      ContentType: mimeType,
      ContentLength: fileSize,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    })

    return createSuccessResponse(
      200,
      {
        uploadUrl: presignedUrl,
        imageId,
        s3Key,
        expiresIn: 600,
        caption: validation.data.caption,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /parking/presigned-url',
        operation: 'requestParkingUpload',
        requestId: context.awsRequestId,
        input: { mimeType, fileSize },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
