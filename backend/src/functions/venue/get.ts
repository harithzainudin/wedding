import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { logError } from "../shared/logger";
import { DEFAULT_VENUE, type VenueData } from "../shared/venue-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "VENUE" },
      }),
    );

    if (!result.Item) {
      // Return default venue if none exists in database
      return createSuccessResponse(200, DEFAULT_VENUE, context);
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

    return createSuccessResponse(200, venueData, context);
  } catch (error) {
    logError(
      {
        endpoint: "GET /venue",
        operation: "fetchVenue",
        requestId: context.awsRequestId,
      },
      error,
    );
    return createErrorResponse(
      500,
      "Failed to fetch venue data",
      context,
      "DB_ERROR",
    );
  }
};
