/**
 * QR Code Hub validation utilities
 */

export type Language = 'ms' | 'en' | 'zh' | 'ta'
export type MultilingualText = Record<Language, string>
export type LocationApp = 'google_maps' | 'waze' | 'both'
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'
export type QRCodeType =
  | 'website'
  | 'restuDigital'
  | 'location'
  | 'wifi'
  | 'rsvp'
  | 'calendar'
  | 'hashtag'

export const VALID_LOCATION_APPS: LocationApp[] = ['google_maps', 'waze', 'both']
export const VALID_WIFI_ENCRYPTIONS: WifiEncryption[] = ['WPA', 'WEP', 'nopass']
export const VALID_QR_TYPES: QRCodeType[] = [
  'website',
  'restuDigital',
  'location',
  'wifi',
  'rsvp',
  'calendar',
  'hashtag',
]

export const QRCODE_LIMITS = {
  maxTaglineLength: 200,
  maxBankNameLength: 100,
  maxBankAccountNameLength: 100,
  maxBankAccountNumberLength: 30,
  maxSsidLength: 32,
  maxPasswordLength: 63,
  maxUrlLength: 500,
  allowedImageFormats: ['image/jpeg', 'image/png', 'image/webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
}

// Restu Digital configuration
export interface RestuDigitalConfig {
  enabled: boolean
  useImage: boolean
  qrImageUrl?: string
  bankAccountNumber?: string
  bankAccountName?: string
  bankName?: string
  tagline?: string
}

// Location QR configuration
export interface LocationQRConfig {
  enabled: boolean
  preferredApp: LocationApp
}

// WiFi QR configuration
export interface WifiQRConfig {
  enabled: boolean
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}

// Simple enabled config
export interface SimpleQRConfig {
  enabled: boolean
}

// Main QR Code Hub Settings
export interface QRCodeHubSettings {
  hubEnabled: boolean
  website: SimpleQRConfig
  restuDigital: RestuDigitalConfig
  location: LocationQRConfig
  wifi: WifiQRConfig
  rsvp: SimpleQRConfig
  calendar: SimpleQRConfig
  hashtag: SimpleQRConfig
  displayOrder: QRCodeType[]
  updatedAt?: string
  updatedBy?: string
}

// Default tagline for Restu Digital
export const DEFAULT_RESTU_TAGLINE = 'Restu anda, walau dalam apa bentuk, amat bermakna'

// Default QR Code Hub settings
export const DEFAULT_QRCODE_HUB_SETTINGS: QRCodeHubSettings = {
  hubEnabled: false,
  website: { enabled: true },
  restuDigital: {
    enabled: false,
    useImage: true,
    tagline: DEFAULT_RESTU_TAGLINE,
  },
  location: {
    enabled: true,
    preferredApp: 'both',
  },
  wifi: {
    enabled: false,
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  },
  rsvp: { enabled: true },
  calendar: { enabled: true },
  hashtag: { enabled: true },
  displayOrder: ['website', 'restuDigital', 'location', 'wifi', 'rsvp', 'calendar', 'hashtag'],
}

// Input type for updating settings
export interface QRCodeHubUpdateInput {
  hubEnabled?: boolean
  website?: { enabled?: boolean }
  restuDigital?: Partial<RestuDigitalConfig>
  location?: Partial<LocationQRConfig>
  wifi?: Partial<WifiQRConfig>
  rsvp?: { enabled?: boolean }
  calendar?: { enabled?: boolean }
  hashtag?: { enabled?: boolean }
  displayOrder?: QRCodeType[]
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function validateRestuDigital(
  input: unknown
): { valid: true; data: Partial<RestuDigitalConfig> } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Restu Digital config must be an object' }
  }

  const body = input as Record<string, unknown>
  const data: Partial<RestuDigitalConfig> = {}

  // Validate enabled
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return { valid: false, error: 'Restu Digital enabled must be a boolean' }
    }
    data.enabled = body.enabled
  }

  // Validate useImage
  if (body.useImage !== undefined) {
    if (typeof body.useImage !== 'boolean') {
      return { valid: false, error: 'useImage must be a boolean' }
    }
    data.useImage = body.useImage
  }

  // Validate qrImageUrl (optional)
  if (body.qrImageUrl !== undefined) {
    if (body.qrImageUrl !== null && body.qrImageUrl !== '') {
      if (typeof body.qrImageUrl !== 'string') {
        return { valid: false, error: 'QR image URL must be a string' }
      }
      if (body.qrImageUrl.length > QRCODE_LIMITS.maxUrlLength) {
        return {
          valid: false,
          error: `QR image URL must be ${QRCODE_LIMITS.maxUrlLength} characters or less`,
        }
      }
      if (!isValidUrl(body.qrImageUrl)) {
        return { valid: false, error: 'QR image URL must be a valid URL' }
      }
    }
    data.qrImageUrl = typeof body.qrImageUrl === 'string' ? body.qrImageUrl : undefined
  }

  // Validate bankAccountNumber (optional)
  if (body.bankAccountNumber !== undefined) {
    if (body.bankAccountNumber !== null && body.bankAccountNumber !== '') {
      if (typeof body.bankAccountNumber !== 'string') {
        return { valid: false, error: 'Bank account number must be a string' }
      }
      // Remove spaces and dashes for validation
      const cleaned = body.bankAccountNumber.replace(/[-\s]/g, '')
      if (!/^\d+$/.test(cleaned)) {
        return {
          valid: false,
          error: 'Bank account number must contain only digits',
        }
      }
      if (cleaned.length > QRCODE_LIMITS.maxBankAccountNumberLength) {
        return {
          valid: false,
          error: `Bank account number must be ${QRCODE_LIMITS.maxBankAccountNumberLength} digits or less`,
        }
      }
    }
    data.bankAccountNumber =
      typeof body.bankAccountNumber === 'string' ? body.bankAccountNumber.trim() : undefined
  }

  // Validate bankAccountName (optional)
  if (body.bankAccountName !== undefined) {
    if (body.bankAccountName !== null && body.bankAccountName !== '') {
      if (typeof body.bankAccountName !== 'string') {
        return { valid: false, error: 'Bank account name must be a string' }
      }
      if (body.bankAccountName.length > QRCODE_LIMITS.maxBankAccountNameLength) {
        return {
          valid: false,
          error: `Bank account name must be ${QRCODE_LIMITS.maxBankAccountNameLength} characters or less`,
        }
      }
    }
    data.bankAccountName =
      typeof body.bankAccountName === 'string' ? body.bankAccountName.trim() : undefined
  }

  // Validate bankName (optional)
  if (body.bankName !== undefined) {
    if (body.bankName !== null && body.bankName !== '') {
      if (typeof body.bankName !== 'string') {
        return { valid: false, error: 'Bank name must be a string' }
      }
      if (body.bankName.length > QRCODE_LIMITS.maxBankNameLength) {
        return {
          valid: false,
          error: `Bank name must be ${QRCODE_LIMITS.maxBankNameLength} characters or less`,
        }
      }
    }
    data.bankName = typeof body.bankName === 'string' ? body.bankName.trim() : undefined
  }

  // Validate tagline (optional)
  if (body.tagline !== undefined) {
    if (body.tagline !== null && body.tagline !== '') {
      if (typeof body.tagline !== 'string') {
        return { valid: false, error: 'Tagline must be a string' }
      }
      if (body.tagline.length > QRCODE_LIMITS.maxTaglineLength) {
        return {
          valid: false,
          error: `Tagline must be ${QRCODE_LIMITS.maxTaglineLength} characters or less`,
        }
      }
    }
    data.tagline = typeof body.tagline === 'string' ? body.tagline.trim() : undefined
  }

  return { valid: true, data }
}

function validateLocationConfig(
  input: unknown
): { valid: true; data: Partial<LocationQRConfig> } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Location config must be an object' }
  }

  const body = input as Record<string, unknown>
  const data: Partial<LocationQRConfig> = {}

  // Validate enabled
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return { valid: false, error: 'Location enabled must be a boolean' }
    }
    data.enabled = body.enabled
  }

  // Validate preferredApp
  if (body.preferredApp !== undefined) {
    if (!VALID_LOCATION_APPS.includes(body.preferredApp as LocationApp)) {
      return {
        valid: false,
        error: `Preferred app must be one of: ${VALID_LOCATION_APPS.join(', ')}`,
      }
    }
    data.preferredApp = body.preferredApp as LocationApp
  }

  return { valid: true, data }
}

function validateWifiConfig(
  input: unknown
): { valid: true; data: Partial<WifiQRConfig> } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'WiFi config must be an object' }
  }

  const body = input as Record<string, unknown>
  const data: Partial<WifiQRConfig> = {}

  // Validate enabled
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return { valid: false, error: 'WiFi enabled must be a boolean' }
    }
    data.enabled = body.enabled
  }

  // Validate ssid
  if (body.ssid !== undefined) {
    if (typeof body.ssid !== 'string') {
      return { valid: false, error: 'SSID must be a string' }
    }
    if (body.ssid.length > QRCODE_LIMITS.maxSsidLength) {
      return {
        valid: false,
        error: `SSID must be ${QRCODE_LIMITS.maxSsidLength} characters or less`,
      }
    }
    data.ssid = body.ssid.trim()
  }

  // Validate password
  if (body.password !== undefined) {
    if (typeof body.password !== 'string') {
      return { valid: false, error: 'WiFi password must be a string' }
    }
    if (body.password.length > QRCODE_LIMITS.maxPasswordLength) {
      return {
        valid: false,
        error: `WiFi password must be ${QRCODE_LIMITS.maxPasswordLength} characters or less`,
      }
    }
    data.password = body.password
  }

  // Validate encryption
  if (body.encryption !== undefined) {
    if (!VALID_WIFI_ENCRYPTIONS.includes(body.encryption as WifiEncryption)) {
      return {
        valid: false,
        error: `Encryption must be one of: ${VALID_WIFI_ENCRYPTIONS.join(', ')}`,
      }
    }
    data.encryption = body.encryption as WifiEncryption
  }

  // Validate hidden
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') {
      return { valid: false, error: 'Hidden must be a boolean' }
    }
    data.hidden = body.hidden
  }

  return { valid: true, data }
}

function validateSimpleConfig(
  input: unknown,
  fieldName: string
): { valid: true; data: { enabled?: boolean } } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: `${fieldName} config must be an object` }
  }

  const body = input as Record<string, unknown>
  const data: { enabled?: boolean } = {}

  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return { valid: false, error: `${fieldName} enabled must be a boolean` }
    }
    data.enabled = body.enabled
  }

  return { valid: true, data }
}

function validateDisplayOrder(
  input: unknown
): { valid: true; data: QRCodeType[] } | { valid: false; error: string } {
  if (!Array.isArray(input)) {
    return { valid: false, error: 'Display order must be an array' }
  }

  const validTypes = new Set(VALID_QR_TYPES)
  const seen = new Set<string>()

  for (const item of input) {
    if (typeof item !== 'string') {
      return { valid: false, error: 'Display order items must be strings' }
    }
    if (!validTypes.has(item as QRCodeType)) {
      return {
        valid: false,
        error: `Invalid QR type in display order: ${item}. Valid types: ${VALID_QR_TYPES.join(', ')}`,
      }
    }
    if (seen.has(item)) {
      return { valid: false, error: `Duplicate QR type in display order: ${item}` }
    }
    seen.add(item)
  }

  return { valid: true, data: input as QRCodeType[] }
}

export function validateQRCodeHubUpdate(
  input: unknown
): { valid: true; data: QRCodeHubUpdateInput } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>
  const data: QRCodeHubUpdateInput = {}

  // Validate hubEnabled
  if (body.hubEnabled !== undefined) {
    if (typeof body.hubEnabled !== 'boolean') {
      return { valid: false, error: 'hubEnabled must be a boolean' }
    }
    data.hubEnabled = body.hubEnabled
  }

  // Validate website config
  if (body.website !== undefined) {
    const result = validateSimpleConfig(body.website, 'Website')
    if (!result.valid) {
      return result
    }
    data.website = result.data
  }

  // Validate restuDigital config
  if (body.restuDigital !== undefined) {
    const result = validateRestuDigital(body.restuDigital)
    if (!result.valid) {
      return result
    }
    data.restuDigital = result.data
  }

  // Validate location config
  if (body.location !== undefined) {
    const result = validateLocationConfig(body.location)
    if (!result.valid) {
      return result
    }
    data.location = result.data
  }

  // Validate wifi config
  if (body.wifi !== undefined) {
    const result = validateWifiConfig(body.wifi)
    if (!result.valid) {
      return result
    }
    data.wifi = result.data
  }

  // Validate rsvp config
  if (body.rsvp !== undefined) {
    const result = validateSimpleConfig(body.rsvp, 'RSVP')
    if (!result.valid) {
      return result
    }
    data.rsvp = result.data
  }

  // Validate calendar config
  if (body.calendar !== undefined) {
    const result = validateSimpleConfig(body.calendar, 'Calendar')
    if (!result.valid) {
      return result
    }
    data.calendar = result.data
  }

  // Validate hashtag config
  if (body.hashtag !== undefined) {
    const result = validateSimpleConfig(body.hashtag, 'Hashtag')
    if (!result.valid) {
      return result
    }
    data.hashtag = result.data
  }

  // Validate displayOrder
  if (body.displayOrder !== undefined) {
    const result = validateDisplayOrder(body.displayOrder)
    if (!result.valid) {
      return result
    }
    data.displayOrder = result.data
  }

  return { valid: true, data }
}

// Merge update input with existing settings
export function mergeQRCodeHubSettings(
  existing: QRCodeHubSettings,
  update: QRCodeHubUpdateInput
): QRCodeHubSettings {
  return {
    hubEnabled: update.hubEnabled ?? existing.hubEnabled,
    website: {
      enabled: update.website?.enabled ?? existing.website.enabled,
    },
    restuDigital: {
      enabled: update.restuDigital?.enabled ?? existing.restuDigital.enabled,
      useImage: update.restuDigital?.useImage ?? existing.restuDigital.useImage,
      qrImageUrl:
        update.restuDigital?.qrImageUrl !== undefined
          ? update.restuDigital.qrImageUrl
          : existing.restuDigital.qrImageUrl,
      bankAccountNumber:
        update.restuDigital?.bankAccountNumber !== undefined
          ? update.restuDigital.bankAccountNumber
          : existing.restuDigital.bankAccountNumber,
      bankAccountName:
        update.restuDigital?.bankAccountName !== undefined
          ? update.restuDigital.bankAccountName
          : existing.restuDigital.bankAccountName,
      bankName:
        update.restuDigital?.bankName !== undefined
          ? update.restuDigital.bankName
          : existing.restuDigital.bankName,
      tagline:
        update.restuDigital?.tagline !== undefined
          ? update.restuDigital.tagline
          : existing.restuDigital.tagline,
    },
    location: {
      enabled: update.location?.enabled ?? existing.location.enabled,
      preferredApp: update.location?.preferredApp ?? existing.location.preferredApp,
    },
    wifi: {
      enabled: update.wifi?.enabled ?? existing.wifi.enabled,
      ssid: update.wifi?.ssid ?? existing.wifi.ssid,
      password: update.wifi?.password ?? existing.wifi.password,
      encryption: update.wifi?.encryption ?? existing.wifi.encryption,
      hidden: update.wifi?.hidden ?? existing.wifi.hidden,
    },
    rsvp: {
      enabled: update.rsvp?.enabled ?? existing.rsvp.enabled,
    },
    calendar: {
      enabled: update.calendar?.enabled ?? existing.calendar.enabled,
    },
    hashtag: {
      enabled: update.hashtag?.enabled ?? existing.hashtag.enabled,
    },
    displayOrder: update.displayOrder ?? existing.displayOrder,
  }
}
