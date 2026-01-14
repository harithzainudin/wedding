import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Require authentication
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error, context, "AUTH_ERROR");
  }

  if (!event.body) {
    return createErrorResponse(400, "Missing request body", context, "MISSING_BODY");
  }

  let body: ChangePasswordRequest;
  try {
    body = JSON.parse(event.body) as ChangePasswordRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body", context, "INVALID_JSON");
  }

  // Validate required fields
  if (!body.username || !body.currentPassword || !body.newPassword) {
    return createErrorResponse(400, "Username, current password, and new password are required", context, "VALIDATION_ERROR");
  }

  const username = body.username.trim().toLowerCase();

  // Ensure user can only change their own password
  if (username !== authResult.user.username) {
    return createErrorResponse(403, "You can only change your own password", context, "FORBIDDEN");
  }

  // Block master account from changing password
  if (username === "master") {
    return createErrorResponse(403, "Master account password cannot be changed", context, "FORBIDDEN");
  }

  // Validate new password length
  if (body.newPassword.length < 6) {
    return createErrorResponse(400, "New password must be at least 6 characters", context, "VALIDATION_ERROR");
  }

  // Prevent setting same password
  if (body.currentPassword === body.newPassword) {
    return createErrorResponse(400, "New password must be different from current password", context, "VALIDATION_ERROR");
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
    return createErrorResponse(404, "User not found", context, "NOT_FOUND");
  }

  // Verify current password
  const passwordHash = result.Item.passwordHash as string;
  const isValidPassword = await bcrypt.compare(body.currentPassword, passwordHash);

  if (!isValidPassword) {
    return createErrorResponse(401, "Current password is incorrect", context, "AUTH_ERROR");
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

  return createSuccessResponse(200, {
    message: "Password changed successfully",
  }, context);
};
