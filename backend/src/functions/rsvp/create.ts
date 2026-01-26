/**
 * Admin Create RSVP Endpoint
 *
 * Allows admins to manually create RSVPs.
 * Route: POST /admin/w/{weddingId}/rsvp
 *
 * SECURITY: Requires wedding access authorization
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
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

interface AdminRsvpInput {
  title?: string
  fullName: string
  isAttending: boolean
  numberOfGuests: number
  phoneNumber?: string
  message?: string
  guestType?: AnyGuestType
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

  if (typeof body.isAttending !== 'boolean') {
    return { valid: false, error: 'Attendance status is required' }
  }

  if (body.isAttending) {
    if (
      typeof body.numberOfGuests !== 'number' ||
      body.numberOfGuests < 1 ||
      body.numberOfGuests > 10
    ) {
      return {
        valid: false,
        error: 'Number of guests must be between 1 and 10',
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

  // Validate guestType (optional)
  let validatedGuestType: AnyGuestType | undefined
  if (body.guestType !== undefined && body.guestType !== null && body.guestType !== '') {
    if (!isValidGuestType(body.guestType)) {
      return { valid: false, error: 'Invalid guest type selected' }
    }
    validatedGuestType = body.guestType as AnyGuestType
  }

  return {
    valid: true,
    data: {
      title: body.title as string | undefined,
      fullName: body.fullName.trim(),
      isAttending: body.isAttending,
      numberOfGuests: body.isAttending ? (body.numberOfGuests as number) : 0,
      phoneNumber: cleanPhone || undefined,
      message: typeof body.message === 'string' ? body.message.trim() : undefined,
      guestType: validatedGuestType,
    },
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let fullName: string | undefined

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
    fullName = data.fullName

    // ============================================
    // 5. Create RSVP Record
    // ============================================
    const id = uuidv4()
    const timestamp = new Date().toISOString()
    const status = data.isAttending ? 'attending' : 'not_attending'

    const rsvpItem: Record<string, unknown> = {
      ...Keys.rsvp(weddingId, id),
      ...Keys.gsi.weddingRsvpsByStatus(weddingId, status, timestamp),
      id,
      weddingId,
      title: data.title ?? '',
      fullName: data.fullName,
      isAttending: data.isAttending,
      numberOfGuests: data.numberOfGuests,
      phoneNumber: data.phoneNumber ?? '',
      message: data.message ?? '',
      submittedAt: timestamp,
      source: 'admin',
      createdBy: authResult.user.username,
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
        endpoint: 'POST /admin/w/{weddingId}/rsvp',
        operation: 'createRsvp',
        requestId: context.awsRequestId,
        input: { fullName },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
