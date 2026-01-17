import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})
const s3Client = new S3Client({})

interface ConfirmGiftUploadRequest {
  giftId: string
  s3Key: string
  filename: string
  mimeType: string
}

function validateConfirmGiftUpload(
  input: unknown
): { valid: true; data: ConfirmGiftUploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (typeof body.giftId !== 'string' || !body.giftId.trim()) {
    return { valid: false, error: 'Gift ID is required' }
  }

  if (typeof body.s3Key !== 'string' || !body.s3Key.trim()) {
    return { valid: false, error: 'S3 key is required' }
  }

  if (typeof body.filename !== 'string' || !body.filename.trim()) {
    return { valid: false, error: 'Filename is required' }
  }

  if (typeof body.mimeType !== 'string' || !body.mimeType.trim()) {
    return { valid: false, error: 'MIME type is required' }
  }

  return {
    valid: true,
    data: {
      giftId: body.giftId.trim(),
      s3Key: body.s3Key.trim(),
      filename: body.filename.trim(),
      mimeType: body.mimeType.trim(),
    },
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let giftId: string | undefined
  let s3Key: string | undefined
  let filename: string | undefined

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

    const validation = validateConfirmGiftUpload(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    giftId = validation.data.giftId
    s3Key = validation.data.s3Key
    filename = validation.data.filename
    const { mimeType } = validation.data

    // Verify the file exists in S3
    const headResult = await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    )

    const fileSize = headResult.ContentLength ?? 0

    // Check if gift exists
    const existingGiftResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `GIFT#${giftId}`, sk: 'METADATA' },
      })
    )

    if (!existingGiftResult.Item) {
      return createErrorResponse(
        404,
        'Gift not found. Create the gift first before uploading an image.',
        context,
        'NOT_FOUND'
      )
    }

    const existingGift = existingGiftResult.Item

    // Delete old image from S3 if exists
    if (existingGift.s3Key && existingGift.s3Key !== s3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: Resource.WeddingImageBucket.name,
            Key: existingGift.s3Key as string,
          })
        )
      } catch (deleteError) {
        // Log but don't fail - old image cleanup is best-effort
        console.warn('Failed to delete old S3 object:', deleteError)
      }
    }

    // Construct the public URL for the image
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`

    const timestamp = new Date().toISOString()

    // Update gift record with image info
    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `GIFT#${giftId}`, sk: 'METADATA' },
        UpdateExpression:
          'SET imageUrl = :imageUrl, s3Key = :s3Key, updatedAt = :updatedAt, updatedBy = :updatedBy',
        ExpressionAttributeValues: {
          ':imageUrl': publicUrl,
          ':s3Key': s3Key,
          ':updatedAt': timestamp,
          ':updatedBy': authResult.user.username,
        },
      })
    )

    return createSuccessResponse(
      200,
      {
        giftId,
        filename,
        s3Key,
        mimeType,
        fileSize,
        imageUrl: publicUrl,
        updatedAt: timestamp,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /gifts/confirm',
        operation: 'confirmGiftUpload',
        requestId: context.awsRequestId,
        input: { giftId, s3Key, filename },
      },
      error
    )
    return createErrorResponse(
      400,
      'File not found in S3. Upload may have failed.',
      context,
      'S3_ERROR'
    )
  }
}
