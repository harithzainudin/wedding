import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface SetNewPasswordRequest {
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

  let body: SetNewPasswordRequest;
  try {
    body = JSON.parse(event.body) as SetNewPasswordRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body", context, "INVALID_JSON");
  }

  // Validate new password
  if (!body.newPassword || body.newPassword.length < 6) {
    return createErrorResponse(400, "New password must be at least 6 characters", context, "VALIDATION_ERROR");
  }

  const username = authResult.user.username;

  // Block master account
  if (username === "master") {
    return createErrorResponse(403, "Master account password cannot be changed", context, "FORBIDDEN");
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

  // Check if user must change password
  if (!result.Item.mustChangePassword) {
    return createErrorResponse(403, "This endpoint is only for users who must change their password. Use the regular password change endpoint instead.", context, "FORBIDDEN");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(body.newPassword, salt);

  // Update password and clear mustChangePassword flag
  await docClient.send(
    new UpdateCommand({
      TableName: Resource.AppDataTable.name,
      Key: {
        pk: `ADMIN#${username}`,
        sk: "PROFILE",
      },
      UpdateExpression: "SET passwordHash = :newHash, mustChangePassword = :must, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":newHash": newPasswordHash,
        ":must": false,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  return createSuccessResponse(200, {
    message: "Password changed successfully",
  }, context);
};
