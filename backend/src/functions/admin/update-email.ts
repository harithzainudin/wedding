import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface UpdateEmailRequest {
  email: string;
}

interface UpdateEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Require authentication
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error);
  }

  const username = authResult.user.username;

  // Block master account from updating email
  if (username === "master") {
    return createErrorResponse(403, "Master account email cannot be updated");
  }

  if (!event.body) {
    return createErrorResponse(400, "Missing request body");
  }

  let body: UpdateEmailRequest;
  try {
    body = JSON.parse(event.body) as UpdateEmailRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  // Validate email format (allow empty string to remove email)
  const email = body.email?.trim() ?? "";
  if (email && !EMAIL_REGEX.test(email)) {
    return createErrorResponse(400, "Invalid email format");
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
    return createErrorResponse(404, "User not found");
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

  return createResponse<UpdateEmailResponse>(200, {
    success: true,
    message: email ? "Email updated successfully" : "Email removed successfully",
  });
};
