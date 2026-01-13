import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateReorderRequest } from "../shared/image-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

function padOrder(order: number): string {
  return `ORDER#${order.toString().padStart(5, "0")}`;
}

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

  const { imageIds } = validation.data;

  // Get all current images
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: "byStatus",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": "IMAGES" },
    })
  );

  const existingImages = queryResult.Items ?? [];
  const existingIds = new Set(existingImages.map((item) => item.id as string));

  // Validate all provided IDs exist
  for (const id of imageIds) {
    if (!existingIds.has(id)) {
      return createErrorResponse(400, `Image with ID ${id} not found`);
    }
  }

  // Ensure all images are included
  if (imageIds.length !== existingImages.length) {
    return createErrorResponse(400, "All image IDs must be included in the reorder request");
  }

  // Build transaction to update all orders atomically
  const transactItems = imageIds.map((id, index) => ({
    Update: {
      TableName: Resource.AppDataTable.name,
      Key: { pk: `IMAGE#${id}`, sk: "METADATA" },
      UpdateExpression: "SET #order = :order, gsi1sk = :gsi1sk",
      ExpressionAttributeNames: { "#order": "order" },
      ExpressionAttributeValues: {
        ":order": index + 1,
        ":gsi1sk": padOrder(index + 1),
      },
    },
  }));

  try {
    await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    console.error("Error reordering images:", error);
    return createErrorResponse(500, "Failed to reorder images");
  }

  return createResponse(200, {
    success: true,
    message: "Images reordered successfully",
    data: { newOrder: imageIds },
  });
};
