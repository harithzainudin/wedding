import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireAuth } from '../shared/auth'
import { logError } from '../shared/logger'
import { GIFT_LIMITS } from '../shared/gift-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

interface GiftUploadRequest {
  filename: string
  mimeType: string
  fileSize: number
  giftId?: string // Optional: if updating an existing gift's image
}

function validateGiftImageUpload(
  input: unknown,
  maxFileSize: number,
  allowedFormats: string[]
): { valid: true; data: GiftUploadRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate filename
  if (typeof body.filename !== 'string' || !body.filename.trim()) {
    return { valid: false, error: 'Filename is required' }
  }

  // Validate mimeType
  if (typeof body.mimeType !== 'string') {
    return { valid: false, error: 'MIME type is required' }
  }

  if (!allowedFormats.includes(body.mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedFormats.join(', ')}`,
    }
  }

  // Validate fileSize
  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    return { valid: false, error: 'File size must be a positive number' }
  }

  if (body.fileSize > maxFileSize) {
    const maxMB = Math.round(maxFileSize / (1024 * 1024))
    return { valid: false, error: `File size exceeds maximum of ${maxMB}MB` }
  }

  // Validate giftId if provided
  if (body.giftId !== undefined && body.giftId !== null && body.giftId !== '') {
    if (typeof body.giftId !== 'string') {
      return { valid: false, error: 'Gift ID must be a string' }
    }
  }

  return {
    valid: true,
    data: {
      filename: body.filename.trim(),
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      giftId:
        typeof body.giftId === 'string' && body.giftId.trim() ? body.giftId.trim() : undefined,
    },
  }
}

async function getGiftSettings() {
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: { pk: 'SETTINGS', sk: 'GIFTS' },
    })
  )

  return {
    maxFileSize: (result.Item?.maxFileSize as number) ?? GIFT_LIMITS.maxFileSize,
    maxItems: (result.Item?.maxItems as number) ?? GIFT_LIMITS.maxItems,
    allowedFormats: (result.Item?.allowedFormats as string[]) ?? GIFT_LIMITS.allowedFormats,
  }
}

async function getCurrentGiftCount(): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': 'GIFTS' },
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

    // Get settings and validate
    const settings = await getGiftSettings()
    const validation = validateGiftImageUpload(body, settings.maxFileSize, settings.allowedFormats)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // If no giftId provided, check max gifts limit (for new gift creation)
    if (!validation.data.giftId) {
      const currentCount = await getCurrentGiftCount()
      if (currentCount >= settings.maxItems) {
        return createErrorResponse(
          400,
          `Maximum of ${settings.maxItems} gifts reached`,
          context,
          'LIMIT_EXCEEDED'
        )
      }
    }

    mimeType = validation.data.mimeType
    fileSize = validation.data.fileSize
    const giftId = validation.data.giftId ?? uuidv4()
    const extension = MIME_TO_EXTENSION[mimeType] ?? ''
    const s3Key = `gifts/${giftId}${extension}`

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
        giftId,
        s3Key,
        expiresIn: 600,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /gifts/presigned-url',
        operation: 'requestGiftUpload',
        requestId: context.awsRequestId,
        input: { mimeType, fileSize },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
