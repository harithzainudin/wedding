import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { DEFAULT_WEDDING_DETAILS, type WeddingDetailsData } from "../shared/wedding-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "WEDDING" },
      })
    );

    if (!result.Item) {
      // Return default wedding details if none exists in database
      return createResponse(200, {
        success: true,
        data: DEFAULT_WEDDING_DETAILS,
      });
    }

    const weddingData: WeddingDetailsData = {
      couple: result.Item.couple,
      parents: result.Item.parents,
      eventDate: result.Item.eventDate,
      dressCode: result.Item.dressCode,
      hashtag: result.Item.hashtag,
      qrCodeUrl: result.Item.qrCodeUrl,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: weddingData,
    });
  } catch (error) {
    console.error("Error fetching wedding details:", error);
    return createErrorResponse(500, "Failed to fetch wedding details");
  }
};
