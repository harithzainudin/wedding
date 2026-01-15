import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import {
  validateVenueUpdate,
  generateGoogleMapsUrl,
  generateWazeUrl,
  type VenueData,
} from "../shared/venue-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error, context, "AUTH_ERROR");
  }

  if (!event.body) {
    return createErrorResponse(400, "Missing request body", context, "MISSING_BODY");
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body);
  } catch {
    return createErrorResponse(400, "Invalid JSON body", context, "INVALID_JSON");
  }

  const validation = validateVenueUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
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

    return createSuccessResponse(200, responseData, context);
  } catch (error) {
    logError({
      endpoint: "PUT /venue",
      operation: "updateVenue",
      requestId: context.awsRequestId,
      input: { venueName: validation.data.venueName },
    }, error);
    return createErrorResponse(500, "Failed to update venue data", context, "DB_ERROR");
  }
};
