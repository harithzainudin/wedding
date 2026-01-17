export interface RsvpInput {
  title: string
  fullName: string
  isAttending: boolean
  numberOfGuests: number
  phoneNumber: string
  message?: string
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

  // Validate phone number format (Malaysian)
  const cleanPhone = body.phoneNumber.replace(/[-\s]/g, '')
  const phoneRegex = /^(\+?60|0)[1-9]\d{7,9}$/
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  // Validate title
  if (typeof body.title !== 'string' || !VALID_TITLES.includes(body.title as HonorificTitle)) {
    return { valid: false, error: 'Invalid title selected' }
  }

  // Validate attendance
  if (typeof body.isAttending !== 'boolean') {
    return { valid: false, error: 'Attendance status is required' }
  }

  // Validate number of guests
  if (body.isAttending) {
    if (
      typeof body.numberOfGuests !== 'number' ||
      body.numberOfGuests < 1 ||
      body.numberOfGuests > 10
    ) {
      return {
        valid: false,
        error: 'Number of guests must be between 1 and 10',
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

  return {
    valid: true,
    data: {
      title: body.title as string,
      fullName: body.fullName.trim(),
      isAttending: body.isAttending,
      numberOfGuests: body.isAttending ? (body.numberOfGuests as number) : 0,
      phoneNumber: cleanPhone,
      message: typeof body.message === 'string' ? body.message.trim() : undefined,
    },
  }
}
