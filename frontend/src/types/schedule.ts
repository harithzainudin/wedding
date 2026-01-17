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

export interface ScheduleData {
  items: ScheduleItem[]
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
