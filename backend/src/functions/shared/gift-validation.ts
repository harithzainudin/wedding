/**
 * Gift validation utilities for the gift registry feature
 */

export type Language = 'ms' | 'en' | 'zh' | 'ta'
export type MultilingualText = Record<Language, string>
export type GiftPriority = 'high' | 'medium' | 'low' | 'none'
export type GiftCategory = 'home' | 'kitchen' | 'electronics' | 'experiences' | 'other'

export const VALID_PRIORITIES: GiftPriority[] = ['none', 'high', 'medium', 'low']
export const VALID_CATEGORIES: GiftCategory[] = [
  'home',
  'kitchen',
  'electronics',
  'experiences',
  'other',
]

export const GIFT_LIMITS = {
  maxItems: 50,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxQuantityPerItem: 10,
  maxNameLength: 100,
  maxDescriptionLength: 500,
  maxNotesLength: 300,
  maxPriceRangeLength: 50,
  maxExternalLinkLength: 500,
  maxReservationMessageLength: 300,
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
}

export interface CreateGiftInput {
  name: MultilingualText
  description: MultilingualText
  externalLink: string
  priceRange?: string
  category: GiftCategory
  priority: GiftPriority
  notes?: string
  quantityTotal: number
}

export interface UpdateGiftInput {
  name?: MultilingualText
  description?: MultilingualText
  externalLink?: string
  priceRange?: string
  category?: GiftCategory
  priority?: GiftPriority
  notes?: string
  quantityTotal?: number
  imageUrl?: string
}

export interface ReserveGiftInput {
  guestName: string
  guestPhone: string
  rsvpId?: string
  quantity?: number
  message?: string
}

export interface GiftSettingsInput {
  enabled?: boolean
  maxItems?: number
  maxFileSize?: number
  allowedFormats?: string[]
}

function isValidMultilingualText(value: unknown): value is MultilingualText {
  if (!value || typeof value !== 'object') return false
  const text = value as Record<string, unknown>
  // Only ms and en are required; zh and ta can be empty (will fall back to en)
  return (
    typeof text.ms === 'string' &&
    text.ms.length > 0 &&
    typeof text.en === 'string' &&
    text.en.length > 0
  )
}

function normalizeMultilingualText(text: Record<string, string>): MultilingualText {
  // Fill in empty zh and ta with English fallback
  return {
    ms: text.ms || text.en || '',
    en: text.en || '',
    zh: text.zh || text.en || '',
    ta: text.ta || text.en || '',
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[-\s]/g, '')
  return /^(\+?60|0)[1-9]\d{7,9}$/.test(cleaned)
}

function cleanPhone(phone: string): string {
  return phone.replace(/[-\s]/g, '')
}

export function validateCreateGiftInput(input: unknown):
  | {
      valid: true
      data: CreateGiftInput
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate multilingual name (ms and en required, zh and ta optional)
  if (!isValidMultilingualText(body.name)) {
    return {
      valid: false,
      error: 'Name is required in Malay (ms) and English (en)',
    }
  }
  const nameInput = body.name
  if (nameInput.en.length > GIFT_LIMITS.maxNameLength) {
    return {
      valid: false,
      error: `Name must be less than ${GIFT_LIMITS.maxNameLength} characters`,
    }
  }
  const name = normalizeMultilingualText(nameInput)

  // Validate multilingual description (ms and en required, zh and ta optional)
  if (!isValidMultilingualText(body.description)) {
    return {
      valid: false,
      error: 'Description is required in Malay (ms) and English (en)',
    }
  }
  const descInput = body.description
  if (descInput.en.length > GIFT_LIMITS.maxDescriptionLength) {
    return {
      valid: false,
      error: `Description must be less than ${GIFT_LIMITS.maxDescriptionLength} characters`,
    }
  }
  const description = normalizeMultilingualText(descInput)

  // Validate external link (optional, but if provided must be valid URL)
  let externalLink = ''
  if (body.externalLink !== undefined && body.externalLink !== null && body.externalLink !== '') {
    if (typeof body.externalLink !== 'string') {
      return { valid: false, error: 'External link must be a string' }
    }
    if (body.externalLink.length > GIFT_LIMITS.maxExternalLinkLength) {
      return {
        valid: false,
        error: `External link must be less than ${GIFT_LIMITS.maxExternalLinkLength} characters`,
      }
    }
    if (body.externalLink.trim() && !isValidUrl(body.externalLink.trim())) {
      return { valid: false, error: 'External link must be a valid URL' }
    }
    externalLink = body.externalLink.trim()
  }

  // Validate price range (optional)
  let priceRange: string | undefined
  if (body.priceRange !== undefined && body.priceRange !== null && body.priceRange !== '') {
    if (typeof body.priceRange !== 'string') {
      return { valid: false, error: 'Price range must be a string' }
    }
    if (body.priceRange.length > GIFT_LIMITS.maxPriceRangeLength) {
      return {
        valid: false,
        error: `Price range must be less than ${GIFT_LIMITS.maxPriceRangeLength} characters`,
      }
    }
    priceRange = body.priceRange.trim()
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(body.category as GiftCategory)) {
    return {
      valid: false,
      error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    }
  }

  // Validate priority
  if (!VALID_PRIORITIES.includes(body.priority as GiftPriority)) {
    return {
      valid: false,
      error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
    }
  }

  // Validate notes (optional)
  if (body.notes !== undefined && body.notes !== null && body.notes !== '') {
    if (typeof body.notes !== 'string') {
      return { valid: false, error: 'Notes must be a string' }
    }
    if (body.notes.length > GIFT_LIMITS.maxNotesLength) {
      return {
        valid: false,
        error: `Notes must be less than ${GIFT_LIMITS.maxNotesLength} characters`,
      }
    }
  }

  // Validate quantity
  const qty = Number(body.quantityTotal)
  if (isNaN(qty) || qty < 1 || qty > GIFT_LIMITS.maxQuantityPerItem) {
    return {
      valid: false,
      error: `Quantity must be between 1 and ${GIFT_LIMITS.maxQuantityPerItem}`,
    }
  }

  return {
    valid: true,
    data: {
      name,
      description,
      externalLink,
      category: body.category as GiftCategory,
      priority: body.priority as GiftPriority,
      notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
      quantityTotal: qty,
      ...(priceRange && { priceRange }),
    },
  }
}

export const BULK_CREATE_LIMITS = {
  maxGiftsPerRequest: 50, // Maximum gifts per bulk create request
}

export function validateBulkCreateGiftInput(input: unknown):
  | {
      valid: true
      data: CreateGiftInput[]
    }
  | { valid: false; error: string; index?: number } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate gifts array exists
  if (!Array.isArray(body.gifts)) {
    return { valid: false, error: 'gifts must be an array' }
  }

  const gifts = body.gifts

  // Validate array is not empty
  if (gifts.length === 0) {
    return { valid: false, error: 'gifts array must not be empty' }
  }

  // Validate array length
  if (gifts.length > BULK_CREATE_LIMITS.maxGiftsPerRequest) {
    return {
      valid: false,
      error: `Cannot create more than ${BULK_CREATE_LIMITS.maxGiftsPerRequest} gifts at once`,
    }
  }

  // Validate each gift
  const validatedGifts: CreateGiftInput[] = []
  for (let i = 0; i < gifts.length; i++) {
    const result = validateCreateGiftInput(gifts[i])
    if (!result.valid) {
      return {
        valid: false,
        error: `Gift at index ${i}: ${result.error}`,
        index: i,
      }
    }
    validatedGifts.push(result.data)
  }

  return { valid: true, data: validatedGifts }
}

export function validateUpdateGiftInput(input: unknown):
  | {
      valid: true
      data: UpdateGiftInput
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const data: UpdateGiftInput = {}

  // Validate multilingual name if provided (ms and en required, zh and ta optional)
  if (body.name !== undefined) {
    if (!isValidMultilingualText(body.name)) {
      return {
        valid: false,
        error: 'Name must be provided in Malay (ms) and English (en)',
      }
    }
    const nameInput = body.name
    if (nameInput.en.length > GIFT_LIMITS.maxNameLength) {
      return {
        valid: false,
        error: `Name must be less than ${GIFT_LIMITS.maxNameLength} characters`,
      }
    }
    data.name = normalizeMultilingualText(nameInput)
  }

  // Validate multilingual description if provided (ms and en required, zh and ta optional)
  if (body.description !== undefined) {
    if (!isValidMultilingualText(body.description)) {
      return {
        valid: false,
        error: 'Description must be provided in Malay (ms) and English (en)',
      }
    }
    const descInput = body.description
    if (descInput.en.length > GIFT_LIMITS.maxDescriptionLength) {
      return {
        valid: false,
        error: `Description must be less than ${GIFT_LIMITS.maxDescriptionLength} characters`,
      }
    }
    data.description = normalizeMultilingualText(descInput)
  }

  // Validate external link if provided (can be empty to clear it)
  if (body.externalLink !== undefined) {
    if (typeof body.externalLink !== 'string') {
      return { valid: false, error: 'External link must be a string' }
    }
    // Allow empty string to clear the link
    if (body.externalLink.trim()) {
      if (body.externalLink.length > GIFT_LIMITS.maxExternalLinkLength) {
        return {
          valid: false,
          error: `External link must be less than ${GIFT_LIMITS.maxExternalLinkLength} characters`,
        }
      }
      if (!isValidUrl(body.externalLink.trim())) {
        return { valid: false, error: 'External link must be a valid URL' }
      }
    }
    data.externalLink = body.externalLink.trim()
  }

  // Validate price range if provided (can be empty to clear it)
  if (body.priceRange !== undefined) {
    if (body.priceRange !== null && body.priceRange !== '' && typeof body.priceRange !== 'string') {
      return { valid: false, error: 'Price range must be a string' }
    }
    if (
      typeof body.priceRange === 'string' &&
      body.priceRange.length > GIFT_LIMITS.maxPriceRangeLength
    ) {
      return {
        valid: false,
        error: `Price range must be less than ${GIFT_LIMITS.maxPriceRangeLength} characters`,
      }
    }
    // Allow empty string to clear the price range
    data.priceRange =
      typeof body.priceRange === 'string' ? body.priceRange.trim() || undefined : undefined
  }

  // Validate category if provided
  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category as GiftCategory)) {
      return {
        valid: false,
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      }
    }
    data.category = body.category as GiftCategory
  }

  // Validate priority if provided
  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority as GiftPriority)) {
      return {
        valid: false,
        error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
      }
    }
    data.priority = body.priority as GiftPriority
  }

  // Validate notes if provided
  if (body.notes !== undefined) {
    if (body.notes !== null && body.notes !== '' && typeof body.notes !== 'string') {
      return { valid: false, error: 'Notes must be a string' }
    }
    if (typeof body.notes === 'string' && body.notes.length > GIFT_LIMITS.maxNotesLength) {
      return {
        valid: false,
        error: `Notes must be less than ${GIFT_LIMITS.maxNotesLength} characters`,
      }
    }
    data.notes = typeof body.notes === 'string' ? body.notes.trim() : undefined
  }

  // Validate quantity if provided
  if (body.quantityTotal !== undefined) {
    const qty = Number(body.quantityTotal)
    if (isNaN(qty) || qty < 1 || qty > GIFT_LIMITS.maxQuantityPerItem) {
      return {
        valid: false,
        error: `Quantity must be between 1 and ${GIFT_LIMITS.maxQuantityPerItem}`,
      }
    }
    data.quantityTotal = qty
  }

  // Validate imageUrl if provided
  if (body.imageUrl !== undefined) {
    if (body.imageUrl !== null && body.imageUrl !== '' && typeof body.imageUrl !== 'string') {
      return { valid: false, error: 'Image URL must be a string' }
    }
    data.imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : undefined
  }

  return { valid: true, data }
}

export function validateReserveGiftInput(input: unknown):
  | {
      valid: true
      data: ReserveGiftInput
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate guest name
  if (typeof body.guestName !== 'string' || body.guestName.trim().length < 2) {
    return {
      valid: false,
      error: 'Guest name is required and must be at least 2 characters',
    }
  }

  // Validate guest phone
  if (typeof body.guestPhone !== 'string' || !body.guestPhone.trim()) {
    return { valid: false, error: 'Phone number is required' }
  }
  if (!isValidPhone(body.guestPhone)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  // Validate quantity (optional, defaults to 1)
  const quantity = body.quantity !== undefined ? Number(body.quantity) : 1
  if (isNaN(quantity) || quantity < 1 || quantity > GIFT_LIMITS.maxQuantityPerItem) {
    return {
      valid: false,
      error: `Quantity must be between 1 and ${GIFT_LIMITS.maxQuantityPerItem}`,
    }
  }

  // Validate rsvpId (optional)
  if (body.rsvpId !== undefined && body.rsvpId !== null && body.rsvpId !== '') {
    if (typeof body.rsvpId !== 'string') {
      return { valid: false, error: 'RSVP ID must be a string' }
    }
  }

  // Validate message (optional)
  if (body.message !== undefined && body.message !== null && body.message !== '') {
    if (typeof body.message !== 'string') {
      return { valid: false, error: 'Message must be a string' }
    }
    if (body.message.length > GIFT_LIMITS.maxReservationMessageLength) {
      return {
        valid: false,
        error: `Message must be less than ${GIFT_LIMITS.maxReservationMessageLength} characters`,
      }
    }
  }

  return {
    valid: true,
    data: {
      guestName: body.guestName.trim(),
      guestPhone: cleanPhone(body.guestPhone),
      rsvpId:
        typeof body.rsvpId === 'string' && body.rsvpId.trim() ? body.rsvpId.trim() : undefined,
      quantity,
      message: typeof body.message === 'string' ? body.message.trim() : undefined,
    },
  }
}

export function validateGiftSettingsInput(input: unknown):
  | {
      valid: true
      data: GiftSettingsInput
    }
  | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const data: GiftSettingsInput = {}

  // Validate enabled
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return { valid: false, error: 'Enabled must be a boolean' }
    }
    data.enabled = body.enabled
  }

  // Validate maxItems
  if (body.maxItems !== undefined) {
    const maxItems = Number(body.maxItems)
    if (isNaN(maxItems) || maxItems < 1 || maxItems > 100) {
      return { valid: false, error: 'Max items must be between 1 and 100' }
    }
    data.maxItems = maxItems
  }

  // Validate maxFileSize
  if (body.maxFileSize !== undefined) {
    const maxFileSize = Number(body.maxFileSize)
    if (isNaN(maxFileSize) || maxFileSize < 1024 || maxFileSize > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: 'Max file size must be between 1KB and 10MB',
      }
    }
    data.maxFileSize = maxFileSize
  }

  // Validate allowedFormats
  if (body.allowedFormats !== undefined) {
    if (!Array.isArray(body.allowedFormats)) {
      return { valid: false, error: 'Allowed formats must be an array' }
    }
    const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    for (const format of body.allowedFormats) {
      if (typeof format !== 'string' || !validFormats.includes(format)) {
        return {
          valid: false,
          error: `Invalid format: ${format}. Valid formats: ${validFormats.join(', ')}`,
        }
      }
    }
    data.allowedFormats = body.allowedFormats as string[]
  }

  return { valid: true, data }
}
