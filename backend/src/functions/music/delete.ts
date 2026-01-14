import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error);
  }

  const trackId = event.pathParameters?.id;
  if (!trackId) {
    return createErrorResponse(400, "Track ID is required");
  }

  try {
    // Get track metadata first
    const trackResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `MUSIC#${trackId}`, sk: "METADATA" },
      })
    );

    if (!trackResult.Item) {
      return createErrorResponse(404, "Track not found");
    }

    const s3Key = trackResult.Item.s3Key as string;

    // Delete from S3 (only for uploaded tracks, not external)
    if (trackResult.Item.source === "upload" && s3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: Resource.WeddingImageBucket.name,
            Key: s3Key,
          })
        );
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
        // Continue with DynamoDB deletion even if S3 fails
      }
    }

    // Delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: `MUSIC#${trackId}`, sk: "METADATA" },
      })
    );

    return createResponse(200, {
      success: true,
      message: "Track deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting track:", error);
    return createErrorResponse(500, "Failed to delete track");
  }
};
