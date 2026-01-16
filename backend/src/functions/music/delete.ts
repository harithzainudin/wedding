import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const trackId = event.pathParameters?.id;

  try {
    const authResult = requireAuth(event);
    if (!authResult.authenticated) {
      return createErrorResponse(
        authResult.statusCode,
        authResult.error,
        context,
        "AUTH_ERROR",
      );
    }

    if (!trackId) {
      return createErrorResponse(
        400,
        "Track ID is required",
        context,
        "VALIDATION_ERROR",
      );
    }

    // Get track metadata first
    const trackResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `MUSIC#${trackId}`, sk: "METADATA" },
      }),
    );

    if (!trackResult.Item) {
      return createErrorResponse(404, "Track not found", context, "NOT_FOUND");
    }

    const s3Key = trackResult.Item.s3Key as string;

    // Delete from S3 (only for uploaded tracks, not external)
    if (trackResult.Item.source === "upload" && s3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: Resource.WeddingImageBucket.name,
            Key: s3Key,
          }),
        );
      } catch (s3Error) {
        logError(
          {
            endpoint: "DELETE /music/{id}",
            operation: "deleteFromS3",
            requestId: context.awsRequestId,
            input: { trackId, s3Key },
          },
          s3Error,
        );
        // Continue with DynamoDB deletion even if S3 fails
      }
    }

    // Delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `MUSIC#${trackId}`, sk: "METADATA" },
      }),
    );

    return createSuccessResponse(
      200,
      {
        message: "Track deleted successfully",
      },
      context,
    );
  } catch (error) {
    logError(
      {
        endpoint: "DELETE /music/{id}",
        operation: "deleteTrack",
        requestId: context.awsRequestId,
        input: { trackId },
      },
      error,
    );
    return createErrorResponse(
      500,
      "Failed to delete track",
      context,
      "DB_ERROR",
    );
  }
};
