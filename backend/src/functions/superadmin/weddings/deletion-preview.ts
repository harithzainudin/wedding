/**
 * Deletion Preview Endpoint (Super Admin Only)
 *
 * Returns counts of all data that would be deleted for a wedding.
 * Used to show the user what will be lost before confirming hard delete.
 *
 * GET /superadmin/weddings/{weddingId}/deletion-preview
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId } from '../../shared/validation'
import { Resource } from 'sst'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

interface DeletionPreview {
  weddingId: string
  weddingSlug: string
  displayName: string
  rsvpCount: number
  imageCount: number
  musicCount: number
  giftCount: number
  parkingCount: number
  qrCodeCount: number
  s3ObjectCount: number
}

/**
 * Count items using GSI query
 */
async function countGsiItems(gsi1pkValue: string): Promise<number> {
  let count = 0
  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: 'byStatus',
        KeyConditionExpression: 'gsi1pk = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': gsi1pkValue,
        },
        Select: 'COUNT',
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    count += result.Count ?? 0
    lastEvaluatedKey = result.LastEvaluatedKey
  } while (lastEvaluatedKey)

  return count
}

/**
 * Count S3 objects with a given prefix
 */
async function countS3Objects(prefix: string): Promise<number> {
  let count = 0
  let continuationToken: string | undefined

  do {
    const result = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: Resource.WeddingImageBucket.name,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )

    count += result.KeyCount ?? 0
    continuationToken = result.NextContinuationToken
  } while (continuationToken)

  return count
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let weddingId: string | undefined

  try {
    // ============================================
    // 1. Authorization: Require Super Admin
    // ============================================
    const authResult = requireSuperAdmin(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    // ============================================
    // 2. Extract and Validate Wedding ID
    // ============================================
    weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 3. Verify Wedding Exists
    // ============================================
    const weddingKey = Keys.wedding(weddingId)
    const existingWedding = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
      })
    )

    if (!existingWedding.Item) {
      return createErrorResponse(404, 'Wedding not found', context, 'WEDDING_NOT_FOUND')
    }

    const wedding = existingWedding.Item

    // ============================================
    // 4. Count All Wedding Data
    // ============================================
    const [rsvpCount, imageCount, musicCount, giftCount, parkingCount, qrCodeCount, s3ObjectCount] =
      await Promise.all([
        countGsiItems(`WEDDING#${weddingId}#RSVPS`),
        countGsiItems(`WEDDING#${weddingId}#IMAGES`),
        countGsiItems(`WEDDING#${weddingId}#MUSIC`),
        countGsiItems(`WEDDING#${weddingId}#GIFTS`),
        countGsiItems(`WEDDING#${weddingId}#PARKING`),
        countGsiItems(`WEDDING#${weddingId}#QRCODES`),
        countS3Objects(`weddings/${weddingId}/`),
      ])

    // ============================================
    // 5. Return Preview
    // ============================================
    const preview: DeletionPreview = {
      weddingId,
      weddingSlug: wedding.slug as string,
      displayName: wedding.displayName as string,
      rsvpCount,
      imageCount,
      musicCount,
      giftCount,
      parkingCount,
      qrCodeCount,
      s3ObjectCount,
    }

    return createSuccessResponse(200, preview, context)
  } catch (error) {
    logError(
      {
        endpoint: 'GET /superadmin/weddings/{weddingId}/deletion-preview',
        operation: 'get-deletion-preview',
        requestId: context.awsRequestId,
        input: { weddingId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
