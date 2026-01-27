/**
 * List RSVPs Endpoint
 *
 * Public: Returns wishes only (messages from guests)
 * Admin: Returns full RSVP data with statistics
 *
 * Public Route: GET /{weddingSlug}/rsvp
 * Admin Route: GET /admin/w/{weddingId}/rsvp
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'
import { createSuccessResponse, createErrorResponse } from '../shared/response'
import { requireWeddingAccess } from '../shared/auth'
import { logError } from '../shared/logger'
import {
  parsePaginationParams,
  encodeNextKey,
  buildQueryPaginationOptions,
} from '../shared/pagination'
import {
  resolveWeddingSlug,
  requireActiveWedding,
  getWeddingById,
  requireAdminAccessibleWedding,
} from '../shared/wedding-middleware'
import { isValidWeddingId } from '../shared/validation'
import { Keys } from '../shared/keys'
import {
  DEFAULT_RSVP_SETTINGS,
  type RsvpSettings,
  type AnyGuestType,
  type GuestCategoryMap,
  getGuestCategory,
  getGuestSide,
} from '../shared/rsvp-validation'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

// Attendance status type
type AttendanceStatus = 'yes' | 'no' | 'maybe'

interface RsvpRecord {
  pk: string
  sk: string
  id: string
  weddingId: string
  title: string
  fullName: string
  isAttending: AttendanceStatus | boolean // Support both new and legacy formats
  numberOfAdults: number
  numberOfChildren: number
  // Legacy field - some old records may have this
  numberOfGuests?: number
  phoneNumber: string
  message: string
  submittedAt: string
  guestType?: AnyGuestType
}

interface GuestStats {
  entries: number
  guests: number
  adults: number
  children: number
}

interface RsvpAnalytics {
  attendanceRate: number
  avgPartySize: number
  byCategory: GuestCategoryMap
  bySide: {
    bride: GuestStats
    groom: GuestStats
    mutual: GuestStats
    unknown: GuestStats
  }
  timeline: Array<{ date: string; cumulative: number; daily: number }>
  partySizeDistribution: {
    '1': number
    '2': number
    '3': number
    '4': number
    '5+': number
  }
}

// Helper to get total guests from a record (handles both new and legacy formats)
function getTotalGuests(rsvp: RsvpRecord): number {
  // New format: numberOfAdults + numberOfChildren
  if (rsvp.numberOfAdults !== undefined) {
    return rsvp.numberOfAdults + (rsvp.numberOfChildren ?? 0)
  }
  // Legacy format: numberOfGuests
  return rsvp.numberOfGuests ?? 0
}

// Helper to normalize attendance status (handles both boolean and string formats)
function normalizeAttendance(isAttending: AttendanceStatus | boolean): AttendanceStatus {
  if (typeof isAttending === 'boolean') {
    return isAttending ? 'yes' : 'no'
  }
  return isAttending
}

// Check if the guest is confirmed attending
function isConfirmedAttending(isAttending: AttendanceStatus | boolean): boolean {
  const status = normalizeAttendance(isAttending)
  return status === 'yes'
}

// Check if the guest is a maybe
function isMaybeAttending(isAttending: AttendanceStatus | boolean): boolean {
  const status = normalizeAttendance(isAttending)
  return status === 'maybe'
}

function computeAnalytics(rsvps: RsvpRecord[]): RsvpAnalytics {
  // Only count confirmed attending (not 'maybe') for firm planning
  const attending = rsvps.filter((r) => isConfirmedAttending(r.isAttending))
  const totalGuests = attending.reduce((sum, r) => sum + getTotalGuests(r), 0)

  // Attendance rate: percentage of confirmed attendees
  const attendanceRate = rsvps.length > 0 ? (attending.length / rsvps.length) * 100 : 0

  // Average party size (only for attending RSVPs)
  const avgPartySize = attending.length > 0 ? totalGuests / attending.length : 0

  // Initialize byCategory
  const byCategory: GuestCategoryMap = {
    father_guest: { entries: 0, guests: 0, adults: 0, children: 0 },
    mother_guest: { entries: 0, guests: 0, adults: 0, children: 0 },
    both_parents_guest: { entries: 0, guests: 0, adults: 0, children: 0 },
    father_relative: { entries: 0, guests: 0, adults: 0, children: 0 },
    mother_relative: { entries: 0, guests: 0, adults: 0, children: 0 },
    couple_friend: { entries: 0, guests: 0, adults: 0, children: 0 },
    couple_colleague: { entries: 0, guests: 0, adults: 0, children: 0 },
    spouse_family: { entries: 0, guests: 0, adults: 0, children: 0 },
    mutual_friend: { entries: 0, guests: 0, adults: 0, children: 0 },
    other: { entries: 0, guests: 0, adults: 0, children: 0 },
    unknown: { entries: 0, guests: 0, adults: 0, children: 0 },
  }

  // Initialize bySide
  const bySide: RsvpAnalytics['bySide'] = {
    bride: { entries: 0, guests: 0, adults: 0, children: 0 },
    groom: { entries: 0, guests: 0, adults: 0, children: 0 },
    mutual: { entries: 0, guests: 0, adults: 0, children: 0 },
    unknown: { entries: 0, guests: 0, adults: 0, children: 0 },
  }

  // Party size distribution (only for attending)
  const partySizeDistribution = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5+': 0,
  }

  // Timeline data - group by date
  const timelineMap = new Map<string, number>()

  for (const rsvp of rsvps) {
    // Only count confirmed attending RSVPs for guest statistics (not 'maybe')
    if (isConfirmedAttending(rsvp.isAttending)) {
      const guestCount = getTotalGuests(rsvp)
      const adults = rsvp.numberOfAdults ?? rsvp.numberOfGuests ?? 0
      const children = rsvp.numberOfChildren ?? 0

      // By category
      const category = getGuestCategory(rsvp.guestType)
      byCategory[category].entries++
      byCategory[category].guests += guestCount
      byCategory[category].adults += adults
      byCategory[category].children += children

      // By side
      const side = getGuestSide(rsvp.guestType)
      bySide[side].entries++
      bySide[side].guests += guestCount
      bySide[side].adults += adults
      bySide[side].children += children

      // Party size distribution
      if (guestCount === 1) partySizeDistribution['1']++
      else if (guestCount === 2) partySizeDistribution['2']++
      else if (guestCount === 3) partySizeDistribution['3']++
      else if (guestCount === 4) partySizeDistribution['4']++
      else partySizeDistribution['5+']++
    }

    // Timeline - count all RSVPs (attending, maybe, or not attending)
    const date = rsvp.submittedAt.split('T')[0] // Extract YYYY-MM-DD
    if (date) {
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1)
    }
  }

  // Convert timeline to sorted array with cumulative counts
  const sortedDates = Array.from(timelineMap.keys()).sort()
  let cumulative = 0
  const timeline = sortedDates.map((date) => {
    const daily = timelineMap.get(date) || 0
    cumulative += daily
    return { date, cumulative, daily }
  })

  return {
    attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
    avgPartySize: Math.round(avgPartySize * 10) / 10, // Round to 1 decimal
    byCategory,
    bySide,
    timeline,
    partySizeDistribution,
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    let weddingId: string
    let isAuthenticated = false

    // ============================================
    // Determine route type and extract wedding context
    // ============================================

    // Check if this is an admin route (has weddingId)
    if (event.pathParameters?.weddingId) {
      // Admin route: /admin/w/{weddingId}/rsvp
      weddingId = event.pathParameters.weddingId

      if (!isValidWeddingId(weddingId)) {
        return createErrorResponse(400, 'Invalid wedding ID format', context, 'INVALID_WEDDING_ID')
      }

      const authResult = requireWeddingAccess(event, weddingId)
      if (!authResult.authenticated) {
        return createErrorResponse(authResult.statusCode, authResult.error, context, 'AUTH_ERROR')
      }

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

      isAuthenticated = true
    } else if (event.pathParameters?.weddingSlug) {
      // Public route: /{weddingSlug}/rsvp
      const weddingSlug = event.pathParameters.weddingSlug
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
      weddingId = weddingCheck.wedding.weddingId
    } else {
      return createErrorResponse(400, 'Wedding identifier is required', context, 'MISSING_WEDDING')
    }

    const status = event.queryStringParameters?.status

    // ============================================
    // Parse pagination parameters
    // ============================================
    // For status-filtered queries: default 50, max 100
    // For "all" view: limit each partition to 100 (300 total max)
    const pagination = parsePaginationParams(event.queryStringParameters, 50, 100)

    // ============================================
    // Query RSVPs for this wedding
    // ============================================
    let items: RsvpRecord[] = []
    let hasMore = false
    let nextKey: string | null = null

    // Valid status filters: attending, maybe, not_attending
    if (status && ['attending', 'maybe', 'not_attending'].includes(status)) {
      // Query by status using GSI with pagination
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `WEDDING#${weddingId}#RSVP_STATUS#${status}`,
          },
          ScanIndexForward: false,
          ...buildQueryPaginationOptions(pagination),
        })
      )
      items = (result.Items ?? []) as RsvpRecord[]
      hasMore = !!result.LastEvaluatedKey
      nextKey = encodeNextKey(result.LastEvaluatedKey)
    } else {
      // Query all RSVPs for this wedding by querying all three status partitions
      // RSVPs are stored with gsi1pk: WEDDING#${weddingId}#RSVP_STATUS#{attending|maybe|not_attending}
      // Limit each partition to 100 to prevent excessive data transfer (300 total max)
      const PARTITION_LIMIT = 100
      const [attendingResult, maybeResult, notAttendingResult] = await Promise.all([
        docClient.send(
          new QueryCommand({
            TableName: Resource.AppDataTable.name,
            IndexName: 'byStatus',
            KeyConditionExpression: 'gsi1pk = :pk',
            ExpressionAttributeValues: {
              ':pk': `WEDDING#${weddingId}#RSVP_STATUS#attending`,
            },
            ScanIndexForward: false,
            Limit: PARTITION_LIMIT,
          })
        ),
        docClient.send(
          new QueryCommand({
            TableName: Resource.AppDataTable.name,
            IndexName: 'byStatus',
            KeyConditionExpression: 'gsi1pk = :pk',
            ExpressionAttributeValues: {
              ':pk': `WEDDING#${weddingId}#RSVP_STATUS#maybe`,
            },
            ScanIndexForward: false,
            Limit: PARTITION_LIMIT,
          })
        ),
        docClient.send(
          new QueryCommand({
            TableName: Resource.AppDataTable.name,
            IndexName: 'byStatus',
            KeyConditionExpression: 'gsi1pk = :pk',
            ExpressionAttributeValues: {
              ':pk': `WEDDING#${weddingId}#RSVP_STATUS#not_attending`,
            },
            ScanIndexForward: false,
            Limit: PARTITION_LIMIT,
          })
        ),
      ])

      // Combine and sort by submittedAt descending
      const allItems = [
        ...((attendingResult.Items ?? []) as RsvpRecord[]),
        ...((maybeResult.Items ?? []) as RsvpRecord[]),
        ...((notAttendingResult.Items ?? []) as RsvpRecord[]),
      ]
      items = allItems.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

      // If any partition has more data, indicate hasMore
      // User should filter by status tab to paginate through specific partitions
      hasMore =
        !!attendingResult.LastEvaluatedKey ||
        !!maybeResult.LastEvaluatedKey ||
        !!notAttendingResult.LastEvaluatedKey
      // nextKey is null for "all" view - user must filter by status to paginate
    }

    // Transform items for response (normalize isAttending to string format)
    const rsvps = items.map((item) => ({
      id: item.id,
      title: item.title,
      fullName: item.fullName,
      isAttending: normalizeAttendance(item.isAttending),
      // New format
      numberOfAdults: item.numberOfAdults ?? item.numberOfGuests ?? 0,
      numberOfChildren: item.numberOfChildren ?? 0,
      phoneNumber: item.phoneNumber,
      message: item.message,
      submittedAt: item.submittedAt,
      guestType: item.guestType,
    }))

    // Public response - only wishes for guestbook (no sensitive data)
    if (!isAuthenticated) {
      const wishes = rsvps
        .filter((r) => r.message && r.message.trim() !== '')
        .map((r) => ({
          title: r.title,
          fullName: r.fullName,
          message: r.message,
          submittedAt: r.submittedAt,
        }))

      return createSuccessResponse(200, { rsvps: wishes }, context)
    }

    // Authenticated response - full data with summary statistics, settings, and analytics
    // Count each category separately
    const attending = rsvps.filter((r) => isConfirmedAttending(r.isAttending))
    const maybe = rsvps.filter((r) => isMaybeAttending(r.isAttending))
    const notAttending = rsvps.length - attending.length - maybe.length

    // Guest counts are based on confirmed attending only
    const totalAdults = attending.reduce((sum, r) => sum + r.numberOfAdults, 0)
    const totalChildren = attending.reduce((sum, r) => sum + r.numberOfChildren, 0)
    const totalGuests = totalAdults + totalChildren

    // Fetch RSVP settings
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: Keys.settings(weddingId, 'RSVP'),
      })
    )

    const settings: RsvpSettings = settingsResult.Item?.settings || DEFAULT_RSVP_SETTINGS

    // Compute analytics for admin dashboard
    const analytics = computeAnalytics(items)

    return createSuccessResponse(
      200,
      {
        rsvps,
        summary: {
          total: rsvps.length,
          attending: attending.length,
          maybe: maybe.length,
          notAttending,
          totalGuests,
          totalAdults,
          totalChildren,
        },
        settings,
        analytics,
        // Pagination fields
        hasMore,
        nextKey,
      },
      context
    )
  } catch (error) {
    logError(
      {
        endpoint: 'GET /rsvp',
        operation: 'listRsvps',
        requestId: context.awsRequestId,
      },
      error
    )
    return createErrorResponse(500, 'Internal server error', context, 'DB_ERROR')
  }
}
