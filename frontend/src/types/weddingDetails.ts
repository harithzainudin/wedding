// Types for wedding details CMS

export interface CoupleInfo {
  fullName: string;
  nickname: string;
}

export interface ParentsInfo {
  father: string;
  mother: string;
}

// Display format types
export type EventDisplayPreset =
  | "date_time_range"
  | "date_start_only"
  | "date_only"
  | "full_details"
  | "custom";

export interface EventDisplayCustomOptions {
  showDate: boolean;
  showStartTime: boolean;
  showEndTime: boolean;
  showDayOfWeek: boolean;
  timeFormat: "12h" | "24h";
  // Advanced custom format strings (e.g., "DD/MM/YYYY", "hh:mm A")
  customDateFormat?: string;
  customTimeFormat?: string;
}

export interface EventDisplayFormat {
  preset: EventDisplayPreset;
  customOptions: EventDisplayCustomOptions;
}

export const DEFAULT_DISPLAY_FORMAT: EventDisplayFormat = {
  preset: "date_start_only",
  customOptions: {
    showDate: true,
    showStartTime: true,
    showEndTime: false,
    showDayOfWeek: true,
    timeFormat: "12h",
  },
};

export interface WeddingDetailsData {
  couple: {
    bride: CoupleInfo;
    groom: CoupleInfo;
  };
  parents: {
    bride: ParentsInfo;
    groom: ParentsInfo;
  };
  eventDate: string;
  eventEndTime?: string;
  eventDisplayFormat?: EventDisplayFormat;
  dressCode: string;
  hashtag: string;
  qrCodeUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface WeddingDetailsUpdateRequest {
  couple: {
    bride: CoupleInfo;
    groom: CoupleInfo;
  };
  parents: {
    bride: ParentsInfo;
    groom: ParentsInfo;
  };
  eventDate: string;
  eventEndTime?: string;
  eventDisplayFormat?: EventDisplayFormat;
  dressCode: string;
  hashtag: string;
  qrCodeUrl: string;
}

export interface WeddingDetailsResponse {
  success: boolean;
  data?: WeddingDetailsData;
  error?: string;
}
