export interface VenueData {
  venueName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  parkingInfo: string | null;
  googleMapsUrl: string;
  wazeUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface VenueUpdateRequest {
  venueName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  parkingInfo?: string;
}

export interface VenueResponse {
  success: boolean;
  data?: VenueData;
  error?: string;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}
