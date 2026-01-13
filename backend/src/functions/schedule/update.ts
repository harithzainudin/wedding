import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import {
  validateScheduleUpdate,
  type ScheduleData,
} from "../shared/schedule-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error);
  }

  if (!event.body) {
    return createErrorResponse(400, "Missing request body");
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  const validation = validateScheduleUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  try {
    const now = new Date().toISOString();

    const scheduleItem = {
      pk: "SCHEDULE",
      sk: "ITEMS",
      items: validation.data.items,
      updatedAt: now,
      updatedBy: authResult.user.username,
    };

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: scheduleItem,
      })
    );

    const responseData: ScheduleData = {
      items: scheduleItem.items,
      updatedAt: scheduleItem.updatedAt,
      updatedBy: scheduleItem.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return createErrorResponse(500, "Failed to update schedule");
  }
};
