import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { validateConfirmUpload } from "../shared/image-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

function padOrder(order: number): string {
  return `ORDER#${order.toString().padStart(5, "0")}`;
}

async function getNextOrder(): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Resource.AppDataTable.name,
      IndexName: "byStatus",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": "IMAGES" },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  if (result.Items && result.Items.length > 0) {
    const firstItem = result.Items[0];
    return ((firstItem?.order as number) ?? 0) + 1;
  }
  return 1;
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

  const validation = validateConfirmUpload(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  const { imageId, s3Key, filename, mimeType } = validation.data;

  // Verify the file exists in S3
  try {
    const headResult = await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.WeddingImageBucket.name,
        Key: s3Key,
      })
    );

    const fileSize = headResult.ContentLength ?? 0;
    const order = await getNextOrder();
    const now = new Date().toISOString();

    // Create image record in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: {
          pk: `IMAGE#${imageId}`,
          sk: "METADATA",
          gsi1pk: "IMAGES",
          gsi1sk: padOrder(order),
          id: imageId,
          filename,
          s3Key,
          mimeType,
          fileSize,
          order,
          uploadedAt: now,
          uploadedBy: authResult.user.username,
        },
      })
    );

    // Construct the public URL for the image
    const bucketName = Resource.WeddingImageBucket.name;
    const region = process.env.AWS_REGION ?? "ap-southeast-5";
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

    return createResponse(201, {
      success: true,
      data: {
        id: imageId,
        filename,
        s3Key,
        mimeType,
        fileSize,
        order,
        uploadedAt: now,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error("Error confirming upload:", error);
    return createErrorResponse(400, "File not found in S3. Upload may have failed.");
  }
};
