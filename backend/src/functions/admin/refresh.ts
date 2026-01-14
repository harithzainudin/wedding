import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createResponse, createErrorResponse } from "../shared/response";
import {
  validateRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../shared/auth";

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return createErrorResponse(400, "Missing request body");
  }

  let body: RefreshRequest;
  try {
    body = JSON.parse(event.body) as RefreshRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  if (!body.refreshToken) {
    return createErrorResponse(400, "Refresh token is required");
  }

  const result = validateRefreshToken(body.refreshToken);

  if (!result.authenticated) {
    return createErrorResponse(result.statusCode, result.error);
  }

  const newAccessToken = generateAccessToken(
    result.user.username,
    result.user.isMaster
  );
  const newRefreshToken = generateRefreshToken(
    result.user.username,
    result.user.isMaster
  );

  return createResponse<RefreshResponse>(200, {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  });
};
