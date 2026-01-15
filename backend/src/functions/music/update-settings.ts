import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { validateSettingsUpdate } from "../shared/music-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
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

    const validation = validateSettingsUpdate(body);
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
    }
    // Build update expression dynamically
    const updateParts: string[] = [];
    const expressionValues: Record<string, unknown> = {};
    const expressionNames: Record<string, string> = {};

    if (validation.data.enabled !== undefined) {
      updateParts.push("#enabled = :enabled");
      expressionNames["#enabled"] = "enabled";
      expressionValues[":enabled"] = validation.data.enabled;
    }

    if (validation.data.autoplay !== undefined) {
      updateParts.push("autoplay = :autoplay");
      expressionValues[":autoplay"] = validation.data.autoplay;
    }

    if (validation.data.volume !== undefined) {
      updateParts.push("volume = :volume");
      expressionValues[":volume"] = validation.data.volume;
    }

    if (validation.data.mode !== undefined) {
      updateParts.push("#mode = :mode");
      expressionNames["#mode"] = "mode";
      expressionValues[":mode"] = validation.data.mode;
    }

    if (validation.data.shuffle !== undefined) {
      updateParts.push("shuffle = :shuffle");
      expressionValues[":shuffle"] = validation.data.shuffle;
    }

    if (validation.data.loop !== undefined) {
      updateParts.push("#loop = :loop");
      expressionNames["#loop"] = "loop";
      expressionValues[":loop"] = validation.data.loop;
    }

    if (validation.data.selectedTrackId !== undefined) {
      updateParts.push("selectedTrackId = :selectedTrackId");
      expressionValues[":selectedTrackId"] = validation.data.selectedTrackId;
    }

    // Always update metadata
    updateParts.push("updatedAt = :updatedAt");
    expressionValues[":updatedAt"] = new Date().toISOString();

    updateParts.push("updatedBy = :updatedBy");
    expressionValues[":updatedBy"] = authResult.user.username;

    await docClient.send(
      new UpdateCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "MUSIC" },
        UpdateExpression: `SET ${updateParts.join(", ")}`,
        ExpressionAttributeValues: expressionValues,
        ...(Object.keys(expressionNames).length > 0 && {
          ExpressionAttributeNames: expressionNames,
        }),
      })
    );

    return createSuccessResponse(200, {
      message: "Music settings updated successfully",
    }, context);
  } catch (error) {
    logError({
      endpoint: "PUT /music/settings",
      operation: "updateMusicSettings",
      requestId: context.awsRequestId,
    }, error);
    return createErrorResponse(500, "Failed to update music settings", context, "DB_ERROR");
  }
};
