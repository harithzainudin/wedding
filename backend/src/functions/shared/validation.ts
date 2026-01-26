import { type AnyGuestType, isValidGuestType } from './rsvp-validation'

// Attendance status - supports Yes, No, and Maybe options
export type AttendanceStatus = 'yes' | 'no' | 'maybe'

export interface RsvpInput {
  title: string
  fullName: string
  isAttending: AttendanceStatus
  numberOfAdults: number
  numberOfChildren: number
  phoneNumber: string
  message?: string
  guestType?: AnyGuestType
}

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

export type HonorificTitle = (typeof VALID_TITLES)[number]

export function validateRsvpInput(input: unknown):
  | {
      valid: true
      data: RsvpInput
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate fullName
  if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
    return {
      valid: false,
      error: 'Full name is required and must be at least 2 characters',
    }
  }

  // Validate phoneNumber
  if (typeof body.phoneNumber !== 'string' || !body.phoneNumber.trim()) {
    return { valid: false, error: 'Phone number is required' }
  }

  // Validate phone number format (international)
  // Remove common formatting characters: spaces, dashes, parentheses, dots
  const cleanPhone = body.phoneNumber.replace(/[-\s().]/g, '')
  // Accept international formats: +{country code}{number} or local formats starting with 0
  // Minimum 7 digits (local), maximum 15 digits (E.164 standard)
  const phoneRegex = /^(\+?[1-9]\d{6,14}|0[1-9]\d{6,12})$/
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  // Validate title
  if (typeof body.title !== 'string' || !VALID_TITLES.includes(body.title as HonorificTitle)) {
    return { valid: false, error: 'Invalid title selected' }
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
  // Guest counts help the couple plan for food and seating
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

  // Validate message length (optional)
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

  // For 'no' responses, set guest counts to 0
  const shouldHaveGuestCounts = body.isAttending === 'yes' || body.isAttending === 'maybe'

  return {
    valid: true,
    data: {
      title: body.title as string,
      fullName: body.fullName.trim(),
      isAttending: body.isAttending as AttendanceStatus,
      numberOfAdults: shouldHaveGuestCounts ? (body.numberOfAdults as number) : 0,
      numberOfChildren: shouldHaveGuestCounts
        ? ((body.numberOfChildren as number | undefined) ?? 0)
        : 0,
      phoneNumber: cleanPhone,
      message: typeof body.message === 'string' ? body.message.trim() : undefined,
      guestType: validatedGuestType,
    },
  }
}

// ============================================
// MULTI-TENANT VALIDATION FUNCTIONS
// ============================================

/**
 * Validate wedding slug format
 * Rules:
 * - 4-50 characters
 * - Lowercase alphanumeric and hyphens only
 * - Must start and end with alphanumeric
 * - No consecutive hyphens
 */
export function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false
  if (slug.length < 4 || slug.length > 50) return false

  // Must be lowercase, alphanumeric, and hyphens only
  // Must start and end with alphanumeric
  // No consecutive hyphens
  const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
  if (!slugRegex.test(slug)) return false

  // No consecutive hyphens
  if (slug.includes('--')) return false

  return true
}

/**
 * Validate wedding ID format (UUID v4)
 */
export function isValidWeddingId(id: string): boolean {
  if (typeof id !== 'string') return false
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidV4Regex.test(id)
}

/**
 * Validate username format
 * Rules:
 * - 3-30 characters
 * - Alphanumeric and underscores only
 * - Must start with a letter
 */
export function isValidUsername(username: string): boolean {
  if (typeof username !== 'string') return false
  if (username.length < 3 || username.length > 30) return false

  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/
  return usernameRegex.test(username)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function isValidPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Role labels for client users
 */
export const CLIENT_ROLE_LABELS = ['Bride', 'Groom', 'Parent', 'Other'] as const
export type ClientRoleLabel = (typeof CLIENT_ROLE_LABELS)[number]

/**
 * Wedding creation input validation
 * Supports two modes:
 * 1. Assign Staff: assignStaffUsername is provided
 * 2. Create Client: ownerUsername (and optionally ownerEmail, roleLabel) is provided
 */
export interface CreateWeddingInput {
  slug: string
  displayName: string
  weddingDate: string
  plan?: 'free' | 'basic' | 'premium'
  // Mode 1: Assign existing staff member
  assignStaffUsername?: string
  // Mode 2: Create new client user
  ownerUsername?: string
  ownerEmail?: string
  roleLabel?: string // 'Bride', 'Groom', 'Parent', or custom text
}

export function validateCreateWeddingInput(
  input: unknown
): { valid: true; data: CreateWeddingInput } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate slug
  if (typeof body.slug !== 'string' || !isValidSlug(body.slug)) {
    return {
      valid: false,
      error: 'Invalid slug. Must be 4-50 lowercase characters, alphanumeric and hyphens only',
    }
  }

  // Validate displayName
  if (
    typeof body.displayName !== 'string' ||
    body.displayName.trim().length < 3 ||
    body.displayName.trim().length > 100
  ) {
    return {
      valid: false,
      error: 'Display name must be 3-100 characters',
    }
  }

  // Validate weddingDate (ISO date format)
  if (typeof body.weddingDate !== 'string') {
    return { valid: false, error: 'Wedding date is required' }
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(body.weddingDate)) {
    return { valid: false, error: 'Wedding date must be in YYYY-MM-DD format' }
  }
  const parsedDate = new Date(body.weddingDate)
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Invalid wedding date' }
  }

  // Validate plan (optional)
  const validPlans = ['free', 'basic', 'premium'] as const
  let plan: 'free' | 'basic' | 'premium' = 'free'
  if (body.plan !== undefined) {
    if (!validPlans.includes(body.plan as (typeof validPlans)[number])) {
      return { valid: false, error: 'Invalid plan. Must be free, basic, or premium' }
    }
    plan = body.plan as 'free' | 'basic' | 'premium'
  }

  // Determine owner mode: assign staff OR create client OR no owner (super admin manages)
  const hasAssignStaff = body.assignStaffUsername !== undefined && body.assignStaffUsername !== ''
  const hasCreateClient = body.ownerUsername !== undefined && body.ownerUsername !== ''

  // Mode 0: No owner assignment - super admin will manage directly
  if (!hasAssignStaff && !hasCreateClient) {
    return {
      valid: true,
      data: {
        slug: body.slug.toLowerCase(),
        displayName: body.displayName.trim(),
        weddingDate: body.weddingDate,
        plan,
        // No owner fields - super admin manages
      },
    }
  }

  if (hasAssignStaff && hasCreateClient) {
    return {
      valid: false,
      error: 'Cannot provide both assignStaffUsername and ownerUsername',
    }
  }

  // Mode 1: Assign existing staff member
  if (hasAssignStaff) {
    if (
      typeof body.assignStaffUsername !== 'string' ||
      !isValidUsername(body.assignStaffUsername)
    ) {
      return {
        valid: false,
        error: 'Invalid staff username format',
      }
    }

    return {
      valid: true,
      data: {
        slug: body.slug.toLowerCase(),
        displayName: body.displayName.trim(),
        weddingDate: body.weddingDate,
        plan,
        assignStaffUsername: body.assignStaffUsername.toLowerCase(),
      },
    }
  }

  // Mode 2: Create new client user
  if (typeof body.ownerUsername !== 'string' || !isValidUsername(body.ownerUsername)) {
    return {
      valid: false,
      error:
        'Invalid username. Must be 3-30 characters, start with a letter, alphanumeric and underscores only',
    }
  }

  // Validate ownerEmail (optional - only validate if provided and non-empty)
  if (body.ownerEmail && body.ownerEmail !== '' && !isValidEmail(body.ownerEmail as string)) {
    return { valid: false, error: 'Invalid email address' }
  }

  // Validate roleLabel (optional - any string up to 50 chars)
  if (body.roleLabel !== undefined && body.roleLabel !== '') {
    if (typeof body.roleLabel !== 'string' || body.roleLabel.trim().length > 50) {
      return { valid: false, error: 'Role label must be a string up to 50 characters' }
    }
  }

  return {
    valid: true,
    data: {
      slug: body.slug.toLowerCase(),
      displayName: body.displayName.trim(),
      weddingDate: body.weddingDate,
      plan,
      ownerUsername: body.ownerUsername.toLowerCase(),
      ...(body.ownerEmail && body.ownerEmail !== ''
        ? { ownerEmail: (body.ownerEmail as string).toLowerCase() }
        : {}),
      ...(body.roleLabel && body.roleLabel !== ''
        ? { roleLabel: (body.roleLabel as string).trim() }
        : {}),
    },
  }
}
