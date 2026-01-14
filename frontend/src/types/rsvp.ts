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

// Response data from RSVP submit endpoint (unwrapped)
export interface RsvpApiResponse {
  message: string;
  id: string;
  submittedAt: string;
}

// Response data from RSVP list endpoint (unwrapped)
export interface RsvpListResponse {
  rsvps: RsvpSubmission[];
  summary: {
    total: number;
    attending: number;
    notAttending: number;
    totalGuests: number;
  };
}
