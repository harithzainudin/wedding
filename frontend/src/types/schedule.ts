// Types for schedule CMS

export interface MultilingualText {
  ms: string
  en: string
  zh: string
  ta: string
}

export interface ScheduleItem {
  id: string
  time: string
  title: MultilingualText
  order: number
}

// Schedule settings - visibility is now controlled by Design Tab
export interface ScheduleSettings {
  // Empty for now, reserved for future schedule-specific settings
}

export const DEFAULT_SCHEDULE_SETTINGS: ScheduleSettings = {}

export interface ScheduleData {
  items: ScheduleItem[]
  settings?: ScheduleSettings
  updatedAt?: string
  updatedBy?: string
}

export interface ScheduleUpdateRequest {
  items: ScheduleItem[]
}

export interface ScheduleResponse {
  success: boolean
  data?: ScheduleData
  error?: string
}
