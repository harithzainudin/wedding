import type { HonorificTitle } from "./index";

export interface RsvpFormData {
  title: HonorificTitle;
  fullName: string;
  isAttending: boolean;
  numberOfGuests: number;
  phoneNumber: string;
  message: string;
}

export interface RsvpSubmission extends RsvpFormData {
  id: string;
  submittedAt: string;
}

export interface RsvpApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: string;
    submittedAt: string;
  };
}

export interface RsvpListResponse {
  success: boolean;
  data?: {
    rsvps: RsvpSubmission[];
    summary: {
      total: number;
      attending: number;
      notAttending: number;
      totalGuests: number;
    };
  };
  error?: string;
}
