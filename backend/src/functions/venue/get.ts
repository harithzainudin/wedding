import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { DEFAULT_VENUE, type VenueData } from "../shared/venue-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "VENUE" },
      })
    );

    if (!result.Item) {
      // Return default venue if none exists in database
      return createResponse(200, {
        success: true,
        data: DEFAULT_VENUE,
      });
    }

    const venueData: VenueData = {
      venueName: result.Item.venueName,
      address: result.Item.address,
      coordinates: result.Item.coordinates,
      parkingInfo: result.Item.parkingInfo ?? null,
      googleMapsUrl: result.Item.googleMapsUrl,
      wazeUrl: result.Item.wazeUrl,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: venueData,
    });
  } catch (error) {
    console.error("Error fetching venue:", error);
    return createErrorResponse(500, "Failed to fetch venue data");
  }
};
