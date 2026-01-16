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
  source?: "public" | "admin";
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
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

// Admin RSVP request (create/update)
export interface AdminRsvpRequest {
  title?: HonorificTitle | "";
  fullName: string;
  isAttending: boolean;
  numberOfGuests: number;
  phoneNumber?: string;
  message?: string;
}

// Response from admin create RSVP
export interface CreateRsvpResponse {
  id: string;
  submittedAt: string;
}

// Response from admin update RSVP
export interface UpdateRsvpResponse {
  id: string;
  updatedAt: string;
}

// Response from admin delete RSVP
export interface DeleteRsvpResponse {
  message: string;
}
