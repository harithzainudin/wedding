import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createResponse, createErrorResponse } from "../shared/response";
import { generateAccessToken, generateRefreshToken } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string; // Legacy - keep for backward compatibility
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  username?: string;
  isMaster?: boolean;
  mustChangePassword?: boolean;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return createErrorResponse(400, "Missing request body");
  }

  let body: LoginRequest;
  try {
    body = JSON.parse(event.body) as LoginRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  if (!body.username || !body.password) {
    return createErrorResponse(400, "Username and password are required");
  }

  const username = body.username.trim().toLowerCase();

  // Check if using master password (for initial setup)
  const masterPassword = Resource.AdminPassword.value;
  if (username === "master" && body.password === masterPassword) {
    const accessToken = generateAccessToken("master", true);
    const refreshToken = generateRefreshToken("master", true);
    return createResponse<LoginResponse>(200, {
      success: true,
      token: accessToken, // Legacy - for backward compatibility
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      username: "master",
      isMaster: true,
    });
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
    return createErrorResponse(401, "Invalid username or password");
  }

  // Verify password
  const passwordHash = result.Item.passwordHash as string;
  const isValidPassword = await bcrypt.compare(body.password, passwordHash);

  if (!isValidPassword) {
    return createErrorResponse(401, "Invalid username or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(username, false);
  const refreshToken = generateRefreshToken(username, false);

  // Check if user must change password
  const mustChangePassword = result.Item.mustChangePassword === true;

  return createResponse<LoginResponse>(200, {
    success: true,
    token: accessToken, // Legacy - for backward compatibility
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    username,
    isMaster: false,
    ...(mustChangePassword && { mustChangePassword: true }),
  });
};
