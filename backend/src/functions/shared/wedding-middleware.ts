/**
 * Wedding Middleware for Multi-Tenant Platform
 *
 * Provides functions to resolve wedding slugs to wedding IDs
 * and validate wedding access.
 */

import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { Keys } from './keys'

/**
 * Wedding status types
 * - active: Wedding is live and visible to public
 * - draft: Wedding is being prepared, not visible to public
 * - archived: Wedding has been archived, not visible to public or admins
 * - inactive: Wedding is temporarily disabled
 */
export type WeddingStatus = 'active' | 'draft' | 'inactive' | 'archived'

/**
 * Wedding context returned after resolving a slug
 */
export interface WeddingContext {
  weddingId: string
  slug: string
  displayName: string
  status: WeddingStatus
  ownerId: string
  coOwnerIds: string[]
  weddingDate: string
  plan: 'free' | 'basic' | 'premium'
  createdAt: string
  createdBy: string
}

/**
 * Wedding data stored in DynamoDB
 */
export interface WeddingRecord {
  pk: string
  sk: string
  weddingId: string
  slug: string
  displayName: string
  status: WeddingStatus
  ownerId: string
  coOwnerIds?: string[]
  weddingDate: string
  plan: 'free' | 'basic' | 'premium'
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
  gsi1pk: string
  gsi1sk: string
  gsi2pk: string
  gsi2sk: string
}

/**
 * Slug lookup record stored in DynamoDB
 */
export interface SlugLookupRecord {
  pk: string
  sk: string
  weddingId: string
  slug: string
}

/**
 * Result of wedding resolution
 */
export type WeddingResolutionResult =
  | { success: true; wedding: WeddingContext }
  | { success: false; error: string; statusCode: number }

/**
 * Resolve a wedding slug to its full wedding context
 *
 * @param docClient - DynamoDB Document Client
 * @param slug - The wedding slug (e.g., "ahmad-sarah")
 * @returns WeddingContext if found, null if not found
 */
export async function resolveWeddingSlug(
  docClient: DynamoDBDocumentClient,
  slug: string
): Promise<WeddingContext | null> {
  // First, look up the slug to get the weddingId
  const slugKey = Keys.weddingSlug(slug)
  const slugResult = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: slugKey,
    })
  )

  if (!slugResult.Item) {
    return null
  }

  const slugRecord = slugResult.Item as SlugLookupRecord
  const weddingId = slugRecord.weddingId

  // Now fetch the full wedding record with STRONGLY CONSISTENT read
  // to ensure we get the latest status after updates
  const weddingKey = Keys.wedding(weddingId)
  const weddingResult = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: weddingKey,
      ConsistentRead: true, // Use strongly consistent read
    })
  )

  if (!weddingResult.Item) {
    return null
  }

  const wedding = weddingResult.Item as WeddingRecord

  return {
    weddingId: wedding.weddingId,
    slug: wedding.slug,
    displayName: wedding.displayName,
    status: wedding.status,
    ownerId: wedding.ownerId,
    coOwnerIds: wedding.coOwnerIds ?? [],
    weddingDate: wedding.weddingDate,
    plan: wedding.plan,
    createdAt: wedding.createdAt,
    createdBy: wedding.createdBy,
  }
}

/**
 * Get wedding by ID directly
 *
 * @param docClient - DynamoDB Document Client
 * @param weddingId - The wedding UUID
 * @returns WeddingContext if found, null if not found
 */
export async function getWeddingById(
  docClient: DynamoDBDocumentClient,
  weddingId: string
): Promise<WeddingContext | null> {
  const weddingKey = Keys.wedding(weddingId)
  // Use strongly consistent read to ensure we get newly created weddings
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: weddingKey,
      ConsistentRead: true,
    })
  )

  if (!result.Item) {
    return null
  }

  const wedding = result.Item as WeddingRecord

  return {
    weddingId: wedding.weddingId,
    slug: wedding.slug,
    displayName: wedding.displayName,
    status: wedding.status,
    ownerId: wedding.ownerId,
    coOwnerIds: wedding.coOwnerIds ?? [],
    weddingDate: wedding.weddingDate,
    plan: wedding.plan,
    createdAt: wedding.createdAt,
    createdBy: wedding.createdBy,
  }
}

/**
 * Validate that a wedding exists and is active (for PUBLIC endpoints)
 * Returns error response data if validation fails
 *
 * Only 'active' status weddings are accessible to the public.
 * Draft, archived, and inactive weddings return appropriate errors.
 */
export function requireActiveWedding(wedding: WeddingContext | null): WeddingResolutionResult {
  if (!wedding) {
    return {
      success: false,
      error: 'Wedding not found',
      statusCode: 404,
    }
  }

  if (wedding.status === 'archived') {
    return {
      success: false,
      error: 'This wedding has been archived and is no longer available.',
      statusCode: 410, // Gone
    }
  }

  if (wedding.status === 'draft') {
    return {
      success: false,
      error: 'This wedding is not yet published.',
      statusCode: 403,
    }
  }

  if (wedding.status === 'inactive') {
    return {
      success: false,
      error: 'This wedding is currently unavailable.',
      statusCode: 403,
    }
  }

  return {
    success: true,
    wedding,
  }
}

/**
 * Validate that a wedding is accessible for admin operations
 * Super admins can access any wedding regardless of status.
 * Wedding owners cannot access archived weddings.
 *
 * @param wedding - The wedding context
 * @param isSuperAdmin - Whether the user is a super admin
 */
export function requireAdminAccessibleWedding(
  wedding: WeddingContext | null,
  isSuperAdmin: boolean
): WeddingResolutionResult {
  if (!wedding) {
    return {
      success: false,
      error: 'Wedding not found',
      statusCode: 404,
    }
  }

  // Super admins can access any wedding regardless of status
  if (isSuperAdmin) {
    return {
      success: true,
      wedding,
    }
  }

  // Wedding admins cannot access archived weddings
  if (wedding.status === 'archived') {
    return {
      success: false,
      error: 'This wedding has been archived. Please contact support if you need access.',
      statusCode: 403,
    }
  }

  return {
    success: true,
    wedding,
  }
}

/**
 * Check if a user has access to a wedding
 * Used for authorization checks
 */
export function userHasWeddingAccess(wedding: WeddingContext, username: string): boolean {
  const normalizedUsername = username.toLowerCase()
  return (
    wedding.ownerId.toLowerCase() === normalizedUsername ||
    wedding.coOwnerIds.some((id) => id.toLowerCase() === normalizedUsername)
  )
}
