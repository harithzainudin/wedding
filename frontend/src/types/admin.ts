export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  username?: string;
  isMaster?: boolean;
  error?: string;
}

export interface AdminUser {
  username: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateAdminRequest {
  username: string;
  password: string;
  createdBy?: string;
}

export interface CreateAdminResponse {
  success: boolean;
  data?: AdminUser;
  error?: string;
}

export interface ListAdminsResponse {
  success: boolean;
  data?: {
    admins: AdminUser[];
    total: number;
  };
  error?: string;
}

export interface DeleteAdminResponse {
  success: boolean;
  message?: string;
  error?: string;
}
