import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface AdminUser {
  username: string;
  createdAt: string;
  createdBy: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Require authentication
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(
      authResult.statusCode,
      authResult.error,
      context,
      "AUTH_ERROR",
    );
  }

  try {
    // Query all admin users using GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: "byStatus",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "ADMIN",
        },
        ScanIndexForward: false, // Most recent first
      }),
    );

    const admins: AdminUser[] = (result.Items ?? []).map((item) => ({
      username: item.username as string,
      createdAt: item.createdAt as string,
      createdBy: item.createdBy as string,
    }));

    return createSuccessResponse(
      200,
      {
        admins,
        total: admins.length,
      },
      context,
    );
  } catch (error) {
    logError(
      {
        endpoint: "GET /admin/users",
        operation: "listAdmins",
        requestId: context.awsRequestId,
      },
      error,
    );
    return createErrorResponse(
      500,
      "Failed to list admin users",
      context,
      "DB_ERROR",
    );
  }
};
