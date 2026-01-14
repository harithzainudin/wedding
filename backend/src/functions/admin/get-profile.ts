import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface AdminProfile {
  username: string;
  email?: string;
  createdAt: string;
  createdBy: string;
}

interface GetProfileResponse {
  success: boolean;
  data?: AdminProfile;
  error?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Require authentication
  const authResult = requireAuth(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error);
  }

  const username = authResult.user.username;

  // Master user doesn't have a stored profile
  if (username === "master") {
    return createResponse<GetProfileResponse>(200, {
      success: true,
      data: {
        username: "master",
        createdAt: "",
        createdBy: "system",
      },
    });
  }

  // Fetch user profile from DynamoDB
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: {
        pk: `ADMIN#${username}`,
        sk: "PROFILE",
      },
    })
  );

  if (!result.Item) {
    return createErrorResponse(404, "Profile not found");
  }

  return createResponse<GetProfileResponse>(200, {
    success: true,
    data: {
      username: result.Item.username as string,
      email: result.Item.email as string | undefined,
      createdAt: result.Item.createdAt as string,
      createdBy: result.Item.createdBy as string,
    },
  });
};
