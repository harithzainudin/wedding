import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateMusicUpload } from "../shared/music-validation";
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_TRACKS,
  ALLOWED_AUDIO_MIME_TYPES,
  MIME_TO_EXTENSION,
} from "../shared/music-constants";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

async function getMusicSettings() {
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: { pk: "SETTINGS", sk: "MUSIC" },
    })
  );

  return {
    maxFileSize: (result.Item?.maxFileSize as number) ?? DEFAULT_MAX_FILE_SIZE,
    maxTracks: (result.Item?.maxTracks as number) ?? DEFAULT_MAX_TRACKS,
    allowedFormats: (result.Item?.allowedFormats as string[]) ?? [...ALLOWED_AUDIO_MIME_TYPES],
  };
}

async function getCurrentTrackCount(): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: "byStatus",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": "MUSIC_TRACKS" },
      Select: "COUNT",
    })
  );
  return result.Count ?? 0;
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

  // Get settings and validate
  const settings = await getMusicSettings();
  const validation = validateMusicUpload(body, settings);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  // Check max tracks limit
  const currentCount = await getCurrentTrackCount();
  if (currentCount >= settings.maxTracks) {
    return createErrorResponse(400, `Maximum of ${settings.maxTracks} tracks reached`);
  }

  const { mimeType, fileSize } = validation.data;
  const trackId = uuidv4();
  const extension = MIME_TO_EXTENSION[mimeType] ?? "";
  const s3Key = `music/${trackId}${extension}`;

  // Generate presigned URL (valid for 10 minutes)
  const command = new PutObjectCommand({
    Bucket: Resource.WeddingImageBucket.name,
    Key: s3Key,
    ContentType: mimeType,
    ContentLength: fileSize,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

  return createResponse(200, {
    success: true,
    data: {
      uploadUrl: presignedUrl,
      trackId,
      s3Key,
      expiresIn: 600,
    },
  });
};
