import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface AdminProfile {
  username: string;
  email?: string;
  createdAt: string;
  createdBy: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let username: string | undefined;

  try {
    // Require authentication
    const authResult = requireAuth(event);
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.statusCode, authResult.error, context, "AUTH_ERROR");
    }

    username = authResult.user.username;

    // Master user doesn't have a stored profile
    if (username === "master") {
      const profile: AdminProfile = {
        username: "master",
        createdAt: "",
        createdBy: "system",
      };
      return createSuccessResponse(200, profile, context);
    }

    // Fetch user profile from DynamoDB
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
      return createErrorResponse(404, "Profile not found", context, "NOT_FOUND");
    }

    const profile: AdminProfile = {
      username: result.Item.username as string,
      email: result.Item.email as string | undefined,
      createdAt: result.Item.createdAt as string,
      createdBy: result.Item.createdBy as string,
    };

    return createSuccessResponse(200, profile, context);
  } catch (error) {
    logError({
      endpoint: "GET /admin/users/me",
      operation: "getProfile",
      requestId: context.awsRequestId,
      input: { username },
    }, error);
    return createErrorResponse(500, "Internal server error", context, "INTERNAL_ERROR");
  }
};
