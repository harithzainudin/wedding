import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { DEFAULT_SCHEDULE, type ScheduleData } from "../shared/schedule-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SCHEDULE", sk: "ITEMS" },
      })
    );

    if (!result.Item) {
      // Return default schedule if none exists in database
      return createSuccessResponse(200, DEFAULT_SCHEDULE, context);
    }

    const scheduleData: ScheduleData = {
      items: result.Item.items,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createSuccessResponse(200, scheduleData, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching schedule:", {
      requestId: context.awsRequestId,
      error: errorMessage,
    });
    return createErrorResponse(500, "Failed to fetch schedule", context, "DB_ERROR");
  }
};
