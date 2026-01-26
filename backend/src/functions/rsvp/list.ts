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

interface RsvpRecord {
  pk: string
  sk: string
  id: string
  weddingId: string
  title: string
  fullName: string
  isAttending: boolean
  numberOfGuests: number
  phoneNumber: string
  message: string
  submittedAt: string
  guestType?: AnyGuestType
}

interface RsvpAnalytics {
  attendanceRate: number
  avgPartySize: number
  byCategory: GuestCategoryMap
  bySide: {
    bride: { entries: number; guests: number }
    groom: { entries: number; guests: number }
    mutual: { entries: number; guests: number }
    unknown: { entries: number; guests: number }
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

function computeAnalytics(rsvps: RsvpRecord[]): RsvpAnalytics {
  const attending = rsvps.filter((r) => r.isAttending)
  const totalGuests = attending.reduce((sum, r) => sum + r.numberOfGuests, 0)

  // Attendance rate
  const attendanceRate = rsvps.length > 0 ? (attending.length / rsvps.length) * 100 : 0

  // Average party size (only for attending RSVPs)
  const avgPartySize = attending.length > 0 ? totalGuests / attending.length : 0

  // Initialize byCategory
  const byCategory: GuestCategoryMap = {
    father_guest: { entries: 0, guests: 0 },
    mother_guest: { entries: 0, guests: 0 },
    both_parents_guest: { entries: 0, guests: 0 },
    father_relative: { entries: 0, guests: 0 },
    mother_relative: { entries: 0, guests: 0 },
    couple_friend: { entries: 0, guests: 0 },
    couple_colleague: { entries: 0, guests: 0 },
    spouse_family: { entries: 0, guests: 0 },
    mutual_friend: { entries: 0, guests: 0 },
    other: { entries: 0, guests: 0 },
    unknown: { entries: 0, guests: 0 },
  }

  // Initialize bySide
  const bySide = {
    bride: { entries: 0, guests: 0 },
    groom: { entries: 0, guests: 0 },
    mutual: { entries: 0, guests: 0 },
    unknown: { entries: 0, guests: 0 },
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
    // Only count attending RSVPs for guest statistics
    if (rsvp.isAttending) {
      // By category
      const category = getGuestCategory(rsvp.guestType)
      byCategory[category].entries++
      byCategory[category].guests += rsvp.numberOfGuests

      // By side
      const side = getGuestSide(rsvp.guestType)
      bySide[side].entries++
      bySide[side].guests += rsvp.numberOfGuests

      // Party size distribution
      const size = rsvp.numberOfGuests
      if (size === 1) partySizeDistribution['1']++
      else if (size === 2) partySizeDistribution['2']++
      else if (size === 3) partySizeDistribution['3']++
      else if (size === 4) partySizeDistribution['4']++
      else partySizeDistribution['5+']++
    }

    // Timeline - count all RSVPs (attending or not)
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
    // Query RSVPs for this wedding
    // ============================================
    let items: RsvpRecord[] = []

    if (status && ['attending', 'not_attending'].includes(status)) {
      // Query by status using GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: 'byStatus',
          KeyConditionExpression: 'gsi1pk = :pk',
          ExpressionAttributeValues: {
            ':pk': `WEDDING#${weddingId}#RSVP_STATUS#${status}`,
          },
          ScanIndexForward: false,
        })
      )
      items = (result.Items ?? []) as RsvpRecord[]
    } else {
      // Query all RSVPs for this wedding by querying both status partitions
      // RSVPs are stored with gsi1pk: WEDDING#${weddingId}#RSVP_STATUS#attending or #not_attending
      const [attendingResult, notAttendingResult] = await Promise.all([
        docClient.send(
          new QueryCommand({
            TableName: Resource.AppDataTable.name,
            IndexName: 'byStatus',
            KeyConditionExpression: 'gsi1pk = :pk',
            ExpressionAttributeValues: {
              ':pk': `WEDDING#${weddingId}#RSVP_STATUS#attending`,
            },
            ScanIndexForward: false,
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
          })
        ),
      ])

      // Combine and sort by submittedAt descending
      const allItems = [
        ...((attendingResult.Items ?? []) as RsvpRecord[]),
        ...((notAttendingResult.Items ?? []) as RsvpRecord[]),
      ]
      items = allItems.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    }

    // Transform items for response
    const rsvps = items.map((item) => ({
      id: item.id,
      title: item.title,
      fullName: item.fullName,
      isAttending: item.isAttending,
      numberOfGuests: item.numberOfGuests,
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
    const attending = rsvps.filter((r) => r.isAttending)
    const totalGuests = attending.reduce((sum, r) => sum + r.numberOfGuests, 0)

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
          notAttending: rsvps.length - attending.length,
          totalGuests,
        },
        settings,
        analytics,
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
