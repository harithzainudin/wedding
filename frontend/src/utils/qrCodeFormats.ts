/**
 * QR Code data format utilities
 * Generates properly formatted data strings for various QR code types
 */

import type { LocationApp, WifiEncryption } from '@/types/qrCodeHub'

/**
 * Generate WiFi QR code data string
 * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
 */
export function generateWifiQRData(
  ssid: string,
  password: string,
  encryption: WifiEncryption = 'WPA',
  hidden: boolean = false
): string {
  // Escape special characters in SSID and password
  const escapeWifiString = (str: string): string => {
    return str.replace(/[\\;,:]/g, '\\$&')
  }

  const escapedSsid = escapeWifiString(ssid)
  const escapedPassword = escapeWifiString(password)
  const hiddenFlag = hidden ? 'true' : 'false'

  return `WIFI:T:${encryption};S:${escapedSsid};P:${escapedPassword};H:${hiddenFlag};;`
}

/**
 * Generate Google Maps URL for location QR code
 */
export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/**
 * Generate Waze URL for location QR code
 */
export function generateWazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

/**
 * Generate location QR code data based on preferred app
 */
export function generateLocationQRData(
  lat: number,
  lng: number,
  preferredApp: LocationApp = 'both'
): string {
  // For 'both', we'll use Google Maps as the default since it's more universal
  // The UI should show both options separately
  if (preferredApp === 'waze') {
    return generateWazeUrl(lat, lng)
  }
  return generateGoogleMapsUrl(lat, lng)
}

/**
 * Generate RSVP direct link QR code data
 */
export function generateRsvpUrl(baseUrl: string): string {
  return `${baseUrl}#rsvp`
}

/**
 * Generate Google Calendar event URL
 */
export function generateCalendarUrl(
  title: string,
  startDate: Date,
  endDate: Date,
  location: string,
  description?: string
): string {
  // Format dates as YYYYMMDDTHHMMSS (local time without Z suffix for all-day events)
  const formatDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    location: location,
  })

  if (description) {
    params.set('details', description)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Instagram hashtag search URL
 */
export function generateHashtagUrl(hashtag: string): string {
  // Remove # if present and clean the hashtag
  const cleanHashtag = hashtag.replace(/^#/, '').trim()
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(cleanHashtag)}/`
}

/**
 * Generate a simple URL QR code data
 */
export function generateWebsiteUrl(url: string): string {
  return url
}

/**
 * Generate Restu Digital QR data
 * If using bank details, return a formatted display string
 * If using image, the image URL should be used directly
 */
export function generateRestuDigitalData(
  bankName?: string,
  bankAccountName?: string,
  bankAccountNumber?: string
): string | null {
  if (!bankName || !bankAccountName || !bankAccountNumber) {
    return null
  }

  // For bank details, we can't generate a universal payment QR
  // Instead, return a formatted string that the UI can display
  // The actual QR should show the bank details as text
  return `${bankName}\n${bankAccountName}\n${bankAccountNumber}`
}
