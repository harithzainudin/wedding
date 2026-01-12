import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Require authentication
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error);
  }

  if (!event.body) {
    return createErrorResponse(400, "Missing request body");
  }

  let body: ChangePasswordRequest;
  try {
    body = JSON.parse(event.body) as ChangePasswordRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  // Validate required fields
  if (!body.username || !body.currentPassword || !body.newPassword) {
    return createErrorResponse(400, "Username, current password, and new password are required");
  }

  const username = body.username.trim().toLowerCase();

  // Ensure user can only change their own password
  if (username !== authResult.user.username) {
    return createErrorResponse(403, "You can only change your own password");
  }

  // Block master account from changing password
  if (username === "master") {
    return createErrorResponse(403, "Master account password cannot be changed");
  }

  // Validate new password length
  if (body.newPassword.length < 6) {
    return createErrorResponse(400, "New password must be at least 6 characters");
  }

  // Prevent setting same password
  if (body.currentPassword === body.newPassword) {
    return createErrorResponse(400, "New password must be different from current password");
  }

  // Fetch user from DynamoDB
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
    return createErrorResponse(404, "User not found");
  }

  // Verify current password
  const passwordHash = result.Item.passwordHash as string;
  const isValidPassword = await bcrypt.compare(body.currentPassword, passwordHash);

  if (!isValidPassword) {
    return createErrorResponse(401, "Current password is incorrect");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(body.newPassword, salt);

  // Update password in DynamoDB
  await docClient.send(
    new UpdateCommand({
      TableName: Resource.AppDataTable.name,
      Key: {
        pk: `ADMIN#${username}`,
        sk: "PROFILE",
      },
      UpdateExpression: "SET passwordHash = :newHash, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":newHash": newPasswordHash,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  return createResponse<ChangePasswordResponse>(200, {
    success: true,
    message: "Password changed successfully",
  });
};
