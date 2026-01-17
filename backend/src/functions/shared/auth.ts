import { createHmac } from 'crypto'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { Resource } from 'sst'

const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type TokenType = 'access' | 'refresh'

/**
 * User types in the multi-tenant system
 */
export type UserType = 'super' | 'wedding' | 'legacy'

/**
 * Legacy token payload (for backward compatibility during migration)
 */
interface LegacyTokenPayload {
  username: string
  isMaster: boolean
  issuedAt: number
  tokenType?: TokenType
  // No 'type' field - this is how we identify legacy tokens
}

/**
 * Super admin token payload
 */
interface SuperAdminTokenPayload {
  sub: string // username
  type: 'super'
  issuedAt: number
  tokenType: TokenType
}

/**
 * Wedding admin/owner token payload
 */
interface WeddingAdminTokenPayload {
  sub: string // username
  type: 'wedding'
  weddingIds: string[] // List of wedding IDs this user can access
  primaryWeddingId: string // Currently active wedding context
  issuedAt: number
  tokenType: TokenType
}

/**
 * Raw token payload as parsed from JWT
 */
type RawTokenPayload = LegacyTokenPayload | SuperAdminTokenPayload | WeddingAdminTokenPayload

/**
 * Normalized user info returned from auth checks
 */
export interface AuthenticatedUser {
  username: string
  type: UserType
  weddingIds: string[] // Empty for super admins and legacy
  primaryWeddingId: string | null // Null for super admins and legacy
  isMaster: boolean // For legacy compatibility
}

interface AuthSuccess {
  authenticated: true
  user: AuthenticatedUser
}

interface AuthFailure {
  authenticated: false
  statusCode: number
  error: string
}

export type AuthResult = AuthSuccess | AuthFailure

function getSecret(): string {
  return Resource.TokenSecret.value
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

/**
 * Helper to detect token type from raw payload
 */
function isLegacyPayload(payload: RawTokenPayload): payload is LegacyTokenPayload {
  return !('type' in payload) || payload.type === undefined
}

function isSuperAdminPayload(payload: RawTokenPayload): payload is SuperAdminTokenPayload {
  return 'type' in payload && payload.type === 'super'
}

function isWeddingAdminPayload(payload: RawTokenPayload): payload is WeddingAdminTokenPayload {
  return 'type' in payload && payload.type === 'wedding'
}

/**
 * Normalize raw token payload into AuthenticatedUser
 */
function normalizePayload(payload: RawTokenPayload): AuthenticatedUser {
  if (isLegacyPayload(payload)) {
    return {
      username: payload.username,
      type: 'legacy',
      weddingIds: [],
      primaryWeddingId: null,
      isMaster: payload.isMaster,
    }
  }

  if (isSuperAdminPayload(payload)) {
    return {
      username: payload.sub,
      type: 'super',
      weddingIds: [],
      primaryWeddingId: null,
      isMaster: true, // Super admins have master-level access
    }
  }

  if (isWeddingAdminPayload(payload)) {
    return {
      username: payload.sub,
      type: 'wedding',
      weddingIds: payload.weddingIds,
      primaryWeddingId: payload.primaryWeddingId,
      isMaster: false,
    }
  }

  // Fallback (should never happen)
  throw new Error('Unknown token payload type')
}

// ============================================
// LEGACY TOKEN FUNCTIONS (for backward compatibility)
// ============================================

/**
 * @deprecated Use generateSuperAdminTokens or generateWeddingAdminTokens instead
 */
export function generateToken(username: string, isMaster: boolean): string {
  const payload: LegacyTokenPayload = {
    username,
    isMaster,
    issuedAt: Date.now(),
    tokenType: 'access',
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(payloadStr)
  return `${payloadStr}.${signature}`
}

/**
 * @deprecated Use generateSuperAdminTokens or generateWeddingAdminTokens instead
 */
export function generateAccessToken(username: string, isMaster: boolean): string {
  return generateToken(username, isMaster)
}

/**
 * @deprecated Use generateSuperAdminTokens or generateWeddingAdminTokens instead
 */
export function generateRefreshToken(username: string, isMaster: boolean): string {
  const payload: LegacyTokenPayload = {
    username,
    isMaster,
    issuedAt: Date.now(),
    tokenType: 'refresh',
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(payloadStr)
  return `${payloadStr}.${signature}`
}

// ============================================
// MULTI-TENANT TOKEN FUNCTIONS
// ============================================

/**
 * Generate tokens for a super admin user
 */
export function generateSuperAdminTokens(username: string): {
  accessToken: string
  refreshToken: string
  expiresIn: number
} {
  const accessPayload: SuperAdminTokenPayload = {
    sub: username.toLowerCase(),
    type: 'super',
    issuedAt: Date.now(),
    tokenType: 'access',
  }

  const refreshPayload: SuperAdminTokenPayload = {
    sub: username.toLowerCase(),
    type: 'super',
    issuedAt: Date.now(),
    tokenType: 'refresh',
  }

  const accessPayloadStr = Buffer.from(JSON.stringify(accessPayload)).toString('base64url')
  const refreshPayloadStr = Buffer.from(JSON.stringify(refreshPayload)).toString('base64url')

  return {
    accessToken: `${accessPayloadStr}.${sign(accessPayloadStr)}`,
    refreshToken: `${refreshPayloadStr}.${sign(refreshPayloadStr)}`,
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000), // seconds
  }
}

/**
 * Generate tokens for a wedding admin/owner
 */
export function generateWeddingAdminTokens(
  username: string,
  weddingIds: string[],
  primaryWeddingId: string
): {
  accessToken: string
  refreshToken: string
  expiresIn: number
} {
  const accessPayload: WeddingAdminTokenPayload = {
    sub: username.toLowerCase(),
    type: 'wedding',
    weddingIds,
    primaryWeddingId,
    issuedAt: Date.now(),
    tokenType: 'access',
  }

  const refreshPayload: WeddingAdminTokenPayload = {
    sub: username.toLowerCase(),
    type: 'wedding',
    weddingIds,
    primaryWeddingId,
    issuedAt: Date.now(),
    tokenType: 'refresh',
  }

  const accessPayloadStr = Buffer.from(JSON.stringify(accessPayload)).toString('base64url')
  const refreshPayloadStr = Buffer.from(JSON.stringify(refreshPayload)).toString('base64url')

  return {
    accessToken: `${accessPayloadStr}.${sign(accessPayloadStr)}`,
    refreshToken: `${refreshPayloadStr}.${sign(refreshPayloadStr)}`,
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000), // seconds
  }
}

// ============================================
// TOKEN VALIDATION
// ============================================

export function validateToken(token: string, expectedType: TokenType = 'access'): AuthResult {
  const parts = token.split('.')
  if (parts.length !== 2) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Invalid token format',
    }
  }

  const payloadStr = parts[0]!
  const providedSignature = parts[1]!
  const expectedSignature = sign(payloadStr)

  if (providedSignature !== expectedSignature) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Invalid token signature',
    }
  }

  let payload: RawTokenPayload
  try {
    payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString())
  } catch {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Invalid token payload',
    }
  }

  // For backward compatibility, treat tokens without tokenType as access tokens
  const tokenType = payload.tokenType ?? 'access'

  // Check token type matches expected
  if (tokenType !== expectedType) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Invalid token type',
    }
  }

  // Check expiration based on token type
  const expiryMs = tokenType === 'refresh' ? REFRESH_TOKEN_EXPIRY_MS : ACCESS_TOKEN_EXPIRY_MS
  if (Date.now() - payload.issuedAt > expiryMs) {
    return { authenticated: false, statusCode: 401, error: 'Token expired' }
  }

  // Normalize payload to AuthenticatedUser
  const user = normalizePayload(payload)

  return { authenticated: true, user }
}

export function validateRefreshToken(token: string): AuthResult {
  return validateToken(token, 'refresh')
}

// ============================================
// AUTH MIDDLEWARE FUNCTIONS
// ============================================

function extractToken(event: APIGatewayProxyEventV2): string | null {
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization']
  if (!authHeader) return null

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return authHeader
}

/**
 * Basic auth check - validates token and returns user info
 */
export function requireAuth(event: APIGatewayProxyEventV2): AuthResult {
  const token = extractToken(event)
  if (!token) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Missing authorization header',
    }
  }
  return validateToken(token)
}

/**
 * @deprecated Use requireSuperAdmin instead
 * Require master access (legacy)
 */
export function requireMaster(event: APIGatewayProxyEventV2): AuthResult {
  const result = requireAuth(event)
  if (!result.authenticated) {
    return result
  }

  if (!result.user.isMaster) {
    return {
      authenticated: false,
      statusCode: 403,
      error: 'Master access required',
    }
  }

  return result
}

/**
 * Require super admin access
 * Only super admins can access platform-wide resources
 */
export function requireSuperAdmin(event: APIGatewayProxyEventV2): AuthResult {
  const result = requireAuth(event)
  if (!result.authenticated) {
    return result
  }

  // Super admins have type 'super', legacy masters also have access
  if (result.user.type !== 'super' && !result.user.isMaster) {
    return {
      authenticated: false,
      statusCode: 403,
      error: 'Super admin access required',
    }
  }

  return result
}

/**
 * CRITICAL: Require access to a specific wedding
 *
 * This function MUST be called on every wedding-scoped admin endpoint
 * to ensure users can only access their own weddings.
 *
 * @param event - API Gateway event
 * @param weddingId - The wedding ID being accessed
 * @returns AuthResult with user info or error
 */
export function requireWeddingAccess(event: APIGatewayProxyEventV2, weddingId: string): AuthResult {
  const result = requireAuth(event)
  if (!result.authenticated) {
    return result
  }

  // Super admins and legacy masters can access any wedding
  if (result.user.type === 'super' || result.user.isMaster) {
    return result
  }

  // Wedding admins can only access their assigned weddings
  if (result.user.type === 'wedding') {
    const hasAccess = result.user.weddingIds.includes(weddingId)
    if (!hasAccess) {
      return {
        authenticated: false,
        statusCode: 403,
        error: 'Access denied: You do not have permission for this wedding',
      }
    }
    return result
  }

  // Legacy users without master access cannot access wedding-scoped endpoints
  return {
    authenticated: false,
    statusCode: 403,
    error: 'Wedding access required',
  }
}

/**
 * Check if a user can access a specific wedding (without failing)
 * Useful for conditional logic rather than hard authorization
 */
export function canAccessWedding(user: AuthenticatedUser, weddingId: string): boolean {
  if (user.type === 'super' || user.isMaster) {
    return true
  }

  if (user.type === 'wedding') {
    return user.weddingIds.includes(weddingId)
  }

  return false
}
