import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { DEFAULT_WEDDING_DETAILS, type WeddingDetailsData } from "../shared/wedding-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "WEDDING" },
      })
    );

    if (!result.Item) {
      // Return default wedding details if none exists in database
      return createSuccessResponse(200, DEFAULT_WEDDING_DETAILS, context);
    }

    const weddingData: WeddingDetailsData = {
      couple: result.Item.couple,
      parents: result.Item.parents,
      eventDate: result.Item.eventDate,
      eventEndTime: result.Item.eventEndTime,
      eventDisplayFormat: result.Item.eventDisplayFormat,
      displayNameOrder: result.Item.displayNameOrder,
      dressCode: result.Item.dressCode,
      hashtag: result.Item.hashtag,
      qrCodeUrl: result.Item.qrCodeUrl,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createSuccessResponse(200, weddingData, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching wedding details:", {
      requestId: context.awsRequestId,
      error: errorMessage,
    });
    return createErrorResponse(500, "Failed to fetch wedding details", context, "DB_ERROR");
  }
};
