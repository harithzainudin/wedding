import { createHmac } from "crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { Resource } from "sst";

const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type TokenType = "access" | "refresh";

interface TokenPayload {
  username: string;
  isMaster: boolean;
  issuedAt: number;
  tokenType?: TokenType; // Optional for backward compatibility
}

interface AuthSuccess {
  authenticated: true;
  user: TokenPayload;
}

interface AuthFailure {
  authenticated: false;
  statusCode: number;
  error: string;
}

export type AuthResult = AuthSuccess | AuthFailure;

function getSecret(): string {
  return Resource.TokenSecret.value;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function generateToken(username: string, isMaster: boolean): string {
  const payload: TokenPayload = {
    username,
    isMaster,
    issuedAt: Date.now(),
    tokenType: "access",
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function generateAccessToken(
  username: string,
  isMaster: boolean,
): string {
  const payload: TokenPayload = {
    username,
    isMaster,
    issuedAt: Date.now(),
    tokenType: "access",
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function generateRefreshToken(
  username: string,
  isMaster: boolean,
): string {
  const payload: TokenPayload = {
    username,
    isMaster,
    issuedAt: Date.now(),
    tokenType: "refresh",
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function validateToken(
  token: string,
  expectedType: TokenType = "access",
): AuthResult {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Invalid token format",
    };
  }

  const payloadStr = parts[0] as string;
  const providedSignature = parts[1] as string;
  const expectedSignature = sign(payloadStr);

  if (providedSignature !== expectedSignature) {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Invalid token signature",
    };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString());
  } catch {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Invalid token payload",
    };
  }

  // For backward compatibility, treat tokens without tokenType as access tokens
  const tokenType = payload.tokenType ?? "access";

  // Check token type matches expected
  if (tokenType !== expectedType) {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Invalid token type",
    };
  }

  // Check expiration based on token type
  const expiryMs =
    tokenType === "refresh" ? REFRESH_TOKEN_EXPIRY_MS : ACCESS_TOKEN_EXPIRY_MS;
  if (Date.now() - payload.issuedAt > expiryMs) {
    return { authenticated: false, statusCode: 401, error: "Token expired" };
  }

  return { authenticated: true, user: payload };
}

export function validateRefreshToken(token: string): AuthResult {
  return validateToken(token, "refresh");
}

function extractToken(event: APIGatewayProxyEventV2): string | null {
  const authHeader =
    event.headers["authorization"] ?? event.headers["Authorization"];
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return authHeader;
}

export function requireAuth(event: APIGatewayProxyEventV2): AuthResult {
  const token = extractToken(event);
  if (!token) {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Missing authorization header",
    };
  }
  return validateToken(token);
}

export function requireMaster(event: APIGatewayProxyEventV2): AuthResult {
  const result = requireAuth(event);
  if (!result.authenticated) {
    return result;
  }

  if (!result.user.isMaster) {
    return {
      authenticated: false,
      statusCode: 403,
      error: "Master access required",
    };
  }

  return result;
}
