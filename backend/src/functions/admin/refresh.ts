import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import {
  validateRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../shared/auth";
import { logError } from "../shared/logger";

interface RefreshRequest {
  refreshToken: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    if (!event.body) {
      return createErrorResponse(400, "Missing request body", context, "MISSING_BODY");
    }

    let body: RefreshRequest;
    try {
      body = JSON.parse(event.body) as RefreshRequest;
    } catch {
      return createErrorResponse(400, "Invalid JSON body", context, "INVALID_JSON");
    }

    if (!body.refreshToken) {
      return createErrorResponse(400, "Refresh token is required", context, "VALIDATION_ERROR");
    }

    const result = validateRefreshToken(body.refreshToken);

    if (!result.authenticated) {
      return createErrorResponse(result.statusCode, result.error, context, "AUTH_ERROR");
    }

    const newAccessToken = generateAccessToken(
      result.user.username,
      result.user.isMaster
    );
    const newRefreshToken = generateRefreshToken(
      result.user.username,
      result.user.isMaster
    );

    return createSuccessResponse(200, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }, context);
  } catch (error) {
    logError({
      endpoint: "POST /admin/refresh",
      operation: "refreshToken",
      requestId: context.awsRequestId,
    }, error);
    return createErrorResponse(500, "Internal server error", context, "INTERNAL_ERROR");
  }
};
