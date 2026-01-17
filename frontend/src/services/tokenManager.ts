const ACCESS_TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'
const TOKEN_EXPIRY_KEY = 'admin_token_expiry'
const USERNAME_KEY = 'admin_username'
const IS_MASTER_KEY = 'admin_is_master'

// Refresh threshold: refresh when less than 2 minutes remaining
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000

// Track refresh state to prevent concurrent refreshes
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

// Proactive refresh timer
let refreshTimer: ReturnType<typeof setTimeout> | null = null

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface TokenInfo {
  accessToken: string
  refreshToken: string
  expiresIn: number
  username: string
  isMaster: boolean
}

export function storeTokens(info: TokenInfo): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, info.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, info.refreshToken)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + info.expiresIn * 1000))
  localStorage.setItem(USERNAME_KEY, info.username)
  localStorage.setItem(IS_MASTER_KEY, info.isMaster ? 'true' : 'false')

  scheduleProactiveRefresh(info.expiresIn * 1000)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}

export function getStoredIsMaster(): boolean {
  return localStorage.getItem(IS_MASTER_KEY) === 'true'
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(IS_MASTER_KEY)

  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

export function isTokenExpiringSoon(): boolean {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiryStr) return true

  const expiry = parseInt(expiryStr, 10)
  return Date.now() + REFRESH_THRESHOLD_MS >= expiry
}

export function hasValidTokens(): boolean {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  return !!accessToken && !!refreshToken
}

function scheduleProactiveRefresh(expiresInMs: number): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }

  // Schedule refresh 2 minutes before expiry
  const refreshIn = Math.max(expiresInMs - REFRESH_THRESHOLD_MS, 0)

  refreshTimer = setTimeout(() => {
    refreshTokens()
  }, refreshIn)
}

// Response types for refresh endpoint
interface RefreshResponseData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface ApiSuccessResponse {
  success: true
  data: RefreshResponseData
  metadata: { requestId: string; timestamp: string }
}

interface ApiErrorResponse {
  success: false
  error: { message: string; code?: string }
  metadata: { requestId: string; timestamp: string }
}

type RefreshApiResponse = ApiSuccessResponse | ApiErrorResponse

export async function refreshTokens(): Promise<boolean> {
  // Prevent concurrent refresh calls
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return false
  }

  isRefreshing = true

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/admin/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const result = (await response.json()) as RefreshApiResponse

      if (result.success) {
        storeTokens({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          expiresIn: result.data.expiresIn ?? 900,
          username: getStoredUsername() ?? '',
          isMaster: getStoredIsMaster(),
        })
        return true
      }

      return false
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Event to notify components when auth fails
export const AUTH_EXPIRED_EVENT = 'auth:expired'

export function notifyAuthExpired(): void {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}
