import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { generateAccessToken, generateRefreshToken } from "../shared/auth";
import { logError } from "../shared/logger";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface LoginRequest {
  username: string;
  password: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let username: string | undefined;

  try {
    if (!event.body) {
      return createErrorResponse(400, "Missing request body", context, "MISSING_BODY");
    }

    let body: LoginRequest;
    try {
      body = JSON.parse(event.body) as LoginRequest;
    } catch {
      return createErrorResponse(400, "Invalid JSON body", context, "INVALID_JSON");
    }

    if (!body.username || !body.password) {
      return createErrorResponse(400, "Username and password are required", context, "VALIDATION_ERROR");
    }

    username = body.username.trim().toLowerCase();

    // Check if using master password (for initial setup)
    const masterPassword = Resource.AdminPassword.value;
    if (username === "master" && body.password === masterPassword) {
      const accessToken = generateAccessToken("master", true);
      const refreshToken = generateRefreshToken("master", true);
      return createSuccessResponse(200, {
        token: accessToken, // Legacy - for backward compatibility
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        username: "master",
        isMaster: true,
      }, context);
    }

    // Look up user in DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `ADMIN#${username}`,
          sk: "PROFILE",
        },
      })
    );

    if (!result.Item) {
      return createErrorResponse(401, "Invalid username or password", context, "AUTH_ERROR");
    }

    // Verify password
    const passwordHash = result.Item.passwordHash as string;
    const isValidPassword = await bcrypt.compare(body.password, passwordHash);

    if (!isValidPassword) {
      return createErrorResponse(401, "Invalid username or password", context, "AUTH_ERROR");
    }

    // Generate tokens
    const accessToken = generateAccessToken(username, false);
    const refreshToken = generateRefreshToken(username, false);

    // Check if user must change password
    const mustChangePassword = result.Item.mustChangePassword === true;

    return createSuccessResponse(200, {
      token: accessToken, // Legacy - for backward compatibility
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      username,
      isMaster: false,
      ...(mustChangePassword && { mustChangePassword: true }),
    }, context);
  } catch (error) {
    logError({
      endpoint: "POST /admin/login",
      operation: "authenticate",
      requestId: context.awsRequestId,
      input: { username },
    }, error);
    return createErrorResponse(500, "Internal server error", context, "INTERNAL_ERROR");
  }
};
