export interface AdminLoginRequest {
  username: string
  password: string
}

// User type for multi-tenant support
export type UserType = 'super' | 'wedding' | 'legacy'

// Admin user type for staff/client distinction
export type AdminUserType = 'staff' | 'client'

// Client role labels
export const CLIENT_ROLE_LABELS = ['Bride', 'Groom', 'Parent', 'Other'] as const
export type ClientRoleLabel = (typeof CLIENT_ROLE_LABELS)[number]

// Staff member (for super admin management)
export interface StaffMember {
  username: string
  email?: string
  weddingIds: string[]
  createdAt: string
  createdBy: string
}

export interface ListStaffResponse {
  staff: StaffMember[]
  total: number
  hasMore: boolean
  nextKey?: string | null
}

export interface CreateStaffRequest {
  username: string
  password: string
  email?: string
}

export interface CreateStaffResponse {
  message: string
  staff: {
    username: string
    email?: string
    weddingIds: string[]
    createdAt: string
  }
}

export interface UpdateStaffRequest {
  email?: string
  password?: string
}

export interface UpdateStaffResponse {
  message: string
  username: string
  updated: {
    email?: string | null
    passwordChanged?: boolean
  }
}

export interface DeleteStaffResponse {
  message: string
  username: string
  removedFromWeddings: number
}

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
  // Staff/Client distinction for redirect logic
  adminUserType?: AdminUserType // 'staff' | 'client'
  primaryWeddingSlug?: string // Wedding slug for client redirect
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
  plan?: string
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
  weddingDate?: string
  // Mode 1: Assign existing staff member
  assignStaffUsername?: string
  // Mode 2: Create new client user
  ownerUsername?: string
  ownerPassword?: string
  ownerEmail?: string
  roleLabel?: string // 'Bride', 'Groom', 'Parent', or custom text
}

export interface CreateWeddingResponse {
  wedding: Wedding
  // Owner is optional - when using "No Assignment" mode, super admin manages directly
  owner?: {
    username: string
    email?: string
    temporaryPassword?: string
    mustChangePassword?: boolean
    linked?: boolean // true if existing staff was linked
    userType?: AdminUserType
    roleLabel?: string
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
  // Mode 1: Create new client user
  username?: string
  password?: string
  email?: string
  roleLabel?: string // 'Bride', 'Groom', 'Parent', or custom text
  // Mode 2: Link existing user (staff or client)
  existingUsername?: string
}

export interface AddWeddingOwnerResponse {
  message: string
  admin: {
    username: string
    email?: string
    role: 'owner' | 'coowner'
    userType?: AdminUserType
    roleLabel?: string
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

export interface DeletionPreview {
  weddingId: string
  weddingSlug: string
  displayName: string
  rsvpCount: number
  imageCount: number
  musicCount: number
  giftCount: number
  parkingCount: number
  qrCodeCount: number
  s3ObjectCount: number
}

export interface HardDeleteResponse {
  message: string
  weddingId: string
  deletedAt: string
  deletedBy: string
  counts: {
    settings: number
    admins: number
    rsvps: number
    images: number
    music: number
    gifts: number
    giftReservations: number
    parking: number
    qrCodes: number
    s3Objects: number
  }
}
