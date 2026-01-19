// Types for contacts CMS

export interface MultilingualText {
  ms: string
  en: string
  zh: string
  ta: string
}

export interface ContactPerson {
  id: string
  name: string
  role: MultilingualText
  phoneNumber: string
  order: number
}

export interface ContactsSettings {
  showContacts: boolean
}

export const DEFAULT_CONTACTS_SETTINGS: ContactsSettings = {
  showContacts: true,
}

export interface ContactsData {
  contacts: ContactPerson[]
  settings?: ContactsSettings
  updatedAt?: string
  updatedBy?: string
}

export interface ContactsUpdateRequest {
  contacts: ContactPerson[]
}

export interface ContactsResponse {
  success: boolean
  data?: ContactsData
  error?: string
}
