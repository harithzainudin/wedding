import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { GIFT_LIMITS } from "../shared/gift-validation";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface GiftSettings {
  enabled: boolean;
  maxItems: number;
  maxFileSize: number;
  allowedFormats: string[];
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_SETTINGS: GiftSettings = {
  enabled: false,
  maxItems: GIFT_LIMITS.maxItems,
  maxFileSize: GIFT_LIMITS.maxFileSize,
  allowedFormats: GIFT_LIMITS.allowedFormats,
};

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Require authentication for settings access
    const authResult = requireAuth(event);
    if (!authResult.authenticated) {
      return createErrorResponse(
        authResult.statusCode,
        authResult.error,
        context,
        "AUTH_ERROR",
      );
    }

    // Get gift settings
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "GIFTS" },
      }),
    );

    const settings: GiftSettings = result.Item
      ? {
          enabled: result.Item.enabled ?? DEFAULT_SETTINGS.enabled,
          maxItems: result.Item.maxItems ?? DEFAULT_SETTINGS.maxItems,
          maxFileSize: result.Item.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFormats:
            result.Item.allowedFormats ?? DEFAULT_SETTINGS.allowedFormats,
          updatedAt: result.Item.updatedAt as string | undefined,
          updatedBy: result.Item.updatedBy as string | undefined,
        }
      : DEFAULT_SETTINGS;

    return createSuccessResponse(200, settings, context);
  } catch (error) {
    logError(
      {
        endpoint: "GET /gifts/settings",
        operation: "getGiftSettings",
        requestId: context.awsRequestId,
      },
      error,
    );
    return createErrorResponse(
      500,
      "Internal server error",
      context,
      "DB_ERROR",
    );
  }
};
