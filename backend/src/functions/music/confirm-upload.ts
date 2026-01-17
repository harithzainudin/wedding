/**
 * Confirm Music Upload Endpoint (Admin)
 *
 * Confirms a music upload and creates the database record.
 * Route: POST /admin/w/{weddingId}/music/confirm
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
import { validateConfirmMusicUpload } from '../shared/music-validation'
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
      ExpressionAttributeValues: { ':pk': `WEDDING#${weddingId}#MUSIC` },
      ScanIndexForward: false,
      Limit: 1,
    })
  )

  const firstItem = result.Items?.[0]
  if (firstItem) {
    return ((firstItem.order as number) ?? 0) + 1
  }
  return 0
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let trackId: string | undefined
  let s3Key: string | undefined
  let title: string | undefined

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

    const validation = validateConfirmMusicUpload(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    trackId = validation.data.trackId
    s3Key = validation.data.s3Key
    title = validation.data.title
    const { filename, mimeType, artist, duration } = validation.data

    // ============================================
    // 5. Validate S3 Key Ownership (Security)
    // ============================================
    if (!validateS3KeyOwnership(s3Key, weddingId)) {
      return createErrorResponse(403, 'Invalid S3 key for this wedding', context, 'FORBIDDEN')
    }

    // ============================================
    // 6. Verify File Exists in S3
    // ============================================
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    )

    // ============================================
    // 7. Create Track Record
    // ============================================
    const order = await getNextOrder(weddingId)
    const now = new Date().toISOString()
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-5'

    const trackKeys = Keys.music(weddingId, trackId)
    const gsiKeys = Keys.gsi.weddingMusic(weddingId, order, trackId)

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: {
          ...trackKeys,
          ...gsiKeys,
          id: trackId,
          weddingId,
          title,
          artist: artist ?? null,
          duration,
          filename,
          s3Key,
          mimeType,
          fileSize: 0,
          order,
          source: 'upload',
          uploadedAt: now,
          uploadedBy: authResult.user.username,
        },
      })
    )

    return createSuccessResponse(
      200,
      {
        id: trackId,
        title,
        artist,
        duration,
        filename,
        url: getPublicS3Url(bucketName, region, s3Key),
        mimeType,
        order,
        source: 'upload',
        uploadedAt: now,
        uploadedBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/w/{weddingId}/music/confirm',
        operation: 'confirmMusicUpload',
        requestId: context.awsRequestId,
        input: { trackId, s3Key, title },
      },
      error
    )
    return createErrorResponse(500, 'Failed to confirm upload', context, 'DB_ERROR')
  }
}
