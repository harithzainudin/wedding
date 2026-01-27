/**
 * Shared Pagination Utilities
 *
 * Provides consistent pagination patterns for list endpoints.
 * Uses DynamoDB cursor-based pagination with base64-encoded keys.
 */

/**
 * Parsed pagination parameters from query string
 */
export interface ParsedPaginationParams {
  limit: number
  lastKey?: Record<string, unknown>
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  hasMore: boolean
  nextKey: string | null
}

/**
 * Parse pagination parameters from API Gateway query string.
 *
 * @param queryParams - Query parameters from event.queryStringParameters
 * @param defaultLimit - Default page size (default: 50)
 * @param maxLimit - Maximum allowed page size (default: 100)
 * @returns Parsed pagination params with limit and optional lastKey
 *
 * @example
 * const { limit, lastKey } = parsePaginationParams(event.queryStringParameters)
 */
export function parsePaginationParams(
  queryParams: Record<string, string | undefined> | undefined,
  defaultLimit = 50,
  maxLimit = 100
): ParsedPaginationParams {
  // Parse and clamp limit
  const requestedLimit = parseInt(queryParams?.limit ?? String(defaultLimit), 10)
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit)

  // Decode lastKey if provided
  const lastKeyParam = queryParams?.lastKey
  const lastKey = lastKeyParam
    ? (JSON.parse(Buffer.from(lastKeyParam, 'base64').toString()) as Record<string, unknown>)
    : undefined

  return { limit, lastKey }
}

/**
 * Encode DynamoDB LastEvaluatedKey to a URL-safe base64 string.
 *
 * @param lastEvaluatedKey - DynamoDB LastEvaluatedKey from query result
 * @returns Base64-encoded string or null if no more pages
 *
 * @example
 * const nextKey = encodeNextKey(result.LastEvaluatedKey)
 */
export function encodeNextKey(
  lastEvaluatedKey: Record<string, unknown> | undefined
): string | null {
  if (!lastEvaluatedKey) {
    return null
  }
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64')
}

/**
 * Build a standard paginated response object.
 *
 * @param items - Array of items for current page
 * @param lastEvaluatedKey - DynamoDB LastEvaluatedKey from query result
 * @returns Paginated response with items, total, hasMore, and nextKey
 *
 * @example
 * const response = buildPaginatedResponse(items, result.LastEvaluatedKey)
 * return createSuccessResponse(200, { ...response }, context)
 */
export function buildPaginatedResponse<T>(
  items: T[],
  lastEvaluatedKey: Record<string, unknown> | undefined
): PaginatedResponse<T> {
  return {
    items,
    total: items.length,
    hasMore: !!lastEvaluatedKey,
    nextKey: encodeNextKey(lastEvaluatedKey),
  }
}

/**
 * Build QueryCommand options for pagination.
 *
 * @param params - Parsed pagination parameters
 * @returns Object to spread into QueryCommand options
 *
 * @example
 * const result = await docClient.send(new QueryCommand({
 *   TableName: Resource.AppDataTable.name,
 *   IndexName: 'byStatus',
 *   KeyConditionExpression: 'gsi1pk = :pk',
 *   ExpressionAttributeValues: { ':pk': 'SOME_KEY' },
 *   ...buildQueryPaginationOptions(paginationParams),
 * }))
 */
export function buildQueryPaginationOptions(params: ParsedPaginationParams): {
  Limit: number
  ExclusiveStartKey?: Record<string, unknown>
} {
  return {
    Limit: params.limit,
    ...(params.lastKey && { ExclusiveStartKey: params.lastKey }),
  }
}
