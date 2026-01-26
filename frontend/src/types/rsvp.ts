import type { HonorificTitle } from './index'

// Attendance status - supports Yes, No, and Maybe options
export type AttendanceStatus = 'yes' | 'no' | 'maybe'

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

// Analytics types for RSVP dashboard
export interface GuestCategoryStats {
  entries: number
  guests: number
  adults: number
  children: number
}

export interface RsvpAnalytics {
  // Attendance metrics
  attendanceRate: number
  avgPartySize: number

  // Guest distribution by category
  byCategory: {
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

  // For combined weddings - breakdown by bride/groom side
  bySide?: {
    bride: GuestCategoryStats
    groom: GuestCategoryStats
    mutual: GuestCategoryStats
    unknown: GuestCategoryStats
  }

  // RSVP timeline for charts
  timeline: Array<{
    date: string
    cumulative: number
    daily: number
  }>

  // Party size distribution
  partySizeDistribution: {
    '1': number
    '2': number
    '3': number
    '4': number
    '5+': number
  }
}

// RSVP Settings - visibility is now controlled by Design Tab
export interface RsvpSettings {
  acceptingRsvps: boolean // Whether to accept new RSVPs (form is open)
  rsvpDeadline?: string // Optional ISO date string for deadline (empty = no deadline, open until event)
}

export const DEFAULT_RSVP_SETTINGS: RsvpSettings = {
  acceptingRsvps: true,
}

// Response from public get-settings endpoint
export interface RsvpSettingsResponse {
  settings: RsvpSettings
  eventDate?: string
  isAcceptingRsvps: boolean // Computed: whether RSVPs can currently be submitted
}

export interface RsvpFormData {
  title: HonorificTitle
  fullName: string
  isAttending: AttendanceStatus
  numberOfAdults: number
  numberOfChildren: number
  phoneNumber: string
  message: string
  guestType?: AnyGuestType
}

export interface RsvpSubmission extends RsvpFormData {
  id: string
  submittedAt: string
  source?: 'public' | 'admin'
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  guestType?: AnyGuestType
  // Legacy field for backward compatibility (computed as numberOfAdults + numberOfChildren)
  numberOfGuests?: number
}

// Response data from RSVP submit endpoint (unwrapped)
export interface RsvpApiResponse {
  message: string
  id: string
  submittedAt: string
}

// Response data from RSVP list endpoint (unwrapped)
export interface RsvpListResponse {
  rsvps: RsvpSubmission[]
  summary: {
    total: number
    attending: number
    maybe: number
    notAttending: number
    totalGuests: number
    totalAdults: number
    totalChildren: number
  }
  analytics?: RsvpAnalytics
  settings?: RsvpSettings
}

// Admin RSVP request (create/update)
export interface AdminRsvpRequest {
  title?: HonorificTitle | ''
  fullName: string
  isAttending: AttendanceStatus
  numberOfAdults: number
  numberOfChildren: number
  phoneNumber?: string
  message?: string
  guestType?: AnyGuestType | null // null means explicitly remove
}

// Response from admin create RSVP
export interface CreateRsvpResponse {
  id: string
  submittedAt: string
}

// Response from admin update RSVP
export interface UpdateRsvpResponse {
  id: string
  updatedAt: string
}

// Response from admin delete RSVP
export interface DeleteRsvpResponse {
  message: string
}
