import type { WeddingConfig } from '@/types'
import { DEFAULT_DISPLAY_FORMAT } from '@/types/weddingDetails'

export const weddingConfig: WeddingConfig = {
  couple: {
    bride: {
      fullName: "[Bride's Full Name]",
      nickname: '[Bride]',
    },
    groom: {
      fullName: "[Groom's Full Name]",
      nickname: '[Groom]',
    },
  },
  parents: {
    bride: {
      father: "[Father's Name]",
      mother: "[Mother's Name]",
    },
    groom: {
      father: "[Father's Name]",
      mother: "[Mother's Name]",
    },
  },
  event: {
    date: new Date('2026-12-12T11:00:00+08:00'),
    endDate: new Date('2026-12-12T16:00:00+08:00'),
    displayFormat: DEFAULT_DISPLAY_FORMAT,
    venue: {
      name: '[Your Venue Name]',
      address: '[Venue address]',
      googleMapsUrl: '',
      wazeUrl: '',
      coordinates: {
        lat: 0,
        lng: 0,
      },
      parkingInfo: '',
    },
    schedule: [],
  },
  contacts: [],
  hashtag: '[#YourHashtag]',
  dressCode: '[Your Dress Code]',
}
