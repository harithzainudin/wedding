import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import {
  validateWeddingDetailsUpdate,
  type WeddingDetailsData,
} from "../shared/wedding-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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

  const validation = validateWeddingDetailsUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
  }

  try {
    const now = new Date().toISOString();

    // Build base item with required fields
    const weddingItem: Record<string, unknown> = {
      pk: "SETTINGS",
      sk: "WEDDING",
      couple: validation.data.couple,
      parents: validation.data.parents,
      eventDate: validation.data.eventDate,
      dressCode: validation.data.dressCode,
      hashtag: validation.data.hashtag,
      qrCodeUrl: validation.data.qrCodeUrl,
      updatedAt: now,
      updatedBy: authResult.user.username,
    };

    // Only add optional fields if they have values (DynamoDB doesn't accept undefined)
    if (validation.data.eventEndTime) {
      weddingItem.eventEndTime = validation.data.eventEndTime;
    }
    if (validation.data.eventDisplayFormat) {
      weddingItem.eventDisplayFormat = validation.data.eventDisplayFormat;
    }
    if (validation.data.displayNameOrder) {
      weddingItem.displayNameOrder = validation.data.displayNameOrder;
    }

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: weddingItem,
      })
    );

    const responseData: WeddingDetailsData = {
      couple: weddingItem.couple as WeddingDetailsData["couple"],
      parents: weddingItem.parents as WeddingDetailsData["parents"],
      eventDate: weddingItem.eventDate as string,
      eventEndTime: weddingItem.eventEndTime as string | undefined,
      eventDisplayFormat: weddingItem.eventDisplayFormat as WeddingDetailsData["eventDisplayFormat"],
      displayNameOrder: weddingItem.displayNameOrder as WeddingDetailsData["displayNameOrder"],
      dressCode: weddingItem.dressCode as string,
      hashtag: weddingItem.hashtag as string,
      qrCodeUrl: weddingItem.qrCodeUrl as string,
      updatedAt: weddingItem.updatedAt as string,
      updatedBy: weddingItem.updatedBy as string,
    };

    return createSuccessResponse(200, responseData, context);
  } catch (error) {
    logError({
      endpoint: "PUT /wedding-details",
      operation: "updateWeddingDetails",
      requestId: context.awsRequestId,
      input: { eventDate: validation.data.eventDate },
    }, error);
    return createErrorResponse(500, "Failed to update wedding details", context, "DB_ERROR");
  }
};
