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

export interface ScheduleSettings {
  showSchedule: boolean
}

export const DEFAULT_SCHEDULE_SETTINGS: ScheduleSettings = {
  showSchedule: true,
}

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
