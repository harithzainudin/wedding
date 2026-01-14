import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateReorderRequest } from "../shared/music-validation";

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

  const validation = validateReorderRequest(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
  }

  const { trackIds } = validation.data;

  try {
    // Verify all tracks exist
    for (const trackId of trackIds) {
      const result = await docClient.send(
        new GetCommand({
          TableName: Resource.AppDataTable.name,
          Key: { pk: `MUSIC#${trackId}`, sk: "METADATA" },
        })
      );

      if (!result.Item) {
        return createErrorResponse(404, `Track not found: ${trackId}`, context, "NOT_FOUND");
      }
    }

    // Update order for each track
    for (let i = 0; i < trackIds.length; i++) {
      const trackId = trackIds[i];
      const order = i;
      const paddedOrder = order.toString().padStart(4, "0");

      await docClient.send(
        new UpdateCommand({
          TableName: Resource.AppDataTable.name,
          Key: { pk: `MUSIC#${trackId}`, sk: "METADATA" },
          UpdateExpression: "SET #order = :order, gsi1sk = :gsi1sk",
          ExpressionAttributeNames: {
            "#order": "order",
          },
          ExpressionAttributeValues: {
            ":order": order,
            ":gsi1sk": `ORDER#${paddedOrder}`,
          },
        })
      );
    }

    return createSuccessResponse(200, {
      message: "Tracks reordered successfully",
    }, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error reordering tracks:", {
      requestId: context.awsRequestId,
      error: errorMessage,
    });
    return createErrorResponse(500, "Failed to reorder tracks", context, "DB_ERROR");
  }
};
