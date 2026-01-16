import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import {
  validateScheduleUpdate,
  type ScheduleData,
} from "../shared/schedule-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(
      authResult.statusCode,
      authResult.error,
      context,
      "AUTH_ERROR",
    );
  }

  if (!event.body) {
    return createErrorResponse(
      400,
      "Missing request body",
      context,
      "MISSING_BODY",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createErrorResponse(
      400,
      "Invalid JSON body",
      context,
      "INVALID_JSON",
    );
  }

  const validation = validateScheduleUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(
      400,
      validation.error,
      context,
      "VALIDATION_ERROR",
    );
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
      }),
    );

    const responseData: ScheduleData = {
      items: scheduleItem.items,
      updatedAt: scheduleItem.updatedAt,
      updatedBy: scheduleItem.updatedBy,
    };

    return createSuccessResponse(200, responseData, context);
  } catch (error) {
    logError(
      {
        endpoint: "PUT /schedule",
        operation: "updateSchedule",
        requestId: context.awsRequestId,
        input: { itemCount: validation.data.items?.length },
      },
      error,
    );
    return createErrorResponse(
      500,
      "Failed to update schedule",
      context,
      "DB_ERROR",
    );
  }
};
