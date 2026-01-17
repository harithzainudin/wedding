export interface AdminLoginRequest {
  username: string
  password: string
}

// User type for multi-tenant support
export type UserType = 'super' | 'wedding' | 'legacy'

// Response data from login endpoint (unwrapped from API response)
export interface AdminLoginResponse {
  token?: string // Legacy - for backward compatibility
  accessToken: string
  refreshToken: string
  expiresIn: number
  username: string
  isMaster: boolean
  mustChangePassword?: boolean
  // Multi-tenant fields
  userType: UserType
  weddingIds?: string[] // Wedding IDs the user has access to
  primaryWeddingId?: string // Primary wedding for wedding admins
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AdminUser {
  username: string
  email?: string
  createdAt: string
  createdBy: string
}

export interface CreateAdminRequest {
  username: string
  password: string
  email?: string
  createdBy?: string
}

// Response data from create admin endpoint (unwrapped)
export interface CreateAdminResponse {
  admin: AdminUser
  emailSent?: boolean
  emailError?: string
}

// Response data from list admins endpoint (unwrapped)
export interface ListAdminsResponse {
  admins: AdminUser[]
  total: number
}

// Response data from delete admin endpoint (unwrapped)
export interface DeleteAdminResponse {
  message: string
}

export interface ChangePasswordRequest {
  username: string
  currentPassword: string
  newPassword: string
}

// Response data from change password endpoint (unwrapped)
export interface ChangePasswordResponse {
  message: string
}

export interface AdminProfile {
  username: string
  email?: string
  createdAt: string
  createdBy: string
}

// Response data from get profile endpoint (unwrapped)
export interface GetProfileResponse {
  username: string
  email?: string
  createdAt: string
  createdBy: string
}

export interface UpdateEmailRequest {
  email: string
}

// Response data from update email endpoint (unwrapped)
export interface UpdateEmailResponse {
  message: string
}

// Response data from force reset password endpoint (unwrapped)
export interface ForceResetPasswordResponse {
  message: string
  temporaryPassword?: string
  emailSent?: boolean
  emailError?: string
}

export interface SetNewPasswordRequest {
  newPassword: string
}

// Response data from set new password endpoint (unwrapped)
export interface SetNewPasswordResponse {
  message: string
}

// ============================================
// Super Admin Types
// ============================================

export type WeddingStatus = 'active' | 'archived' | 'draft'

export interface Wedding {
  weddingId: string
  slug: string
  displayName: string
  status: WeddingStatus
  ownerUsername?: string
  ownerEmail?: string
  weddingDate?: string
  createdAt: string
  updatedAt?: string
}

export interface ListWeddingsResponse {
  weddings: Wedding[]
  total: number
}

export interface CreateWeddingRequest {
  slug: string
  displayName: string
  ownerUsername: string
  ownerPassword: string
  ownerEmail?: string
  weddingDate?: string
}

export interface CreateWeddingResponse {
  wedding: Wedding
  owner: {
    username: string
    temporaryPassword?: string
    emailSent?: boolean
  }
}

export interface UpdateWeddingRequest {
  displayName?: string
  status?: WeddingStatus
  weddingDate?: string
}

export interface UpdateWeddingResponse {
  wedding: Wedding
}

export interface AddWeddingOwnerRequest {
  username: string
  password: string
  email?: string
}

export interface AddWeddingOwnerResponse {
  message: string
  admin: {
    username: string
    email?: string
    role: 'owner' | 'coowner'
    mustChangePassword?: boolean
  }
  weddingId: string
}

export interface UpdateWeddingOwnerRequest {
  email?: string
  role?: 'owner' | 'coowner'
}

export interface UpdateWeddingOwnerResponse {
  message: string
  username: string
  weddingId: string
  email?: string | null
  role?: 'owner' | 'coowner'
  updatedAt: string
}

export interface RemoveWeddingOwnerResponse {
  message: string
  username: string
  weddingId: string
  remainingWeddings: string[]
}

export interface ResetOwnerPasswordResponse {
  message: string
  username: string
  temporaryPassword: string
  mustChangePassword: boolean
  resetAt: string
  resetBy: string
}

export interface WeddingDetailResponse {
  wedding: Wedding
  admins: WeddingAdmin[]
  publicUrl: string
  adminUrl: string
}

export interface WeddingAdmin {
  username: string
  email?: string
  role: 'owner' | 'coowner'
  addedAt: string
  addedBy: string
}
