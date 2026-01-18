// Types for wedding details CMS

export interface CoupleInfo {
  fullName: string
  nickname: string
}

// Display name order - determines whether bride or groom name appears first
export type DisplayNameOrder = 'bride_first' | 'groom_first'

export interface ParentsInfo {
  father: string
  mother: string
}

// Parents visibility settings - controls which parents are shown on public page
export interface ParentsVisibilitySettings {
  showBrideParents: boolean
  showGroomParents: boolean
}

export const DEFAULT_PARENTS_VISIBILITY: ParentsVisibilitySettings = {
  showBrideParents: true,
  showGroomParents: true,
}

// Display format types
export type EventDisplayPreset =
  | 'date_time_range'
  | 'date_start_only'
  | 'date_only'
  | 'full_details'
  | 'custom'

export interface EventDisplayCustomOptions {
  showDate: boolean
  showStartTime: boolean
  showEndTime: boolean
  showDayOfWeek: boolean
  timeFormat: '12h' | '24h'
  // Advanced custom format strings (e.g., "DD/MM/YYYY", "hh:mm A")
  customDateFormat?: string
  customTimeFormat?: string
}

export interface EventDisplayFormat {
  preset: EventDisplayPreset
  customOptions: EventDisplayCustomOptions
}

export const DEFAULT_DISPLAY_FORMAT: EventDisplayFormat = {
  preset: 'date_start_only',
  customOptions: {
    showDate: true,
    showStartTime: true,
    showEndTime: false,
    showDayOfWeek: true,
    timeFormat: '12h',
  },
}

// Bismillah calligraphy types
export type CalligraphyStyleId =
  | 'thuluth'
  | 'nastaliq'
  | 'diwani'
  | 'diwani-jali'
  | 'naskh'
  | 'ruqah'
  | 'kufi'
  | 'kufi-murabba'
  | 'maghribi'
  | 'tughra'
  | 'modern-simple'
  | 'classic-ornate'

export interface BismillahCalligraphySettings {
  selectedStyle: CalligraphyStyleId
  showTranslation: boolean
}

export const DEFAULT_BISMILLAH_SETTINGS: BismillahCalligraphySettings = {
  selectedStyle: 'thuluth',
  showTranslation: true,
}

export interface WeddingDetailsData {
  couple: {
    bride: CoupleInfo
    groom: CoupleInfo
  }
  parents: {
    bride: ParentsInfo
    groom: ParentsInfo
  }
  parentsVisibility?: ParentsVisibilitySettings
  eventDate: string
  eventEndTime?: string
  eventDisplayFormat?: EventDisplayFormat
  displayNameOrder?: DisplayNameOrder
  bismillahCalligraphy?: BismillahCalligraphySettings
  dressCode: string
  hashtag: string
  updatedAt?: string
  updatedBy?: string
}

export interface WeddingDetailsUpdateRequest {
  couple: {
    bride: CoupleInfo
    groom: CoupleInfo
  }
  parents: {
    bride: ParentsInfo
    groom: ParentsInfo
  }
  parentsVisibility?: ParentsVisibilitySettings
  eventDate: string
  eventEndTime?: string
  eventDisplayFormat?: EventDisplayFormat
  displayNameOrder?: DisplayNameOrder
  bismillahCalligraphy?: BismillahCalligraphySettings
  dressCode: string
  hashtag: string
}

export interface WeddingDetailsResponse {
  success: boolean
  data?: WeddingDetailsData
  error?: string
}
