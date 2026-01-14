import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateConfirmMusicUpload } from "../shared/music-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

async function getNextOrder(): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: "byStatus",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": "MUSIC_TRACKS" },
      ScanIndexForward: false, // descending order
      Limit: 1,
    })
  );

  const firstItem = result.Items?.[0];
  if (firstItem) {
    return ((firstItem.order as number) ?? 0) + 1;
  }
  return 0;
}

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

  const validation = validateConfirmMusicUpload(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
  }

  const { trackId, s3Key, filename, mimeType, title, artist, duration } = validation.data;

  try {
    // Verify file exists in S3
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    );
  } catch (error) {
    console.error("File not found in S3:", error);
    return createErrorResponse(400, "File not found in S3. Upload may have failed.", context, "S3_ERROR");
  }

  try {
    // Get next order number
    const order = await getNextOrder();

    // Pad order for proper string sorting (supports up to 9999 tracks)
    const paddedOrder = order.toString().padStart(4, "0");

    // Save track metadata to DynamoDB
    const now = new Date().toISOString();
    const bucketName = Resource.WeddingImageBucket.name;

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: {
          pk: `MUSIC#${trackId}`,
          sk: "METADATA",
          gsi1pk: "MUSIC_TRACKS",
          gsi1sk: `ORDER#${paddedOrder}`,
          id: trackId,
          title,
          artist: artist ?? null,
          duration,
          filename,
          s3Key,
          mimeType,
          fileSize: 0, // We don't have this info at confirm time
          order,
          source: "upload",
          uploadedAt: now,
          uploadedBy: authResult.user.username,
        },
      })
    );

    return createSuccessResponse(200, {
      id: trackId,
      title,
      artist,
      duration,
      filename,
      url: `https://${bucketName}.s3.ap-southeast-5.amazonaws.com/${s3Key}`,
      mimeType,
      order,
      source: "upload",
      uploadedAt: now,
      uploadedBy: authResult.user.username,
    }, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error confirming upload:", {
      requestId: context.awsRequestId,
      error: errorMessage,
    });
    return createErrorResponse(500, "Failed to confirm upload", context, "DB_ERROR");
  }
};
