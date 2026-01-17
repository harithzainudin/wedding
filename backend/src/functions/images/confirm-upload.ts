/**
 * Confirm Image Upload Endpoint (Admin)
 *
 * Confirms an image upload and creates the database record.
 * Route: POST /admin/w/{weddingId}/images/confirm
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { validateConfirmUpload } from '../shared/image-validation'
import { Keys } from '../shared/keys'
import { getPublicS3Url, validateS3KeyOwnership } from '../shared/s3-keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})
const s3Client = new S3Client({})

async function getNextOrder(weddingId: string): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#IMAGES` },
      ScanIndexForward: false,
      Limit: 1,
    })
  )

  if (result.Items && result.Items.length > 0) {
    const firstItem = result.Items[0]
    return ((firstItem?.order as number) ?? 0) + 1
  }
  return 1
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let imageId: string | undefined
  let s3Key: string | undefined
  let filename: string | undefined

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

    const validation = validateConfirmUpload(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    imageId = validation.data.imageId
    s3Key = validation.data.s3Key
    filename = validation.data.filename
    const { mimeType } = validation.data

    // ============================================
    // 5. Validate S3 Key Ownership (Security)
    // ============================================
    if (!validateS3KeyOwnership(s3Key, weddingId)) {
      return createErrorResponse(403, 'Invalid S3 key for this wedding', context, 'FORBIDDEN')
    }

    // ============================================
    // 6. Verify File Exists in S3
    // ============================================
    const headResult = await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    )

    const fileSize = headResult.ContentLength ?? 0
    const order = await getNextOrder(weddingId)
    const now = new Date().toISOString()

    // ============================================
    // 7. Create Image Record
    // ============================================
    const imageKeys = Keys.image(weddingId, imageId)
    const gsiKeys = Keys.gsi.weddingImages(weddingId, order, imageId)

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: {
          ...imageKeys,
          ...gsiKeys,
          id: imageId,
          weddingId,
          filename,
          s3Key,
          mimeType,
          fileSize,
          order,
          uploadedAt: now,
          uploadedBy: authResult.user.username,
        },
      })
    )

    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'
    const publicUrl = getPublicS3Url(bucketName, region, s3Key)

    return createSuccessResponse(
      201,
      {
        id: imageId,
        filename,
        s3Key,
        mimeType,
        fileSize,
        order,
        uploadedAt: now,
        url: publicUrl,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/images/confirm',
        operation: 'confirmUpload',
        requestId: context.awsRequestId,
        input: { imageId, s3Key, filename },
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
