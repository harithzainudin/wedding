// Types for wedding details CMS

export interface CoupleInfo {
  fullName: string;
  nickname: string;
}

export interface ParentsInfo {
  father: string;
  mother: string;
}

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
  dressCode: string;
  hashtag: string;
  qrCodeUrl: string;
}

export interface WeddingDetailsResponse {
  success: boolean;
  data?: WeddingDetailsData;
  error?: string;
}
