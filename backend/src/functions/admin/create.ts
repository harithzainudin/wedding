import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import bcrypt from 'bcryptjs'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireMaster } from '../shared/auth'
import { logError } from '../shared/logger'
import { Resource } from 'sst'
import { sendWelcomeEmail } from '../../services/email'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

interface CreateAdminRequest {
  username: string
  password: string
  email?: string
  createdBy?: string
}

interface AdminUser {
  username: string
  email?: string
  createdAt: string
  createdBy: string
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let username: string | undefined
  let email: string | undefined

  try {
    // Require master admin access
    const authResult = requireMaster(event)
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
    }

    if (!event.body) {
      return createErrorResponse(400, 'Missing request body', context, 'MISSING_BODY')
    }

    let body: CreateAdminRequest
    try {
      body = JSON.parse(event.body) as CreateAdminRequest
    } catch {
      return createErrorResponse(400, 'Invalid JSON body', context, 'INVALID_JSON')
    }

    // Validate input
    if (!body.username || body.username.trim().length < 3) {
      return createErrorResponse(
        400,
        'Username must be at least 3 characters',
        context,
        'VALIDATION_ERROR'
      )
    }

    if (!body.password || body.password.length < 6) {
      return createErrorResponse(
        400,
        'Password must be at least 6 characters',
        context,
        'VALIDATION_ERROR'
      )
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return createErrorResponse(400, 'Invalid email format', context, 'VALIDATION_ERROR')
      }
    }

    username = body.username.trim().toLowerCase()
    email = body.email?.trim().toLowerCase()

    // Check if username already exists
    const existingUser = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `ADMIN#${username}`,
          sk: 'PROFILE',
        },
      })
    )

    if (existingUser.Item) {
      return createErrorResponse(409, 'Username already exists', context, 'CONFLICT')
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(body.password, salt)

    const now = new Date().toISOString()

    // Build admin item, only include email if provided (DynamoDB doesn't accept undefined)
    const adminItem: Record<string, unknown> = {
      pk: `ADMIN#${username}`,
      sk: 'PROFILE',
      username,
      passwordHash,
      createdAt: now,
      createdBy: authResult.user.username,
      gsi1pk: 'ADMIN',
      gsi1sk: now,
    }

    if (email) {
      adminItem.email = email
    }

    // Create admin user
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: adminItem,
      })
    )

    const adminUser: AdminUser = {
      username,
      email,
      createdAt: now,
      createdBy: authResult.user.username,
    }

    // Send welcome email if email is provided
    let emailSent = false
    let emailError: string | undefined

    if (email) {
      const emailResult = await sendWelcomeEmail({
        recipientEmail: email,
        username: username,
        password: body.password, // Send the plaintext password (only in email, never stored)
      })

      emailSent = emailResult.success
      if (!emailResult.success) {
        emailError = emailResult.error
        logError(
          {
            endpoint: 'POST /admin/users',
            operation: 'sendWelcomeEmail',
            requestId: context.awsRequestId,
            input: { username, email },
          },
          new Error(emailResult.error)
        )
      }
    }

    return createSuccessResponse(
      201,
      {
        admin: adminUser,
        emailSent,
        ...(emailError && { emailError }),
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'POST /admin/users',
        operation: 'createAdmin',
        requestId: context.awsRequestId,
        input: { username, email },
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'INTERNAL_ERROR')
  }
}
