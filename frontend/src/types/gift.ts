import type { Language } from '@/i18n/translations'

export type MultilingualText = Record<Language, string>
export type GiftPriority = 'high' | 'medium' | 'low' | 'none'
export type GiftCategory = 'home' | 'kitchen' | 'electronics' | 'experiences' | 'other'

export const GIFT_PRIORITIES: GiftPriority[] = ['none', 'high', 'medium', 'low']
export const GIFT_CATEGORIES: GiftCategory[] = [
  'home',
  'kitchen',
  'electronics',
  'experiences',
  'other',
]

export interface GiftItem {
  id: string
  name: MultilingualText
  description: MultilingualText
  imageUrl?: string
  externalLink: string
  priceRange?: string
  category: GiftCategory
  priority: GiftPriority
  notes?: string
  quantityTotal: number
  quantityReserved: number
  order: number
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface GiftReservation {
  id: string
  giftId: string
  giftName: MultilingualText
  guestName: string
  guestPhone: string
  rsvpId?: string
  quantity: number
  message?: string
  reservedAt: string
}

export interface GiftSettings {
  enabled: boolean
  maxItems: number
  maxFileSize: number
  allowedFormats: string[]
  updatedAt?: string
  updatedBy?: string
}

export interface CreateGiftRequest {
  name: MultilingualText
  description: MultilingualText
  externalLink: string
  priceRange?: string
  category: GiftCategory
  priority: GiftPriority
  notes?: string
  quantityTotal: number
}

export interface UpdateGiftRequest {
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

export interface ReserveGiftRequest {
  guestName: string
  guestPhone: string
  rsvpId?: string
  quantity?: number
  message?: string
}

export interface GiftListResponse {
  gifts: GiftItem[]
  total: number
  enabled: boolean
  settings?: GiftSettings
}

export interface CreateGiftResponse {
  id: string
  name: MultilingualText
  description: MultilingualText
  externalLink: string
  priceRange?: string
  category: GiftCategory
  priority: GiftPriority
  notes?: string
  quantityTotal: number
  quantityReserved: number
  order: number
  createdAt: string
}

export interface UpdateGiftResponse extends GiftItem {}

export interface DeleteGiftResponse {
  message: string
  id: string
  reservationsDeleted: number
}

export interface ReorderGiftsRequest {
  giftIds: string[]
}

export interface ReorderGiftsResponse {
  message: string
  count: number
}

export interface GiftPresignedUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
  giftId?: string
}

export interface GiftPresignedUrlResponse {
  uploadUrl: string
  giftId: string
  s3Key: string
  expiresIn: number
}

export interface GiftConfirmUploadRequest {
  giftId: string
  s3Key: string
  filename: string
  mimeType: string
}

export interface GiftConfirmUploadResponse {
  giftId: string
  filename: string
  s3Key: string
  mimeType: string
  fileSize: number
  imageUrl: string
  updatedAt: string
}

export interface ReserveGiftResponse {
  id: string
  giftId: string
  guestName: string
  quantity: number
  reservedAt: string
  message: string
  remainingQuantity: number
}

export interface ReservationListResponse {
  reservations: GiftReservation[]
  summary: {
    totalReservations: number
    totalQuantity: number
    uniqueGuests: number
  }
}

export interface GiftSettingsUpdateRequest {
  enabled?: boolean
  maxItems?: number
  maxFileSize?: number
  allowedFormats?: string[]
}
