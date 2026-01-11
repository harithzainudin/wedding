import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createResponse, createErrorResponse } from "../shared/response";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface CreateAdminRequest {
  username: string;
  password: string;
  createdBy?: string;
}

interface AdminUser {
  username: string;
  createdAt: string;
  createdBy: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return createErrorResponse(400, "Missing request body");
  }

  let body: CreateAdminRequest;
  try {
    body = JSON.parse(event.body) as CreateAdminRequest;
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  // Validate input
  if (!body.username || body.username.trim().length < 3) {
    return createErrorResponse(400, "Username must be at least 3 characters");
  }

  if (!body.password || body.password.length < 6) {
    return createErrorResponse(400, "Password must be at least 6 characters");
  }

  const username = body.username.trim().toLowerCase();

  // Check if username already exists
  const existingUser = await docClient.send(
    new GetCommand({
      TableName: Resource.RsvpTable.name,
      Key: {
        pk: `ADMIN#${username}`,
        sk: "PROFILE",
      },
    })
  );

  if (existingUser.Item) {
    return createErrorResponse(409, "Username already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(body.password, salt);

  const now = new Date().toISOString();

  // Create admin user
  await docClient.send(
    new PutCommand({
      TableName: Resource.RsvpTable.name,
      Item: {
        pk: `ADMIN#${username}`,
        sk: "PROFILE",
        username,
        passwordHash,
        createdAt: now,
        createdBy: body.createdBy ?? "system",
        gsi1pk: "ADMIN",
        gsi1sk: now,
      },
    })
  );

  const adminUser: AdminUser = {
    username,
    createdAt: now,
    createdBy: body.createdBy ?? "system",
  };

  return createResponse(201, {
    success: true,
    data: adminUser,
  });
};
