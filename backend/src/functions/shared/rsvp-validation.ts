// Types and validation for RSVP settings
// Visibility is now controlled by Design Tab

// Guest Type - for single-side weddings (simpler options)
export type GuestType =
  | 'father_guest' // Dad's guest
  | 'mother_guest' // Mom's guest
  | 'both_parents_guest' // Both parents' guest
  | 'father_relative'
  | 'mother_relative'
  | 'couple_friend'
  | 'couple_colleague'
  | 'spouse_family'
  | 'other'

// Guest Type - for combined weddings (includes bride/groom prefix)
export type CombinedGuestType =
  | 'bride_father_guest'
  | 'bride_mother_guest'
  | 'bride_both_parents_guest'
  | 'bride_father_relative'
  | 'bride_mother_relative'
  | 'bride_friend'
  | 'bride_colleague'
  | 'groom_father_guest'
  | 'groom_mother_guest'
  | 'groom_both_parents_guest'
  | 'groom_father_relative'
  | 'groom_mother_relative'
  | 'groom_friend'
  | 'groom_colleague'
  | 'mutual_friend'
  | 'other'

// All possible guest types (for storage)
export type AnyGuestType = GuestType | CombinedGuestType

export const GUEST_TYPES: GuestType[] = [
  'father_guest',
  'mother_guest',
  'both_parents_guest',
  'father_relative',
  'mother_relative',
  'couple_friend',
  'couple_colleague',
  'spouse_family',
  'other',
]

export const COMBINED_GUEST_TYPES: CombinedGuestType[] = [
  'bride_father_guest',
  'bride_mother_guest',
  'bride_both_parents_guest',
  'bride_father_relative',
  'bride_mother_relative',
  'bride_friend',
  'bride_colleague',
  'groom_father_guest',
  'groom_mother_guest',
  'groom_both_parents_guest',
  'groom_father_relative',
  'groom_mother_relative',
  'groom_friend',
  'groom_colleague',
  'mutual_friend',
  'other',
]

// All valid guest types for validation
export const ALL_GUEST_TYPES: string[] = [...GUEST_TYPES, ...COMBINED_GUEST_TYPES]

// Helper to validate guestType
export function isValidGuestType(value: unknown): value is AnyGuestType {
  return typeof value === 'string' && ALL_GUEST_TYPES.includes(value)
}

// Helper to map combined guest type to category (for statistics)
export function getGuestCategory(
  guestType: AnyGuestType | undefined
): keyof GuestCategoryMap | 'unknown' {
  if (!guestType) return 'unknown'

  // For combined types, strip the bride_/groom_ prefix
  if (guestType.startsWith('bride_') || guestType.startsWith('groom_')) {
    const withoutPrefix = guestType.replace(/^(bride_|groom_)/, '')
    // Map to base categories
    if (withoutPrefix === 'father_guest') return 'father_guest'
    if (withoutPrefix === 'mother_guest') return 'mother_guest'
    if (withoutPrefix === 'both_parents_guest') return 'both_parents_guest'
    if (withoutPrefix === 'father_relative') return 'father_relative'
    if (withoutPrefix === 'mother_relative') return 'mother_relative'
    if (withoutPrefix === 'friend') return 'couple_friend'
    if (withoutPrefix === 'colleague') return 'couple_colleague'
  }

  // For mutual_friend
  if (guestType === 'mutual_friend') return 'mutual_friend'

  // Return as-is for simple types
  if (GUEST_TYPES.includes(guestType as GuestType)) return guestType as keyof GuestCategoryMap

  return 'other'
}

// Helper to get guest side (for bySide statistics)
export function getGuestSide(
  guestType: AnyGuestType | undefined
): 'bride' | 'groom' | 'mutual' | 'unknown' {
  if (!guestType) return 'unknown'

  if (guestType.startsWith('bride_')) return 'bride'
  if (guestType.startsWith('groom_')) return 'groom'
  if (guestType === 'mutual_friend') return 'mutual'

  // Simple guest types are considered "host side" in single-side weddings
  // We don't know the side, so return 'unknown' for stats
  return 'unknown'
}

// Guest stats type for analytics
export interface GuestCategoryStats {
  entries: number
  guests: number
  adults: number
  children: number
}

// Guest category map for statistics
export interface GuestCategoryMap {
  father_guest: GuestCategoryStats
  mother_guest: GuestCategoryStats
  both_parents_guest: GuestCategoryStats
  father_relative: GuestCategoryStats
  mother_relative: GuestCategoryStats
  couple_friend: GuestCategoryStats
  couple_colleague: GuestCategoryStats
  spouse_family: GuestCategoryStats
  mutual_friend: GuestCategoryStats
  other: GuestCategoryStats
  unknown: GuestCategoryStats
}

export interface RsvpSettings {
  acceptingRsvps: boolean // Whether to accept new RSVPs (form is open)
  rsvpDeadline?: string // Optional ISO date string for deadline (empty = no deadline, open until event)
}

export const DEFAULT_RSVP_SETTINGS: RsvpSettings = {
  acceptingRsvps: true,
}

export interface RsvpSettingsUpdateRequest {
  acceptingRsvps?: boolean
  rsvpDeadline?: string | null // null means remove deadline
}

export function validateRsvpSettingsUpdate(
  input: unknown
): { valid: true; data: RsvpSettingsUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // At least one setting must be provided
  if (body.acceptingRsvps === undefined && body.rsvpDeadline === undefined) {
    return {
      valid: false,
      error: 'At least one setting (acceptingRsvps or rsvpDeadline) must be provided',
    }
  }

  // Validate acceptingRsvps if provided
  if (body.acceptingRsvps !== undefined && typeof body.acceptingRsvps !== 'boolean') {
    return { valid: false, error: 'acceptingRsvps must be a boolean' }
  }

  // Validate rsvpDeadline if provided
  if (body.rsvpDeadline !== undefined && body.rsvpDeadline !== null) {
    if (typeof body.rsvpDeadline !== 'string') {
      return { valid: false, error: 'rsvpDeadline must be a string or null' }
    }

    // Validate it's a valid ISO date format
    const date = new Date(body.rsvpDeadline)
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'rsvpDeadline must be a valid ISO date string' }
    }
  }

  return {
    valid: true,
    data: {
      acceptingRsvps: body.acceptingRsvps as boolean | undefined,
      rsvpDeadline:
        body.rsvpDeadline === undefined
          ? undefined
          : body.rsvpDeadline === null
            ? null
            : (body.rsvpDeadline as string),
    },
  }
}

// Check if RSVPs can be accepted based on settings and current time
export function canAcceptRsvp(settings: RsvpSettings, eventDate?: string): boolean {
  // Must be accepting RSVPs
  if (!settings.acceptingRsvps) {
    return false
  }

  const now = new Date()

  // If there's a deadline, check it
  if (settings.rsvpDeadline) {
    const deadline = new Date(settings.rsvpDeadline)
    if (now > deadline) {
      return false
    }
  }

  // If no deadline but we have an event date, check it
  // RSVPs should close at event start time if no explicit deadline
  if (!settings.rsvpDeadline && eventDate) {
    const event = new Date(eventDate)
    if (now >= event) {
      return false
    }
  }

  return true
}
