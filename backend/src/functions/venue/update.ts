import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import {
  validateVenueUpdate,
  generateGoogleMapsUrl,
  generateWazeUrl,
  type VenueData,
} from "../shared/venue-validation";

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

  const validation = validateVenueUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  try {
    const now = new Date().toISOString();
    const { lat, lng } = validation.data.coordinates;

    const venueItem = {
      pk: "SETTINGS",
      sk: "VENUE",
      venueName: validation.data.venueName,
      address: validation.data.address,
      coordinates: validation.data.coordinates,
      parkingInfo: validation.data.parkingInfo ?? null,
      googleMapsUrl: generateGoogleMapsUrl(lat, lng),
      wazeUrl: generateWazeUrl(lat, lng),
      updatedAt: now,
      updatedBy: authResult.user.username,
    };

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: venueItem,
      })
    );

    const responseData: VenueData = {
      venueName: venueItem.venueName,
      address: venueItem.address,
      coordinates: venueItem.coordinates,
      parkingInfo: venueItem.parkingInfo,
      googleMapsUrl: venueItem.googleMapsUrl,
      wazeUrl: venueItem.wazeUrl,
      updatedAt: venueItem.updatedAt,
      updatedBy: venueItem.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating venue:", error);
    return createErrorResponse(500, "Failed to update venue data");
  }
};
