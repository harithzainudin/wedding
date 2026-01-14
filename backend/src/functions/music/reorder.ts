import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateReorderRequest } from "../shared/music-validation";

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

  const validation = validateReorderRequest(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
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
        return createErrorResponse(404, `Track not found: ${trackId}`);
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

    return createResponse(200, {
      success: true,
      message: "Tracks reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering tracks:", error);
    return createErrorResponse(500, "Failed to reorder tracks");
  }
};
