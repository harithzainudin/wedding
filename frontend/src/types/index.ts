export interface WeddingConfig {
  couple: {
    bride: {
      fullName: string;
      nickname: string;
    };
    groom: {
      fullName: string;
      nickname: string;
    };
  };
  parents: {
    bride: {
      father: string;
      mother: string;
    };
    groom: {
      father: string;
      mother: string;
    };
  };
  event: {
    date: Date;
    venue: {
      name: string;
      address: string;
      googleMapsUrl: string;
      wazeUrl: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    schedule: EventScheduleItem[];
  };
  contacts: ContactPerson[];
  hashtag: string;
  dressCode: string;
}

export interface EventScheduleItem {
  time: string;
  title: string;
  titleMalay: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  phone: string;
}

export const HONORIFIC_TITLES = [
  "Tan Sri",
  "Puan Sri",
  "Dato' Seri",
  "Datin Seri",
  "Dato'",
  "Datin",
  "Tuan",
  "Puan",
  "Encik",
  "Cik",
] as const;

export type HonorificTitle = (typeof HONORIFIC_TITLES)[number];
