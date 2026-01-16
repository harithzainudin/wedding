import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { validateThemeUpdate } from "../shared/theme-validation";
import type { ThemeSettings } from "../shared/theme-constants";

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

  const validation = validateThemeUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
  }

  try {
    const now = new Date().toISOString();

    const themeItem = {
      pk: "SETTINGS",
      sk: "THEME",
      activeThemeId: validation.data.activeThemeId,
      customTheme: validation.data.customTheme,
      updatedAt: now,
      updatedBy: authResult.user.username,
    };

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: themeItem,
      })
    );

    const responseData: ThemeSettings = {
      activeThemeId: themeItem.activeThemeId,
      customTheme: themeItem.customTheme,
      updatedAt: themeItem.updatedAt,
      updatedBy: themeItem.updatedBy,
    };

    return createSuccessResponse(200, responseData, context);
  } catch (error) {
    logError(
      {
        endpoint: "PUT /theme",
        operation: "updateTheme",
        requestId: context.awsRequestId,
        input: { activeThemeId: validation.data.activeThemeId },
      },
      error
    );
    return createErrorResponse(500, "Failed to update theme settings", context, "DB_ERROR");
  }
};
