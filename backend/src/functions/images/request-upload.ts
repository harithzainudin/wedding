/**
 * Request Image Upload Endpoint (Admin)
 *
 * Generates a presigned URL for uploading an image.
 * Route: POST /admin/w/{weddingId}/images/presigned-url
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateImageUpload } from '../shared/image-validation'
import { Keys } from '../shared/keys'
import { S3Keys } from '../shared/s3-keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_VIDEO_SIZE,
  DEFAULT_MAX_IMAGES,
  ALLOWED_MEDIA_TYPES,
  MIME_TO_EXTENSION,
} from '../shared/image-constants'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

async function getImageSettings(weddingId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: Keys.settings(weddingId, 'IMAGES'),
    })
  )

  return {
    maxFileSize: (result.Item?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
    maxVideoSize: (result.Item?.maxVideoSize as number) ?? DEFAULT_MAX_VIDEO_SIZE,
    maxImages: (result.Item?.maxImages as number) ?? DEFAULT_MAX_IMAGES,
    allowedFormats: (result.Item?.allowedFormats as string[]) ?? [...ALLOWED_MEDIA_TYPES],
  }
}

async function getCurrentImageCount(weddingId: string): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#IMAGES` },
      Select: 'COUNT',
    })
  )
  return result.Count ?? 0
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let mimeType: string | undefined
  let fileSize: number | undefined

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
    // 3b. Check Wedding Status (Archived Check)
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
    // 4. Parse and Validate Input
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: unknown
    try {
      body = JSON.parse(event.body)
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    const settings = await getImageSettings(weddingId)
    const validation = validateImageUpload(body, settings)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Check Image Limit
    // ============================================
    const currentCount = await getCurrentImageCount(weddingId)
    if (currentCount >= settings.maxImages) {
      return createErrorResponse(
        400,
        `Maximum of ${settings.maxImages} images reached`,
        context,
        'LIMIT_EXCEEDED'
      )
    }

    // ============================================
    // 6. Generate Presigned URL
    // ============================================
    mimeType = validation.data.mimeType
    fileSize = validation.data.fileSize
    const imageId = uuidv4()
    const extension = MIME_TO_EXTENSION[mimeType] ?? ''
    const s3Key = S3Keys.gallery(weddingId, imageId, extension)

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
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/images/presigned-url',
        operation: 'requestUpload',
        requestId: context.awsRequestId,
        input: { mimeType, fileSize },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
