import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import {
  validateGiftSettingsInput,
  GIFT_LIMITS,
} from "../shared/gift-validation";

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
    // Require authentication
    const authResult = requireAuth(event);
    if (!authResult.authenticated) {
      return createErrorResponse(
        authResult.statusCode,
        authResult.error,
        context,
        "AUTH_ERROR",
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? "{}");
    } catch {
      return createErrorResponse(
        400,
        "Invalid JSON in request body",
        context,
        "INVALID_JSON",
      );
    }

    // Validate input
    const validation = validateGiftSettingsInput(body);
    if (!validation.valid) {
      return createErrorResponse(
        400,
        validation.error,
        context,
        "VALIDATION_ERROR",
      );
    }

    const { data } = validation;

    // Get current settings
    const currentResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "GIFTS" },
      }),
    );

    const currentSettings: GiftSettings = currentResult.Item
      ? {
          enabled: currentResult.Item.enabled ?? DEFAULT_SETTINGS.enabled,
          maxItems: currentResult.Item.maxItems ?? DEFAULT_SETTINGS.maxItems,
          maxFileSize:
            currentResult.Item.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFormats:
            currentResult.Item.allowedFormats ??
            DEFAULT_SETTINGS.allowedFormats,
        }
      : DEFAULT_SETTINGS;

    // Merge with updated values
    const timestamp = new Date().toISOString();
    const updatedSettings = {
      pk: "SETTINGS",
      sk: "GIFTS",
      enabled: data.enabled ?? currentSettings.enabled,
      maxItems: data.maxItems ?? currentSettings.maxItems,
      maxFileSize: data.maxFileSize ?? currentSettings.maxFileSize,
      allowedFormats: data.allowedFormats ?? currentSettings.allowedFormats,
      updatedAt: timestamp,
      updatedBy: authResult.user.username,
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedSettings,
      }),
    );

    return createSuccessResponse(
      200,
      {
        enabled: updatedSettings.enabled,
        maxItems: updatedSettings.maxItems,
        maxFileSize: updatedSettings.maxFileSize,
        allowedFormats: updatedSettings.allowedFormats,
        updatedAt: updatedSettings.updatedAt,
        updatedBy: updatedSettings.updatedBy,
      },
      context,
    );
  } catch (error) {
    logError(
      {
        endpoint: "PUT /gifts/settings",
        operation: "updateGiftSettings",
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
