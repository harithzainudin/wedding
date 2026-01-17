/**
 * Submit RSVP Endpoint (Public)
 *
 * Allows guests to submit their RSVP for a specific wedding.
 * Route: POST /{weddingSlug}/rsvp
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { validateRsvpInput } from '../shared/validation'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { resolveWeddingSlug, requireActiveWedding } from '../shared/wedding-middleware'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let fullName: string | undefined

  try {
    // ============================================
    // 1. Extract and Validate Wedding Slug
    // ============================================
    const weddingSlug = event.pathParameters?.weddingSlug
    if (!weddingSlug) {
      return createErrorResponse(400, 'Wedding slug is required', context, 'MISSING_SLUG')
    }

    // ============================================
    // 2. Resolve Slug to Wedding
    // ============================================
    const wedding = await resolveWeddingSlug(docClient, weddingSlug)
    const weddingCheck = requireActiveWedding(wedding)
    if (!weddingCheck.success) {
      return createErrorResponse(
        weddingCheck.statusCode,
        weddingCheck.error,
        context,
        'WEDDING_ERROR'
      )
    }

    const { weddingId } = weddingCheck.wedding

    // ============================================
    // 3. Parse and Validate Input
    // ============================================
    let body: unknown
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', context, 'INVALID_JSON')
    }

    const validation = validateRsvpInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation
    fullName = data.fullName

    // ============================================
    // 4. Create RSVP Record
    // ============================================
    const id = uuidv4()
    const timestamp = new Date().toISOString()
    const status = data.isAttending ? 'attending' : 'not_attending'

    const rsvpItem = {
      ...Keys.rsvp(weddingId, id),
      ...Keys.gsi.weddingRsvpsByStatus(weddingId, status, timestamp),
      id,
      weddingId,
      title: data.title,
      fullName: data.fullName,
      isAttending: data.isAttending,
      numberOfGuests: data.numberOfGuests,
      phoneNumber: data.phoneNumber,
      message: data.message ?? '',
      submittedAt: timestamp,
      source: 'public',
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: rsvpItem,
      })
    )

    return createSuccessResponse(
      201,
      {
        id,
        submittedAt: timestamp,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /{weddingSlug}/rsvp',
        operation: 'submitRsvp',
        requestId: context.awsRequestId,
        input: { fullName },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
