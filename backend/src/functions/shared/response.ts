import type { APIGatewayProxyResultV2, Context } from 'aws-lambda'

export interface ResponseMetadata {
  requestId: string
  timestamp: string
}

export interface SuccessResponse<T> {
  success: true
  data: T
  metadata: ResponseMetadata
}

export interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
  }
  metadata: ResponseMetadata
}

function createMetadata(requestId: string): ResponseMetadata {
  return {
    requestId,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Creates a successful API response with proper metadata
 */
export function createSuccessResponse<T>(
  statusCode: number,
  data: T,
  context: Context
): APIGatewayProxyResultV2 {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    metadata: createMetadata(context.awsRequestId),
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  }
}

/**
 * Creates an error API response
 * Supports both legacy (2 args) and new (3-4 args with context) signatures
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  contextOrCode?: Context | string,
  errorCode?: string
): APIGatewayProxyResultV2 {
  // Check if third argument is a Context object (has awsRequestId property)
  const isContext =
    contextOrCode !== undefined &&
    typeof contextOrCode === 'object' &&
    contextOrCode !== null &&
    'awsRequestId' in contextOrCode

  if (isContext) {
    // New signature: (statusCode, message, context, errorCode?)
    const context = contextOrCode as Context
    const response: ErrorResponse = {
      success: false,
      error: {
        message,
        ...(errorCode && { code: errorCode }),
      },
      metadata: createMetadata(context.awsRequestId),
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    }
  } else {
    // Legacy signature: (statusCode, message) - no context, simple error format
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: message,
      }),
    }
  }
}

/**
 * @deprecated Use createSuccessResponse instead
 * Legacy function for backwards compatibility during migration
 */
export function createResponse<T>(statusCode: number, body: T): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}
