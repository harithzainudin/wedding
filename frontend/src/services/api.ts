import type { RsvpFormData, RsvpApiResponse, RsvpListResponse } from "@/types/rsvp";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  CreateAdminRequest,
  CreateAdminResponse,
  ListAdminsResponse,
  DeleteAdminResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@/types/admin";
import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  ListImagesResponse,
  ReorderImagesRequest,
  DeleteImageResponse,
  UpdateSettingsRequest,
  SettingsResponse,
} from "@/types/gallery";
import type { VenueResponse, VenueUpdateRequest } from "@/types/venue";
import type { WeddingDetailsResponse, WeddingDetailsUpdateRequest } from "@/types/weddingDetails";
import type { ScheduleResponse, ScheduleUpdateRequest } from "@/types/schedule";
import type { ContactsResponse, ContactsUpdateRequest } from "@/types/contacts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function submitRsvp(data: RsvpFormData): Promise<RsvpApiResponse> {
  const response = await fetch(`${API_URL}/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as RsvpApiResponse;
  return result;
}

export async function listRsvps(status?: "attending" | "not_attending"): Promise<RsvpListResponse> {
  const url = new URL(`${API_URL}/rsvp`);
  if (status) {
    url.searchParams.set("status", status);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const result = (await response.json()) as RsvpListResponse;
  return result;
}

export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as AdminLoginResponse;
  return result;
}

export async function createAdminUser(data: CreateAdminRequest): Promise<CreateAdminResponse> {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as CreateAdminResponse;
  return result;
}

export async function listAdminUsers(): Promise<ListAdminsResponse> {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const result = (await response.json()) as ListAdminsResponse;
  return result;
}

export async function deleteAdminUser(username: string): Promise<DeleteAdminResponse> {
  const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const result = (await response.json()) as DeleteAdminResponse;
  return result;
}

export async function changeAdminPassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const response = await fetch(`${API_URL}/admin/users/password`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as ChangePasswordResponse;
  return result;
}

// Gallery API functions

export async function listGalleryImages(): Promise<ListImagesResponse> {
  const response = await fetch(`${API_URL}/images`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const result = (await response.json()) as ListImagesResponse;
  return result;
}

export async function getPresignedUrl(data: PresignedUrlRequest): Promise<PresignedUrlResponse> {
  const response = await fetch(`${API_URL}/images/presigned-url`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as PresignedUrlResponse;
  return result;
}

export async function uploadToS3(presignedUrl: string, file: File): Promise<boolean> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
  return response.ok;
}

export async function confirmImageUpload(data: ConfirmUploadRequest): Promise<ConfirmUploadResponse> {
  const response = await fetch(`${API_URL}/images/confirm`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as ConfirmUploadResponse;
  return result;
}

export async function deleteGalleryImage(imageId: string): Promise<DeleteImageResponse> {
  const response = await fetch(`${API_URL}/images/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const result = (await response.json()) as DeleteImageResponse;
  return result;
}

export async function reorderGalleryImages(data: ReorderImagesRequest): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/images/reorder`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as { success: boolean; error?: string };
  return result;
}

export async function getGallerySettings(): Promise<SettingsResponse> {
  const response = await fetch(`${API_URL}/images/settings`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const result = (await response.json()) as SettingsResponse;
  return result;
}

export async function updateGallerySettings(data: UpdateSettingsRequest): Promise<SettingsResponse> {
  const response = await fetch(`${API_URL}/images/settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as SettingsResponse;
  return result;
}

// Venue API functions

export async function getVenue(): Promise<VenueResponse> {
  const response = await fetch(`${API_URL}/venue`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as VenueResponse;
  return result;
}

export async function updateVenue(data: VenueUpdateRequest): Promise<VenueResponse> {
  const response = await fetch(`${API_URL}/venue`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as VenueResponse;
  return result;
}

// Wedding Details API functions

export async function getWeddingDetails(): Promise<WeddingDetailsResponse> {
  const response = await fetch(`${API_URL}/wedding-details`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as WeddingDetailsResponse;
  return result;
}

export async function updateWeddingDetails(data: WeddingDetailsUpdateRequest): Promise<WeddingDetailsResponse> {
  const response = await fetch(`${API_URL}/wedding-details`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as WeddingDetailsResponse;
  return result;
}

// Schedule API functions

export async function getSchedule(): Promise<ScheduleResponse> {
  const response = await fetch(`${API_URL}/schedule`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as ScheduleResponse;
  return result;
}

export async function updateSchedule(data: ScheduleUpdateRequest): Promise<ScheduleResponse> {
  const response = await fetch(`${API_URL}/schedule`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as ScheduleResponse;
  return result;
}

// Contacts API functions

export async function getContacts(): Promise<ContactsResponse> {
  const response = await fetch(`${API_URL}/contacts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as ContactsResponse;
  return result;
}

export async function updateContacts(data: ContactsUpdateRequest): Promise<ContactsResponse> {
  const response = await fetch(`${API_URL}/contacts`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as ContactsResponse;
  return result;
}
