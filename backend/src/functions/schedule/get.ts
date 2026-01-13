import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { DEFAULT_SCHEDULE, type ScheduleData } from "../shared/schedule-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SCHEDULE", sk: "ITEMS" },
      })
    );

    if (!result.Item) {
      // Return default schedule if none exists in database
      return createResponse(200, {
        success: true,
        data: DEFAULT_SCHEDULE,
      });
    }

    const scheduleData: ScheduleData = {
      items: result.Item.items,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: scheduleData,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return createErrorResponse(500, "Failed to fetch schedule");
  }
};
