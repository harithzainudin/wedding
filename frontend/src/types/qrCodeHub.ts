/**
 * QR Code Hub types for the wedding website
 */

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

// Default tagline for Restu Digital
export const DEFAULT_RESTU_TAGLINE = 'Restu anda, walau dalam apa bentuk, amat bermakna'

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

// Default QR Code Hub settings
// hubEnabled: true so admins see the section by default
// All QR types disabled: admin must configure which ones to enable
export const DEFAULT_QRCODE_HUB_SETTINGS: QRCodeHubSettings = {
  hubEnabled: true,
  website: { enabled: false },
  restuDigital: {
    enabled: false,
    useImage: true,
    tagline: DEFAULT_RESTU_TAGLINE,
  },
  location: {
    enabled: false,
    preferredApp: 'both',
  },
  wifi: {
    enabled: false,
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  },
  rsvp: { enabled: false },
  calendar: { enabled: false },
  hashtag: { enabled: false },
  displayOrder: ['website', 'restuDigital', 'location', 'wifi', 'rsvp', 'calendar', 'hashtag'],
}

// Input type for updating settings
export interface QRCodeHubUpdateRequest {
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

// Presigned URL request for image upload
export interface QRCodeHubPresignedUrlRequest {
  mimeType: string
  fileSize: number
}

// Presigned URL response
export interface QRCodeHubPresignedUrlResponse {
  uploadUrl: string
  imageId: string
  s3Key: string
  publicUrl: string
  expiresIn: number
}

// QR Code display info for rendering in the UI
export interface QRCodeDisplayInfo {
  type: QRCodeType
  enabled: boolean
  titleKey: string
  subtitleKey: string
  qrData: string
  icon: string
}
