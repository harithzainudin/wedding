import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let giftId: string | undefined;

  try {
    // Require authentication
    const authResult = requireAuth(event);
    if (!authResult.authenticated) {
      return createErrorResponse(
        authResult.statusCode,
        authResult.error,
        context,
        "AUTH_ERROR"
      );
    }

    // Get gift ID from path
    giftId = event.pathParameters?.id;
    if (!giftId) {
      return createErrorResponse(400, "Gift ID is required", context, "MISSING_ID");
    }

    // Get the gift to check if it exists and get S3 key
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `GIFT#${giftId}`, sk: "METADATA" },
      })
    );

    if (!existingResult.Item) {
      return createErrorResponse(404, "Gift not found", context, "NOT_FOUND");
    }

    const gift = existingResult.Item;

    // Delete image from S3 if exists
    if (gift.s3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: Resource.WeddingImageBucket.name,
            Key: gift.s3Key as string,
          })
        );
      } catch (s3Error) {
        // Log but don't fail - the S3 object might already be deleted
        console.warn("Failed to delete S3 object:", s3Error);
      }
    }

    // Get all reservations for this gift
    const reservationsResult = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `GIFT#${giftId}`,
          ":skPrefix": "RESERVATION#",
        },
      })
    );

    // Delete all reservations in batch
    const reservations = reservationsResult.Items ?? [];
    if (reservations.length > 0) {
      const deleteRequests = reservations.map((reservation) => ({
        DeleteRequest: {
          Key: {
            pk: reservation.pk,
            sk: reservation.sk,
          },
        },
      }));

      // DynamoDB BatchWrite supports max 25 items
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [Resource.AppDataTable.name]: batch,
            },
          })
        );
      }
    }

    // Delete the gift
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `GIFT#${giftId}`, sk: "METADATA" },
      })
    );

    return createSuccessResponse(200, {
      message: "Gift deleted successfully",
      id: giftId,
      reservationsDeleted: reservations.length,
    }, context);
  } catch (error) {
    logError({
      endpoint: "DELETE /gifts/{id}",
      operation: "deleteGift",
      requestId: context.awsRequestId,
      input: { giftId },
    }, error);
    return createErrorResponse(500, "Internal server error", context, "DB_ERROR");
  }
};
