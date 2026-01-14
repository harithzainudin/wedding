export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string; // Legacy - for backward compatibility
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  username?: string;
  isMaster?: boolean;
  mustChangePassword?: boolean;
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface AdminUser {
  username: string;
  email?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateAdminRequest {
  username: string;
  password: string;
  email?: string;
  createdBy?: string;
}

export interface CreateAdminResponse {
  success: boolean;
  data?: AdminUser;
  emailSent?: boolean;
  emailError?: string;
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

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AdminProfile {
  username: string;
  email?: string;
  createdAt: string;
  createdBy: string;
}

export interface GetProfileResponse {
  success: boolean;
  data?: AdminProfile;
  error?: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdateEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ForceResetPasswordResponse {
  success: boolean;
  message?: string;
  temporaryPassword?: string;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
}

export interface SetNewPasswordRequest {
  newPassword: string;
}

export interface SetNewPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}
