import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { logError } from "../shared/logger";
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from "../shared/theme-constants";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "THEME" },
      }),
    );

    if (!result.Item) {
      // Return default theme settings if none exists in database
      return createSuccessResponse(200, DEFAULT_THEME_SETTINGS, context);
    }

    const themeSettings: ThemeSettings = {
      activeThemeId: result.Item.activeThemeId,
      customTheme: result.Item.customTheme,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createSuccessResponse(200, themeSettings, context);
  } catch (error) {
    logError(
      {
        endpoint: "GET /theme",
        operation: "fetchTheme",
        requestId: context.awsRequestId,
      },
      error,
    );
    return createErrorResponse(
      500,
      "Failed to fetch theme settings",
      context,
      "DB_ERROR",
    );
  }
};
