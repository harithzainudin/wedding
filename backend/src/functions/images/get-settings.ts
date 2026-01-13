import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
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

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "IMAGES" },
      })
    );

    const settings = {
      maxFileSize: (result.Item?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
      maxImages: (result.Item?.maxImages as number) ?? DEFAULT_MAX_IMAGES,
      allowedFormats: (result.Item?.allowedFormats as string[]) ?? [...ALLOWED_MIME_TYPES],
      showGallery: (result.Item?.showGallery as boolean) ?? DEFAULT_SHOW_GALLERY,
      updatedAt: result.Item?.updatedAt as string | undefined,
      updatedBy: result.Item?.updatedBy as string | undefined,
    };

    return createResponse(200, {
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    return createErrorResponse(500, "Failed to get settings");
  }
};
