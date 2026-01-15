import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface UpdateEmailRequest {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let username: string | undefined;
  let email: string | undefined;

  try {
    // Require authentication
    const authResult = requireAuth(event);
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, "AUTH_ERROR");
    }

    username = authResult.user.username;

    // Block master account from updating email
    if (username === "master") {
      return createErrorResponse(403, "Master account email cannot be updated", context, "FORBIDDEN");
    }

    if (!event.body) {
      return createErrorResponse(400, "Missing request body", context, "MISSING_BODY");
    }

    let body: UpdateEmailRequest;
    try {
      body = JSON.parse(event.body) as UpdateEmailRequest;
    } catch {
      return createErrorResponse(400, "Invalid JSON body", context, "INVALID_JSON");
    }

    // Validate email format (allow empty string to remove email)
    email = body.email?.trim() ?? "";
    if (email && !EMAIL_REGEX.test(email)) {
      return createErrorResponse(400, "Invalid email format", context, "VALIDATION_ERROR");
    }

    // Verify user exists
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

    // Update email in DynamoDB
    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `ADMIN#${username}`,
          sk: "PROFILE",
        },
        UpdateExpression: "SET email = :email, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":email": email || null,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    return createSuccessResponse(200, {
      message: email ? "Email updated successfully" : "Email removed successfully",
    }, context);
  } catch (error) {
    logError({
      endpoint: "PUT /admin/users/me/email",
      operation: "updateEmail",
      requestId: context.awsRequestId,
      input: { username, email },
    }, error);
    return createErrorResponse(500, "Internal server error", context, "INTERNAL_ERROR");
  }
};
