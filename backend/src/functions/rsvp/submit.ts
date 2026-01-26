/**
 * Submit RSVP Endpoint (Public)
 *
 * Allows guests to submit their RSVP for a specific wedding.
 * Route: POST /{weddingSlug}/rsvp
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { validateRsvpInput } from '../shared/validation'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { resolveWeddingSlug, requireActiveWedding } from '../shared/wedding-middleware'
import { DEFAULT_RSVP_SETTINGS, type RsvpSettings, canAcceptRsvp } from '../shared/rsvp-validation'

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
    // 2b. Check if RSVPs are accepting submissions
    // ============================================
    const settingsKey = Keys.settings(weddingId, 'RSVP')
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: settingsKey,
      })
    )

    const rsvpSettings: RsvpSettings = settingsResult.Item?.settings || DEFAULT_RSVP_SETTINGS

    // Visibility is now controlled by Design Tab's section settings
    // Here we only check if RSVPs are being accepted (using the acceptingRsvps flag and deadline)
    const eventDate = weddingCheck.wedding.weddingDate
    if (!canAcceptRsvp(rsvpSettings, eventDate)) {
      return createErrorResponse(403, 'RSVPs are currently closed', context, 'RSVP_CLOSED')
    }

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
    // Map attendance status to GSI partition key
    const statusMap = { yes: 'attending', maybe: 'maybe', no: 'not_attending' } as const
    const status = statusMap[data.isAttending]

    const rsvpItem: Record<string, unknown> = {
      ...Keys.rsvp(weddingId, id),
      ...Keys.gsi.weddingRsvpsByStatus(weddingId, status, timestamp),
      id,
      weddingId,
      title: data.title,
      fullName: data.fullName,
      isAttending: data.isAttending,
      numberOfAdults: data.numberOfAdults,
      numberOfChildren: data.numberOfChildren,
      phoneNumber: data.phoneNumber,
      message: data.message ?? '',
      submittedAt: timestamp,
      source: 'public',
    }

    // Add guestType only if provided (optional field)
    if (data.guestType) {
      rsvpItem.guestType = data.guestType
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
