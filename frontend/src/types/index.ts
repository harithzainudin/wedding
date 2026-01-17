import type { EventDisplayFormat } from './weddingDetails'

export interface GalleryPhoto {
  src: string
  alt?: string
}

export interface WeddingConfig {
  couple: {
    bride: {
      fullName: string
      nickname: string
    }
    groom: {
      fullName: string
      nickname: string
    }
  }
  parents: {
    bride: {
      father: string
      mother: string
    }
    groom: {
      father: string
      mother: string
    }
  }
  event: {
    date: Date
    endDate?: Date
    displayFormat?: EventDisplayFormat
    venue: {
      name: string
      address: string
      googleMapsUrl: string
      wazeUrl: string
      coordinates: {
        lat: number
        lng: number
      }
      parkingInfo?: string
    }
    schedule: EventScheduleItem[]
  }
  contacts: ContactPerson[]
  hashtag: string
  dressCode: string
  gallery?: GalleryPhoto[]
}

export interface EventScheduleItem {
  time: string
  title: string
  titleMalay: string
}

export interface ContactPerson {
  name: string
  role: string
  phone: string
}

export const HONORIFIC_TITLES = [
  'Tan Sri',
  'Puan Sri',
  "Dato' Seri",
  'Datin Seri',
  "Dato'",
  'Datin',
  'Tuan',
  'Puan',
  'Encik',
  'Cik',
] as const

export type HonorificTitle = (typeof HONORIFIC_TITLES)[number]
