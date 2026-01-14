import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireMaster } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Require master admin access
  const authResult = requireMaster(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error, context, "AUTH_ERROR");
  }

  const username = event.pathParameters?.username;

  if (!username) {
    return createErrorResponse(400, "Username is required", context, "VALIDATION_ERROR");
  }

  const normalizedUsername = username.trim().toLowerCase();

  // Check how many admins exist - don't allow deleting the last one
  const adminsResult = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: "byStatus",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "ADMIN",
      },
      Select: "COUNT",
    })
  );

  if ((adminsResult.Count ?? 0) <= 1) {
    return createErrorResponse(400, "Cannot delete the last admin user", context, "VALIDATION_ERROR");
  }

  // Delete the admin user
  await docClient.send(
    new DeleteCommand({
      TableName: Resource.AppDataTable.name,
      Key: {
        pk: `ADMIN#${normalizedUsername}`,
        sk: "PROFILE",
      },
    })
  );

  return createSuccessResponse(200, {
    message: `Admin user '${normalizedUsername}' deleted successfully`,
  }, context);
};
