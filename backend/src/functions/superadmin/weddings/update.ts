/**
 * Update Wedding Endpoint (Super Admin Only)
 *
 * Updates wedding details like displayName, weddingDate, and status.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { createSuccessResponse, createErrorResponse } from '../../shared/response'
import { requireSuperAdmin } from '../../shared/auth'
import { logError } from '../../shared/logger'
import { Keys } from '../../shared/keys'
import { isValidWeddingId } from '../../shared/validation'
import { Resource } from 'sst'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface UpdateWeddingInput {
  displayName?: string
  weddingDate?: string
  status?: 'active' | 'draft' | 'inactive' | 'archived'
  plan?: 'free' | 'basic' | 'premium'
}

function validateUpdateInput(
  body: unknown
): { valid: true; data: UpdateWeddingInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as Record<string, unknown>
  const data: UpdateWeddingInput = {}

  // Validate displayName
  if (input.displayName !== undefined) {
    if (
      typeof input.displayName !== 'string' ||
      input.displayName.length < 1 ||
      input.displayName.length > 100
    ) {
      return { valid: false, error: 'Display name must be between 1 and 100 characters' }
    }
    data.displayName = input.displayName
  }

  // Validate weddingDate
  if (input.weddingDate !== undefined) {
    if (input.weddingDate !== null && typeof input.weddingDate !== 'string') {
      return { valid: false, error: 'Wedding date must be a string or null' }
    }
    if (input.weddingDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.weddingDate)) {
      return { valid: false, error: 'Wedding date must be in YYYY-MM-DD format' }
    }
    data.weddingDate = input.weddingDate as string | undefined
  }

  // Validate status
  if (input.status !== undefined) {
    const validStatuses = ['active', 'draft', 'inactive', 'archived']
    if (!validStatuses.includes(input.status as string)) {
      return { valid: false, error: `Status must be one of: ${validStatuses.join(', ')}` }
    }
    data.status = input.status as 'active' | 'draft' | 'inactive' | 'archived'
  }

  // Validate plan
  if (input.plan !== undefined) {
    const validPlans = ['free', 'basic', 'premium']
    if (!validPlans.includes(input.plan as string)) {
      return { valid: false, error: `Plan must be one of: ${validPlans.join(', ')}` }
    }
    data.plan = input.plan as 'free' | 'basic' | 'premium'
  }

  // Ensure at least one field is being updated
  if (Object.keys(data).length === 0) {
    return { valid: false, error: 'At least one field must be provided for update' }
  }

  return { valid: true, data }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
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
    const weddingId = event.pathParameters?.weddingId
    if (!weddingId) {
      return createErrorResponse(400, 'Wedding ID is required', context, 'MISSING_WEDDING_ID')
    }

    if (!isValidWeddingId(weddingId)) {
      return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
    }

    // ============================================
    // 3. Parse and Validate Input
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

    const validation = validateUpdateInput(body)
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, 'VALIDATION_ERROR')
    }

    const { displayName, weddingDate, status, plan } = validation.data

    // ============================================
    // 4. Verify Wedding Exists
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

    // ============================================
    // 5. Build Update Expression
    // ============================================
    const updateExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, unknown> = {}

    if (displayName !== undefined) {
      updateExpressions.push('#displayName = :displayName')
      expressionAttributeNames['#displayName'] = 'displayName'
      expressionAttributeValues[':displayName'] = displayName
    }

    if (weddingDate !== undefined) {
      updateExpressions.push('#weddingDate = :weddingDate')
      expressionAttributeNames['#weddingDate'] = 'weddingDate'
      expressionAttributeValues[':weddingDate'] = weddingDate
    }

    if (status !== undefined) {
      updateExpressions.push('#status = :status')
      expressionAttributeNames['#status'] = 'status'
      expressionAttributeValues[':status'] = status
    }

    if (plan !== undefined) {
      updateExpressions.push('#plan = :plan')
      expressionAttributeNames['#plan'] = 'plan'
      expressionAttributeValues[':plan'] = plan
    }

    // Always update updatedAt and updatedBy
    const now = new Date().toISOString()
    updateExpressions.push('#updatedAt = :updatedAt')
    expressionAttributeNames['#updatedAt'] = 'updatedAt'
    expressionAttributeValues[':updatedAt'] = now

    updateExpressions.push('#updatedBy = :updatedBy')
    expressionAttributeNames['#updatedBy'] = 'updatedBy'
    expressionAttributeValues[':updatedBy'] = authResult.user.username

    // ============================================
    // 6. Update Wedding Record
    // ============================================
    const result = await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: weddingKey,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    )

    const updatedWedding = result.Attributes

    // ============================================
    // 7. Return Updated Wedding
    // ============================================
    return createSuccessResponse(
      200,
      {
        wedding: {
          weddingId: updatedWedding?.weddingId as string,
          slug: updatedWedding?.slug as string,
          displayName: updatedWedding?.displayName as string,
          status: updatedWedding?.status as string,
          weddingDate: updatedWedding?.weddingDate as string | undefined,
          plan: updatedWedding?.plan as string,
          ownerId: updatedWedding?.ownerId as string,
          createdAt: updatedWedding?.createdAt as string,
          updatedAt: updatedWedding?.updatedAt as string,
          updatedBy: updatedWedding?.updatedBy as string,
        },
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'PUT /superadmin/weddings/{weddingId}',
        operation: 'update-wedding',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
