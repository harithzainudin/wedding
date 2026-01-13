import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import {
  validateWeddingDetailsUpdate,
  type WeddingDetailsData,
} from "../shared/wedding-validation";

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

  const validation = validateWeddingDetailsUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  try {
    const now = new Date().toISOString();

    const weddingItem = {
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

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: weddingItem,
      })
    );

    const responseData: WeddingDetailsData = {
      couple: weddingItem.couple,
      parents: weddingItem.parents,
      eventDate: weddingItem.eventDate,
      dressCode: weddingItem.dressCode,
      hashtag: weddingItem.hashtag,
      qrCodeUrl: weddingItem.qrCodeUrl,
      updatedAt: weddingItem.updatedAt,
      updatedBy: weddingItem.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating wedding details:", error);
    return createErrorResponse(500, "Failed to update wedding details");
  }
};
