// Types for contacts CMS

export interface MultilingualText {
  ms: string // Malay
  en: string // English
  zh: string // Chinese
  ta: string // Tamil
}

export interface ContactPerson {
  id: string
  name: string
  role: MultilingualText
  phoneNumber: string
  order: number
}

// Contacts settings - visibility is now controlled by Design Tab
export interface ContactsSettings {
  // Empty for now, reserved for future contacts-specific settings
}

export const DEFAULT_CONTACTS_SETTINGS: ContactsSettings = {}

export interface ContactsData {
  contacts: ContactPerson[]
  settings?: ContactsSettings
  updatedAt?: string
  updatedBy?: string
}

export interface ContactsUpdateRequest {
  contacts: ContactPerson[]
}

// Malaysian phone number validation (simplified)
const PHONE_REGEX = /^\+?6?0[0-9]{8,10}$/

function validateMultilingualText(
  text: unknown,
  label: string
): { valid: true; data: MultilingualText } | { valid: false; error: string } {
  if (typeof text !== 'object' || text === null) {
    return { valid: false, error: `${label} is required` }
  }

  const obj = text as Record<string, unknown>

  // Validate each language
  const languages = ['ms', 'en', 'zh', 'ta'] as const
  const result: Record<string, string> = {}

  for (const lang of languages) {
    if (typeof obj[lang] !== 'string') {
      return { valid: false, error: `${label} ${lang} is required` }
    }
    if (obj[lang].length > 100) {
      return {
        valid: false,
        error: `${label} ${lang} must be 100 characters or less`,
      }
    }
    result[lang] = (obj[lang] as string).trim()
  }

  return {
    valid: true,
    data: result as unknown as MultilingualText,
  }
}

function validateContactPerson(
  contact: unknown,
  index: number
): { valid: true; data: ContactPerson } | { valid: false; error: string } {
  if (typeof contact !== 'object' || contact === null) {
    return { valid: false, error: `Contact ${index + 1} is invalid` }
  }

  const obj = contact as Record<string, unknown>

  // Validate id
  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    return { valid: false, error: `Contact ${index + 1} id is required` }
  }

  // Validate name
  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    return { valid: false, error: `Contact ${index + 1} name is required` }
  }
  if (obj.name.length > 100) {
    return {
      valid: false,
      error: `Contact ${index + 1} name must be 100 characters or less`,
    }
  }

  // Validate role
  const roleResult = validateMultilingualText(obj.role, `Contact ${index + 1} role`)
  if (!roleResult.valid) return { valid: false, error: roleResult.error }

  // Validate phoneNumber
  if (typeof obj.phoneNumber !== 'string' || !obj.phoneNumber.trim()) {
    return {
      valid: false,
      error: `Contact ${index + 1} phone number is required`,
    }
  }

  // Clean phone number (remove spaces and dashes)
  const cleanPhone = obj.phoneNumber.replace(/[\s-]/g, '')
  if (!PHONE_REGEX.test(cleanPhone)) {
    return {
      valid: false,
      error: `Contact ${index + 1} has invalid Malaysian phone number format`,
    }
  }

  // Validate order
  if (typeof obj.order !== 'number' || !Number.isInteger(obj.order) || obj.order < 0) {
    return {
      valid: false,
      error: `Contact ${index + 1} order must be a non-negative integer`,
    }
  }

  return {
    valid: true,
    data: {
      id: obj.id.trim(),
      name: obj.name.trim(),
      role: roleResult.data,
      phoneNumber: obj.phoneNumber.trim(),
      order: obj.order,
    },
  }
}

export function validateContactsUpdate(
  input: unknown
): { valid: true; data: ContactsUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate contacts array
  if (!Array.isArray(body.contacts)) {
    return { valid: false, error: 'Contacts must be an array' }
  }

  if (body.contacts.length > 10) {
    return { valid: false, error: 'Maximum 10 contacts allowed' }
  }

  const validatedContacts: ContactPerson[] = []

  for (let i = 0; i < body.contacts.length; i++) {
    const contactResult = validateContactPerson(body.contacts[i], i)
    if (!contactResult.valid) return { valid: false, error: contactResult.error }
    validatedContacts.push(contactResult.data)
  }

  // Sort by order
  validatedContacts.sort((a, b) => a.order - b.order)

  return {
    valid: true,
    data: {
      contacts: validatedContacts,
    },
  }
}

// Default contacts data (fallback when no data exists in DB)
// Empty array so admins clearly see they need to add contacts
export const DEFAULT_CONTACTS: ContactsData = {
  contacts: [],
  settings: DEFAULT_CONTACTS_SETTINGS,
}
