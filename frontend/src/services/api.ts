import type { RsvpFormData, RsvpApiResponse, RsvpListResponse } from "@/types/rsvp";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  CreateAdminRequest,
  CreateAdminResponse,
  ListAdminsResponse,
  DeleteAdminResponse,
} from "@/types/admin";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as CreateAdminResponse;
  return result;
}

export async function listAdminUsers(): Promise<ListAdminsResponse> {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as ListAdminsResponse;
  return result;
}

export async function deleteAdminUser(username: string): Promise<DeleteAdminResponse> {
  const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as DeleteAdminResponse;
  return result;
}
