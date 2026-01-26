/**
 * Admin Update RSVP Endpoint
 *
 * Allows admins to update existing RSVPs.
 * Route: PUT /admin/w/{weddingId}/rsvp/{id}
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import { Keys } from '../shared/keys'
import { getWeddingById, requireAdminAccessibleWedding } from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { type AnyGuestType, isValidGuestType } from '../shared/rsvp-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const VALID_TITLES = [
  'Tan Sri',
  'Puan Sri',
  "Dato' Seri",
  'Datin Seri',
  "Dato'",
  'Datin',
  'Tuan',
  'Puan',
  'Encik',
  'Cik',
] as const

type HonorificTitle = (typeof VALID_TITLES)[number]

// Attendance status - supports Yes, No, and Maybe options
type AttendanceStatus = 'yes' | 'no' | 'maybe'

interface AdminRsvpInput {
  title?: string
  fullName: string
  isAttending: AttendanceStatus
  numberOfAdults: number
  numberOfChildren: number
  phoneNumber?: string
  message?: string
  guestType?: AnyGuestType | null // null means remove
}

function validateAdminRsvpInput(input: unknown):
  | {
      valid: true
      data: AdminRsvpInput
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
    return {
      valid: false,
      error: 'Full name is required and must be at least 2 characters',
    }
  }

  if (body.title !== undefined && body.title !== '') {
    if (typeof body.title !== 'string' || !VALID_TITLES.includes(body.title as HonorificTitle)) {
      return { valid: false, error: 'Invalid title selected' }
    }
  }

  // Validate attendance - must be 'yes', 'no', or 'maybe'
  const validAttendanceValues: AttendanceStatus[] = ['yes', 'no', 'maybe']
  if (
    typeof body.isAttending !== 'string' ||
    !validAttendanceValues.includes(body.isAttending as AttendanceStatus)
  ) {
    return { valid: false, error: 'Attendance status must be yes, no, or maybe' }
  }

  // Validate number of adults (required if attending or maybe, at least 1)
  if (body.isAttending === 'yes' || body.isAttending === 'maybe') {
    if (
      typeof body.numberOfAdults !== 'number' ||
      body.numberOfAdults < 1 ||
      body.numberOfAdults > 5
    ) {
      return {
        valid: false,
        error: 'Number of adults must be between 1 and 5',
      }
    }

    // Validate number of children (optional, 0-5)
    if (body.numberOfChildren !== undefined) {
      if (
        typeof body.numberOfChildren !== 'number' ||
        body.numberOfChildren < 0 ||
        body.numberOfChildren > 5
      ) {
        return {
          valid: false,
          error: 'Number of children must be between 0 and 5',
        }
      }
    }
  }

  let cleanPhone = ''
  if (body.phoneNumber !== undefined && body.phoneNumber !== '') {
    if (typeof body.phoneNumber !== 'string') {
      return { valid: false, error: 'Phone number must be a string' }
    }
    cleanPhone = body.phoneNumber.replace(/[-\s]/g, '')
    const phoneRegex = /^(\+?60|0)[1-9]\d{7,9}$/
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      return { valid: false, error: 'Invalid phone number format' }
    }
  }

  if (body.message !== undefined) {
    if (typeof body.message !== 'string') {
      return { valid: false, error: 'Message must be a string' }
    }
    if (body.message.length > 500) {
      return {
        valid: false,
        error: 'Message must be less than 500 characters',
      }
    }
  }

  // Validate guestType (optional, null means remove)
  let validatedGuestType: AnyGuestType | null | undefined
  if (body.guestType === null) {
    validatedGuestType = null // Explicitly remove
  } else if (body.guestType !== undefined && body.guestType !== '') {
    if (!isValidGuestType(body.guestType)) {
      return { valid: false, error: 'Invalid guest type selected' }
    }
    validatedGuestType = body.guestType as AnyGuestType
  }

  // For 'no' responses, set guest counts to 0
  const shouldHaveGuestCounts = body.isAttending === 'yes' || body.isAttending === 'maybe'

  return {
    valid: true,
    data: {
      title: body.title as string | undefined,
      fullName: body.fullName.trim(),
      isAttending: body.isAttending as AttendanceStatus,
      numberOfAdults: shouldHaveGuestCounts ? (body.numberOfAdults as number) : 0,
      numberOfChildren: shouldHaveGuestCounts
        ? ((body.numberOfChildren as number | undefined) ?? 0)
        : 0,
      phoneNumber: cleanPhone || undefined,
      message: typeof body.message === 'string' ? body.message.trim() : undefined,
      guestType: validatedGuestType,
    },
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let rsvpId: string | undefined

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
    // 4. Extract and Validate RSVP ID
    // ============================================
    rsvpId = event.pathParameters?.id
    if (!rsvpId) {
      return createErrorResponse(400, 'RSVP ID is required', context, 'VALIDATION_ERROR')
    }

    // ============================================
    // 5. Fetch Existing RSVP Record
    // ============================================
    const rsvpKeys = Keys.rsvp(weddingId, rsvpId)
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: rsvpKeys,
      })
    )

    if (!existingResult.Item) {
      return createErrorResponse(404, 'RSVP not found', context, 'NOT_FOUND')
    }

    const existingItem = existingResult.Item

    // ============================================
    // 6. Parse and Validate Input
    // ============================================
    let body: unknown
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', context, 'INVALID_JSON')
    }

    const validation = validateAdminRsvpInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { data } = validation
    const timestamp = new Date().toISOString()
    // Map attendance status to GSI partition key
    const statusMap = { yes: 'attending', maybe: 'maybe', no: 'not_attending' } as const
    const status = statusMap[data.isAttending]

    // ============================================
    // 7. Update RSVP Record
    // ============================================
    const updatedItem: Record<string, unknown> = {
      ...rsvpKeys,
      ...Keys.gsi.weddingRsvpsByStatus(weddingId, status, existingItem.submittedAt as string),
      id: rsvpId,
      weddingId,
      title: data.title ?? '',
      fullName: data.fullName,
      isAttending: data.isAttending,
      numberOfAdults: data.numberOfAdults,
      numberOfChildren: data.numberOfChildren,
      phoneNumber: data.phoneNumber ?? '',
      message: data.message ?? '',
      submittedAt: existingItem.submittedAt,
      source: existingItem.source ?? 'public',
      createdBy: existingItem.createdBy,
      updatedAt: timestamp,
      updatedBy: authResult.user.username,
    }

    // Handle guestType: add if provided, remove if null, preserve if undefined
    if (data.guestType === null) {
      // Explicitly remove - don't include in updatedItem
    } else if (data.guestType !== undefined) {
      updatedItem.guestType = data.guestType
    } else if (existingItem.guestType) {
      // Preserve existing value
      updatedItem.guestType = existingItem.guestType
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedItem,
      })
    )

    return createSuccessResponse(
      200,
      {
        id: rsvpId,
        updatedAt: timestamp,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /admin/w/{weddingId}/rsvp/{id}',
        operation: 'updateRsvp',
        requestId: context.awsRequestId,
        input: { rsvpId },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
