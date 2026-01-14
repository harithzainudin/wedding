export interface AdminLoginRequest {
  username: string;
  password: string;
}

// Response data from login endpoint (unwrapped from API response)
export interface AdminLoginResponse {
  token?: string; // Legacy - for backward compatibility
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  username: string;
  isMaster: boolean;
  mustChangePassword?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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

// Response data from create admin endpoint (unwrapped)
export interface CreateAdminResponse {
  admin: AdminUser;
  emailSent?: boolean;
  emailError?: string;
}

// Response data from list admins endpoint (unwrapped)
export interface ListAdminsResponse {
  admins: AdminUser[];
  total: number;
}

// Response data from delete admin endpoint (unwrapped)
export interface DeleteAdminResponse {
  message: string;
}

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

// Response data from change password endpoint (unwrapped)
export interface ChangePasswordResponse {
  message: string;
}

export interface AdminProfile {
  username: string;
  email?: string;
  createdAt: string;
  createdBy: string;
}

// Response data from get profile endpoint (unwrapped)
export interface GetProfileResponse {
  username: string;
  email?: string;
  createdAt: string;
  createdBy: string;
}

export interface UpdateEmailRequest {
  email: string;
}

// Response data from update email endpoint (unwrapped)
export interface UpdateEmailResponse {
  message: string;
}

// Response data from force reset password endpoint (unwrapped)
export interface ForceResetPasswordResponse {
  message: string;
  temporaryPassword?: string;
  emailSent?: boolean;
  emailError?: string;
}

export interface SetNewPasswordRequest {
  newPassword: string;
}

// Response data from set new password endpoint (unwrapped)
export interface SetNewPasswordResponse {
  message: string;
}
