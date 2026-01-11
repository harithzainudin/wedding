import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createResponse, createErrorResponse } from "../shared/response";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  username?: string;
  isMaster?: boolean;
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
    const token = Buffer.from(`master:${Date.now()}`).toString("base64");
    return createResponse<LoginResponse>(200, {
      success: true,
      token,
      username: "master",
      isMaster: true,
    });
  }

  // Look up user in DynamoDB
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.RsvpTable.name,
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

  // Generate token
  const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

  return createResponse<LoginResponse>(200, {
    success: true,
    token,
    username,
    isMaster: false,
  });
};
