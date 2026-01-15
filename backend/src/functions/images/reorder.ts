import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import { validateReorderRequest } from "../shared/image-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

function padOrder(order: number): string {
  return `ORDER#${order.toString().padStart(5, "0")}`;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let imageIds: string[] | undefined;

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

    const validation = validateReorderRequest(body);
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
    }

    imageIds = validation.data.imageIds;

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
        return createErrorResponse(400, `Image with ID ${id} not found`, context, "NOT_FOUND");
      }
    }

    // Ensure all images are included
    if (imageIds.length !== existingImages.length) {
      return createErrorResponse(400, "All image IDs must be included in the reorder request", context, "VALIDATION_ERROR");
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

    await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));

    return createSuccessResponse(200, {
      message: "Images reordered successfully",
      newOrder: imageIds,
    }, context);
  } catch (error) {
    logError({
      endpoint: "PUT /images/reorder",
      operation: "reorderImages",
      requestId: context.awsRequestId,
      input: { imageCount: imageIds?.length },
    }, error);
    return createErrorResponse(500, "Failed to reorder images", context, "DB_ERROR");
  }
};
