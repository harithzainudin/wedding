import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error, context, "AUTH_ERROR");
  }

  const imageId = event.pathParameters?.id;
  if (!imageId) {
    return createErrorResponse(400, "Image ID is required", context, "VALIDATION_ERROR");
  }

  // Get the image record
  const getResult = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: { pk: `IMAGE#${imageId}`, sk: "METADATA" },
    })
  );

  if (!getResult.Item) {
    return createErrorResponse(404, "Image not found", context, "NOT_FOUND");
  }

  const s3Key = getResult.Item.s3Key as string;

  // Delete from S3
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    );
  } catch (error) {
    console.error("Error deleting from S3:", error);
    // Continue to delete DB record even if S3 fails
  }

  // Delete from DynamoDB
  await docClient.send(
    new DeleteCommand({
      TableName: Resource.AppDataTable.name,
      Key: { pk: `IMAGE#${imageId}`, sk: "METADATA" },
    })
  );

  return createSuccessResponse(200, {
    message: "Image deleted successfully",
  }, context);
};
