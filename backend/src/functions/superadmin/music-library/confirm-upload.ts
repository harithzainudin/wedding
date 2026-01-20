/**
 * Confirm Global Music Upload Endpoint (Super Admin Only)
 *
 * Confirms a music upload and creates the database record.
 * Route: POST /superadmin/music-library/confirm
 *
 * SECURITY: Requires super admin authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { getPublicS3Url, isGlobalMusicS3Key } from '../../shared/s3-keys'
import {
  validateGlobalMusicUploadRequest,
  type GlobalMusicUploadRequest,
  type MusicCategory,
} from '../../shared/global-music-validation'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

interface ConfirmUploadRequest extends GlobalMusicUploadRequest {
  trackId: string
  s3Key: string
}

async function getNextOrderInCategory(category: MusicCategory): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: 'byStatus',
      KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :category)',
      ExpressionAttributeValues: {
        ':pk': 'GLOBALMUSIC',
        ':category': `${category}#`,
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  )

  if (!result.Items || result.Items.length === 0) {
    return 0
  }

  return ((result.Items[0]?.order as number) ?? 0) + 1
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let trackId: string | undefined

  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Parse and Validate Input
    // ============================================
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: ConfirmUploadRequest
    try {
      body = JSON.parse(event.body) as ConfirmUploadRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    // Validate required fields
    if (!body.trackId) {
      return createErrorResponse(400, 'trackId is required', context, 'MISSING_TRACK_ID')
    }
    if (!body.s3Key) {
      return createErrorResponse(400, 's3Key is required', context, 'MISSING_S3_KEY')
    }

    trackId = body.trackId

    // Validate S3 key is for global music
    if (!isGlobalMusicS3Key(body.s3Key)) {
      return createErrorResponse(400, 'Invalid S3 key for global music', context, 'INVALID_S3_KEY')
    }

    // Validate upload request
    const validation = validateGlobalMusicUploadRequest(body)
    if ('error' in validation) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 3. Verify File Exists in S3
    // ============================================
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: Resource.WeddingImageBucket.name,
          Key: body.s3Key,
        })
      )
    } catch (error) {
      if ((error as { name?: string }).name === 'NotFound') {
        return createErrorResponse(404, 'File not found in S3', context, 'FILE_NOT_FOUND')
      }
      throw error
    }

    // ============================================
    // 4. Calculate Order and Create Record
    // ============================================
    const order = await getNextOrderInCategory(validation.category)
    const now = new Date().toISOString()

    const globalMusicRecord = {
      ...Keys.globalMusic(body.trackId),
      ...Keys.gsi.allGlobalMusic(validation.category, order, body.trackId),
      id: body.trackId,
      title: validation.title,
      ...(validation.artist && { artist: validation.artist }),
      duration: validation.duration ?? 0,
      filename: validation.filename,
      s3Key: body.s3Key,
      mimeType: validation.mimeType,
      fileSize: validation.fileSize,
      category: validation.category,
      order,
      ...(validation.license && { license: validation.license }),
      uploadedAt: now,
      uploadedBy: authResult.user.username,
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: globalMusicRecord,
      })
    )

    // ============================================
    // 5. Return Created Track
    // ============================================
    const bucketName = Resource.WeddingImageBucket.name
    const region = process.env.AWS_REGION ?? 'ap-southeast-1'

    return createSuccessResponse(
      201,
      {
        id: body.trackId,
        title: validation.title,
        ...(validation.artist && { artist: validation.artist }),
        duration: validation.duration ?? 0,
        filename: validation.filename,
        url: getPublicS3Url(bucketName, region, body.s3Key),
        mimeType: validation.mimeType,
        fileSize: validation.fileSize,
        category: validation.category,
        order,
        ...(validation.license && { license: validation.license }),
        uploadedAt: now,
        uploadedBy: authResult.user.username,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /superadmin/music-library/confirm',
        operation: 'confirmGlobalMusicUpload',
        requestId: context.awsRequestId,
        input: { trackId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
