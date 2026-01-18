// Types for wedding details CMS

export interface CoupleInfo {
  fullName: string
  nickname: string
}

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

// Display name order - determines whether bride or groom name appears first
export type DisplayNameOrder = 'bride_first' | 'groom_first'

export const VALID_DISPLAY_NAME_ORDERS: DisplayNameOrder[] = ['bride_first', 'groom_first']

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

export const VALID_PRESETS: EventDisplayPreset[] = [
  'date_time_range',
  'date_start_only',
  'date_only',
  'full_details',
  'custom',
]

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

export const VALID_CALLIGRAPHY_STYLES: CalligraphyStyleId[] = [
  'thuluth',
  'nastaliq',
  'diwani',
  'diwani-jali',
  'naskh',
  'ruqah',
  'kufi',
  'kufi-murabba',
  'maghribi',
  'tughra',
  'modern-simple',
  'classic-ornate',
]

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
  eventDate: string // ISO datetime string (start time)
  eventEndTime?: string // ISO datetime string (end time)
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

function validateCoupleInfo(
  info: unknown,
  label: string
): { valid: true; data: CoupleInfo } | { valid: false; error: string } {
  if (typeof info !== 'object' || info === null) {
    return { valid: false, error: `${label} info is required` }
  }

  const obj = info as Record<string, unknown>

  if (typeof obj.fullName !== 'string' || !obj.fullName.trim()) {
    return { valid: false, error: `${label} full name is required` }
  }
  if (obj.fullName.length > 100) {
    return {
      valid: false,
      error: `${label} full name must be 100 characters or less`,
    }
  }

  if (typeof obj.nickname !== 'string' || !obj.nickname.trim()) {
    return { valid: false, error: `${label} nickname is required` }
  }
  if (obj.nickname.length > 50) {
    return {
      valid: false,
      error: `${label} nickname must be 50 characters or less`,
    }
  }

  return {
    valid: true,
    data: {
      fullName: obj.fullName.trim(),
      nickname: obj.nickname.trim(),
    },
  }
}

function validateParentsInfo(
  info: unknown,
  label: string
): { valid: true; data: ParentsInfo } | { valid: false; error: string } {
  if (typeof info !== 'object' || info === null) {
    return { valid: false, error: `${label} parents info is required` }
  }

  const obj = info as Record<string, unknown>

  if (typeof obj.father !== 'string' || !obj.father.trim()) {
    return { valid: false, error: `${label}'s father name is required` }
  }
  if (obj.father.length > 100) {
    return {
      valid: false,
      error: `${label}'s father name must be 100 characters or less`,
    }
  }

  if (typeof obj.mother !== 'string' || !obj.mother.trim()) {
    return { valid: false, error: `${label}'s mother name is required` }
  }
  if (obj.mother.length > 100) {
    return {
      valid: false,
      error: `${label}'s mother name must be 100 characters or less`,
    }
  }

  return {
    valid: true,
    data: {
      father: obj.father.trim(),
      mother: obj.mother.trim(),
    },
  }
}

export function validateWeddingDetailsUpdate(
  input: unknown
): { valid: true; data: WeddingDetailsUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate couple
  if (typeof body.couple !== 'object' || body.couple === null) {
    return { valid: false, error: 'Couple information is required' }
  }

  const couple = body.couple as Record<string, unknown>

  const brideResult = validateCoupleInfo(couple.bride, 'Bride')
  if (!brideResult.valid) return { valid: false, error: brideResult.error }

  const groomResult = validateCoupleInfo(couple.groom, 'Groom')
  if (!groomResult.valid) return { valid: false, error: groomResult.error }

  // Validate parents
  if (typeof body.parents !== 'object' || body.parents === null) {
    return { valid: false, error: 'Parents information is required' }
  }

  const parents = body.parents as Record<string, unknown>

  const brideParentsResult = validateParentsInfo(parents.bride, 'Bride')
  if (!brideParentsResult.valid) return { valid: false, error: brideParentsResult.error }

  const groomParentsResult = validateParentsInfo(parents.groom, 'Groom')
  if (!groomParentsResult.valid) return { valid: false, error: groomParentsResult.error }

  // Validate eventDate
  if (typeof body.eventDate !== 'string' || !body.eventDate.trim()) {
    return { valid: false, error: 'Event date is required' }
  }

  // Validate date format
  const dateObj = new Date(body.eventDate)
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid event date format' }
  }

  // Validate eventEndTime (optional)
  let validatedEndTime: string | undefined
  if (body.eventEndTime !== undefined && body.eventEndTime !== null && body.eventEndTime !== '') {
    if (typeof body.eventEndTime !== 'string') {
      return { valid: false, error: 'Invalid event end time format' }
    }
    const endDateObj = new Date(body.eventEndTime)
    if (isNaN(endDateObj.getTime())) {
      return { valid: false, error: 'Invalid event end time format' }
    }
    // Validate end time is after start time
    if (endDateObj <= dateObj) {
      return { valid: false, error: 'Event end time must be after start time' }
    }
    validatedEndTime = body.eventEndTime.trim()
  }

  // Validate eventDisplayFormat (optional)
  let validatedDisplayFormat: EventDisplayFormat | undefined
  if (body.eventDisplayFormat !== undefined && body.eventDisplayFormat !== null) {
    if (typeof body.eventDisplayFormat !== 'object') {
      return { valid: false, error: 'Invalid display format' }
    }
    const format = body.eventDisplayFormat as Record<string, unknown>

    // Validate preset
    if (!format.preset || VALID_PRESETS.indexOf(format.preset as EventDisplayPreset) === -1) {
      return { valid: false, error: 'Invalid display format preset' }
    }

    // Validate customOptions if provided
    if (format.customOptions !== undefined) {
      if (typeof format.customOptions !== 'object' || format.customOptions === null) {
        return { valid: false, error: 'Invalid custom options' }
      }
      const options = format.customOptions as Record<string, unknown>

      // Validate boolean fields
      if (
        typeof options.showDate !== 'boolean' ||
        typeof options.showStartTime !== 'boolean' ||
        typeof options.showEndTime !== 'boolean' ||
        typeof options.showDayOfWeek !== 'boolean'
      ) {
        return {
          valid: false,
          error: 'Custom options must have valid boolean values',
        }
      }

      // Validate timeFormat
      if (options.timeFormat !== '12h' && options.timeFormat !== '24h') {
        return { valid: false, error: "Time format must be '12h' or '24h'" }
      }

      // Validate optional custom format strings (max 50 chars each)
      if (
        options.customDateFormat !== undefined &&
        options.customDateFormat !== null &&
        options.customDateFormat !== ''
      ) {
        if (typeof options.customDateFormat !== 'string' || options.customDateFormat.length > 50) {
          return {
            valid: false,
            error: 'Custom date format must be a string of 50 characters or less',
          }
        }
      }
      if (
        options.customTimeFormat !== undefined &&
        options.customTimeFormat !== null &&
        options.customTimeFormat !== ''
      ) {
        if (typeof options.customTimeFormat !== 'string' || options.customTimeFormat.length > 50) {
          return {
            valid: false,
            error: 'Custom time format must be a string of 50 characters or less',
          }
        }
      }

      validatedDisplayFormat = {
        preset: format.preset as EventDisplayPreset,
        customOptions: {
          showDate: options.showDate,
          showStartTime: options.showStartTime,
          showEndTime: options.showEndTime,
          showDayOfWeek: options.showDayOfWeek,
          timeFormat: options.timeFormat,
          customDateFormat:
            typeof options.customDateFormat === 'string' ? options.customDateFormat : undefined,
          customTimeFormat:
            typeof options.customTimeFormat === 'string' ? options.customTimeFormat : undefined,
        },
      }
    } else {
      // Use default custom options if not provided
      validatedDisplayFormat = {
        preset: format.preset as EventDisplayPreset,
        customOptions: DEFAULT_DISPLAY_FORMAT.customOptions,
      }
    }
  }

  // Validate displayNameOrder (optional)
  let validatedDisplayNameOrder: DisplayNameOrder | undefined
  if (
    body.displayNameOrder !== undefined &&
    body.displayNameOrder !== null &&
    body.displayNameOrder !== ''
  ) {
    if (VALID_DISPLAY_NAME_ORDERS.indexOf(body.displayNameOrder as DisplayNameOrder) === -1) {
      return {
        valid: false,
        error: "Display name order must be 'bride_first' or 'groom_first'",
      }
    }
    validatedDisplayNameOrder = body.displayNameOrder as DisplayNameOrder
  }

  // Validate bismillahCalligraphy (optional)
  let validatedBismillahCalligraphy: BismillahCalligraphySettings | undefined
  if (body.bismillahCalligraphy !== undefined && body.bismillahCalligraphy !== null) {
    if (typeof body.bismillahCalligraphy !== 'object') {
      return { valid: false, error: 'Invalid bismillah calligraphy settings' }
    }
    const calligraphy = body.bismillahCalligraphy as Record<string, unknown>

    // Validate selectedStyle
    if (
      !calligraphy.selectedStyle ||
      VALID_CALLIGRAPHY_STYLES.indexOf(calligraphy.selectedStyle as CalligraphyStyleId) === -1
    ) {
      return { valid: false, error: 'Invalid calligraphy style selected' }
    }

    // Validate showTranslation
    if (typeof calligraphy.showTranslation !== 'boolean') {
      return { valid: false, error: 'showTranslation must be a boolean' }
    }

    validatedBismillahCalligraphy = {
      selectedStyle: calligraphy.selectedStyle as CalligraphyStyleId,
      showTranslation: calligraphy.showTranslation,
    }
  }

  // Validate parentsVisibility (optional)
  let validatedParentsVisibility: ParentsVisibilitySettings | undefined
  if (body.parentsVisibility !== undefined && body.parentsVisibility !== null) {
    if (typeof body.parentsVisibility !== 'object') {
      return { valid: false, error: 'Invalid parents visibility settings' }
    }
    const visibility = body.parentsVisibility as Record<string, unknown>

    // Validate boolean fields
    if (typeof visibility.showBrideParents !== 'boolean') {
      return { valid: false, error: 'showBrideParents must be a boolean' }
    }
    if (typeof visibility.showGroomParents !== 'boolean') {
      return { valid: false, error: 'showGroomParents must be a boolean' }
    }

    validatedParentsVisibility = {
      showBrideParents: visibility.showBrideParents,
      showGroomParents: visibility.showGroomParents,
    }
  }

  // Validate dressCode
  if (typeof body.dressCode !== 'string' || !body.dressCode.trim()) {
    return { valid: false, error: 'Dress code is required' }
  }
  if (body.dressCode.length > 100) {
    return { valid: false, error: 'Dress code must be 100 characters or less' }
  }

  // Validate hashtag
  if (typeof body.hashtag !== 'string' || !body.hashtag.trim()) {
    return { valid: false, error: 'Hashtag is required' }
  }
  if (body.hashtag.length > 50) {
    return { valid: false, error: 'Hashtag must be 50 characters or less' }
  }

  return {
    valid: true,
    data: {
      couple: {
        bride: brideResult.data,
        groom: groomResult.data,
      },
      parents: {
        bride: brideParentsResult.data,
        groom: groomParentsResult.data,
      },
      parentsVisibility: validatedParentsVisibility,
      eventDate: body.eventDate.trim(),
      eventEndTime: validatedEndTime,
      eventDisplayFormat: validatedDisplayFormat,
      displayNameOrder: validatedDisplayNameOrder,
      bismillahCalligraphy: validatedBismillahCalligraphy,
      dressCode: body.dressCode.trim(),
      hashtag: body.hashtag.trim(),
    },
  }
}

// Default wedding details data (fallback when no data exists in DB)
export const DEFAULT_WEDDING_DETAILS: WeddingDetailsData = {
  couple: {
    bride: {
      fullName: 'Nama Penuh Pengantin Perempuan',
      nickname: 'Aisyah',
    },
    groom: {
      fullName: 'Nama Penuh Pengantin Lelaki',
      nickname: 'Ahmad',
    },
  },
  parents: {
    bride: {
      father: 'Encik Bapa Pengantin Perempuan',
      mother: 'Puan Ibu Pengantin Perempuan',
    },
    groom: {
      father: 'Encik Bapa Pengantin Lelaki',
      mother: 'Puan Ibu Pengantin Lelaki',
    },
  },
  parentsVisibility: DEFAULT_PARENTS_VISIBILITY,
  eventDate: '2026-12-12T11:00:00+08:00',
  eventEndTime: '2026-12-12T16:00:00+08:00',
  eventDisplayFormat: DEFAULT_DISPLAY_FORMAT,
  bismillahCalligraphy: DEFAULT_BISMILLAH_SETTINGS,
  dressCode: 'Pastel / Earthy Tones',
  hashtag: '#AisyahAhmadWedding',
}
