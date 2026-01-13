import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateSettingsUpdate } from "../shared/image-validation";
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_IMAGES,
  DEFAULT_SHOW_GALLERY,
  ALLOWED_MIME_TYPES,
} from "../shared/image-constants";

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

  const validation = validateSettingsUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  try {
    // Get current settings
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "IMAGES" },
      })
    );

    const now = new Date().toISOString();
    const newSettings = {
      pk: "SETTINGS",
      sk: "IMAGES",
      maxFileSize: validation.data.maxFileSize ?? currentResult.Item?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
      maxImages: validation.data.maxImages ?? currentResult.Item?.maxImages ?? DEFAULT_MAX_IMAGES,
      allowedFormats: currentResult.Item?.allowedFormats ?? [...ALLOWED_MIME_TYPES],
      showGallery: validation.data.showGallery ?? currentResult.Item?.showGallery ?? DEFAULT_SHOW_GALLERY,
      updatedAt: now,
      updatedBy: authResult.user.username,
    };

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: newSettings,
      })
    );

    return createResponse(200, {
      success: true,
      data: {
        maxFileSize: newSettings.maxFileSize,
        maxImages: newSettings.maxImages,
        allowedFormats: newSettings.allowedFormats,
        showGallery: newSettings.showGallery,
        updatedAt: newSettings.updatedAt,
        updatedBy: newSettings.updatedBy,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return createErrorResponse(500, "Failed to update settings");
  }
};
