import type { HonorificTitle } from './index'

// RSVP Settings
export interface RsvpSettings {
  showRsvp: boolean // Show the RSVP section on the site
  acceptingRsvps: boolean // Whether to accept new RSVPs (form is open)
  rsvpDeadline?: string // Optional ISO date string for deadline (empty = no deadline, open until event)
}

export const DEFAULT_RSVP_SETTINGS: RsvpSettings = {
  showRsvp: true,
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
  isAttending: boolean
  numberOfGuests: number
  phoneNumber: string
  message: string
}

export interface RsvpSubmission extends RsvpFormData {
  id: string
  submittedAt: string
  source?: 'public' | 'admin'
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
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
    notAttending: number
    totalGuests: number
  }
  settings?: RsvpSettings
}

// Admin RSVP request (create/update)
export interface AdminRsvpRequest {
  title?: HonorificTitle | ''
  fullName: string
  isAttending: boolean
  numberOfGuests: number
  phoneNumber?: string
  message?: string
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
