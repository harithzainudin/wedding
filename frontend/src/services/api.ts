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
  GetProfileResponse,
  UpdateEmailRequest,
  UpdateEmailResponse,
  ForceResetPasswordResponse,
  SetNewPasswordRequest,
  SetNewPasswordResponse,
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
import type {
  MusicResponse,
  MusicSettingsUpdateRequest,
  MusicSettingsUpdateResponse,
  MusicPresignedUrlRequest,
  MusicPresignedUrlResponse,
  MusicConfirmRequest,
  MusicConfirmResponse,
  MusicDeleteResponse,
  MusicReorderRequest,
  MusicReorderResponse,
} from "@/types/music";
import {
  getAccessToken,
  refreshTokens,
  isTokenExpiringSoon,
  notifyAuthExpired,
} from "./tokenManager";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// API Response wrapper types for standardized backend format
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  metadata: {
    requestId: string;
    timestamp: string;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
  metadata: {
    requestId: string;
    timestamp: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Unwraps the standardized API response format
 * Returns the data on success, throws an error on failure
 */
function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error.message);
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Proactively refresh if token is expiring soon
  if (isTokenExpiringSoon()) {
    await refreshTokens();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  // If 401, try to refresh and retry once
  if (response.status === 401) {
    const refreshSuccess = await refreshTokens();

    if (refreshSuccess) {
      // Retry with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers as Record<string, string> ?? {}),
        },
      });
      const retryJson = (await retryResponse.json()) as ApiResponse<T>;
      return unwrapResponse(retryJson);
    }

    // Refresh failed - notify app to redirect to login
    notifyAuthExpired();
  }

  const json = (await response.json()) as ApiResponse<T>;
  return unwrapResponse(json);
}

export async function submitRsvp(data: RsvpFormData): Promise<RsvpApiResponse> {
  const response = await fetch(`${API_URL}/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = (await response.json()) as ApiResponse<RsvpApiResponse>;
  return unwrapResponse(json);
}

export async function listRsvps(status?: "attending" | "not_attending"): Promise<RsvpListResponse> {
  const url = new URL(`${API_URL}/rsvp`);
  if (status) {
    url.searchParams.set("status", status);
  }

  return authenticatedFetch<RsvpListResponse>(url.toString(), {
    method: "GET",
  });
}

export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = (await response.json()) as ApiResponse<AdminLoginResponse>;
  return unwrapResponse(json);
}

export async function createAdminUser(data: CreateAdminRequest): Promise<CreateAdminResponse> {
  return authenticatedFetch<CreateAdminResponse>(`${API_URL}/admin/users`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listAdminUsers(): Promise<ListAdminsResponse> {
  return authenticatedFetch<ListAdminsResponse>(`${API_URL}/admin/users`, {
    method: "GET",
  });
}

export async function deleteAdminUser(username: string): Promise<DeleteAdminResponse> {
  return authenticatedFetch<DeleteAdminResponse>(
    `${API_URL}/admin/users/${encodeURIComponent(username)}`,
    { method: "DELETE" }
  );
}

export async function changeAdminPassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return authenticatedFetch<ChangePasswordResponse>(`${API_URL}/admin/users/password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getAdminProfile(): Promise<GetProfileResponse> {
  return authenticatedFetch<GetProfileResponse>(`${API_URL}/admin/users/me`, {
    method: "GET",
  });
}

export async function updateAdminEmail(data: UpdateEmailRequest): Promise<UpdateEmailResponse> {
  return authenticatedFetch<UpdateEmailResponse>(`${API_URL}/admin/users/me/email`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function forceResetPassword(username: string): Promise<ForceResetPasswordResponse> {
  return authenticatedFetch<ForceResetPasswordResponse>(
    `${API_URL}/admin/users/${encodeURIComponent(username)}/reset-password`,
    { method: "PUT" }
  );
}

export async function setNewPassword(data: SetNewPasswordRequest): Promise<SetNewPasswordResponse> {
  return authenticatedFetch<SetNewPasswordResponse>(`${API_URL}/admin/users/set-password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Gallery API functions

export async function listGalleryImages(): Promise<ListImagesResponse> {
  return authenticatedFetch<ListImagesResponse>(`${API_URL}/images`, {
    method: "GET",
  });
}

export async function getPresignedUrl(data: PresignedUrlRequest): Promise<PresignedUrlResponse> {
  return authenticatedFetch<PresignedUrlResponse>(`${API_URL}/images/presigned-url`, {
    method: "POST",
    body: JSON.stringify(data),
  });
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
  return authenticatedFetch<ConfirmUploadResponse>(`${API_URL}/images/confirm`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteGalleryImage(imageId: string): Promise<DeleteImageResponse> {
  return authenticatedFetch<DeleteImageResponse>(
    `${API_URL}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" }
  );
}

export async function reorderGalleryImages(data: ReorderImagesRequest): Promise<{ success: boolean; error?: string }> {
  return authenticatedFetch<{ success: boolean; error?: string }>(`${API_URL}/images/reorder`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getGallerySettings(): Promise<SettingsResponse> {
  return authenticatedFetch<SettingsResponse>(`${API_URL}/images/settings`, {
    method: "GET",
  });
}

export async function updateGallerySettings(data: UpdateSettingsRequest): Promise<SettingsResponse> {
  return authenticatedFetch<SettingsResponse>(`${API_URL}/images/settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Venue API functions

export async function getVenue(): Promise<VenueResponse> {
  const response = await fetch(`${API_URL}/venue`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await response.json()) as ApiResponse<VenueResponse>;
  return unwrapResponse(json);
}

export async function updateVenue(data: VenueUpdateRequest): Promise<VenueResponse> {
  return authenticatedFetch<VenueResponse>(`${API_URL}/venue`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Wedding Details API functions

export async function getWeddingDetails(): Promise<WeddingDetailsResponse> {
  const response = await fetch(`${API_URL}/wedding-details`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await response.json()) as ApiResponse<WeddingDetailsResponse>;
  return unwrapResponse(json);
}

export async function updateWeddingDetails(data: WeddingDetailsUpdateRequest): Promise<WeddingDetailsResponse> {
  return authenticatedFetch<WeddingDetailsResponse>(`${API_URL}/wedding-details`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Schedule API functions

export async function getSchedule(): Promise<ScheduleResponse> {
  const response = await fetch(`${API_URL}/schedule`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await response.json()) as ApiResponse<ScheduleResponse>;
  return unwrapResponse(json);
}

export async function updateSchedule(data: ScheduleUpdateRequest): Promise<ScheduleResponse> {
  return authenticatedFetch<ScheduleResponse>(`${API_URL}/schedule`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Contacts API functions

export async function getContacts(): Promise<ContactsResponse> {
  const response = await fetch(`${API_URL}/contacts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await response.json()) as ApiResponse<ContactsResponse>;
  return unwrapResponse(json);
}

export async function updateContacts(data: ContactsUpdateRequest): Promise<ContactsResponse> {
  return authenticatedFetch<ContactsResponse>(`${API_URL}/contacts`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Music API functions

export async function getMusic(): Promise<MusicResponse> {
  const response = await fetch(`${API_URL}/music`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = (await response.json()) as ApiResponse<MusicResponse>;
  return unwrapResponse(json);
}

export async function updateMusicSettings(data: MusicSettingsUpdateRequest): Promise<MusicSettingsUpdateResponse> {
  return authenticatedFetch<MusicSettingsUpdateResponse>(`${API_URL}/music/settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getMusicPresignedUrl(data: MusicPresignedUrlRequest): Promise<MusicPresignedUrlResponse> {
  return authenticatedFetch<MusicPresignedUrlResponse>(`${API_URL}/music/upload-url`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadMusicToS3(presignedUrl: string, file: File): Promise<boolean> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
  return response.ok;
}

export async function confirmMusicUpload(data: MusicConfirmRequest): Promise<MusicConfirmResponse> {
  return authenticatedFetch<MusicConfirmResponse>(`${API_URL}/music/confirm`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteMusicTrack(trackId: string): Promise<MusicDeleteResponse> {
  return authenticatedFetch<MusicDeleteResponse>(
    `${API_URL}/music/${encodeURIComponent(trackId)}`,
    { method: "DELETE" }
  );
}

export async function reorderMusicTracks(data: MusicReorderRequest): Promise<MusicReorderResponse> {
  return authenticatedFetch<MusicReorderResponse>(`${API_URL}/music/reorder`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
