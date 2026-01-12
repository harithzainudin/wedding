import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createResponse, createErrorResponse } from "../shared/response";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface AdminUser {
  username: string;
  createdAt: string;
  createdBy: string;
}

export const handler: APIGatewayProxyHandlerV2 = async () => {
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
      })
    );

    const admins: AdminUser[] = (result.Items ?? []).map((item) => ({
      username: item.username as string,
      createdAt: item.createdAt as string,
      createdBy: item.createdBy as string,
    }));

    return createResponse(200, {
      success: true,
      data: {
        admins,
        total: admins.length,
      },
    });
  } catch (error) {
    console.error("Error listing admin users:", error);
    return createErrorResponse(500, "Failed to list admin users");
  }
};
