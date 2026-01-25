// Types and validation for RSVP settings
// Visibility is now controlled by Design Tab

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
