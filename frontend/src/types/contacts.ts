// Types for contacts CMS

export interface MultilingualText {
  ms: string;
  en: string;
  zh: string;
  ta: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  role: MultilingualText;
  phoneNumber: string;
  order: number;
}

export interface ContactsData {
  contacts: ContactPerson[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ContactsUpdateRequest {
  contacts: ContactPerson[];
}

export interface ContactsResponse {
  success: boolean;
  data?: ContactsData;
  error?: string;
}
