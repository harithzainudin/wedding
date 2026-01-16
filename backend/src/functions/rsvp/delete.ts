import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  let rsvpId: string | undefined;

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

    // Extract ID from path parameters
    rsvpId = event.pathParameters?.id;
    if (!rsvpId) {
      return createErrorResponse(400, "RSVP ID is required", context, "VALIDATION_ERROR");
    }

    // Verify the record exists
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `RSVP#${rsvpId}`,
          sk: "METADATA",
        },
      })
    );

    if (!existingResult.Item) {
      return createErrorResponse(404, "RSVP not found", context, "NOT_FOUND");
    }

    // Delete the record
    await docClient.send(
      new DeleteCommand({
        TableName: Resource.AppDataTable.name,
        Key: {
          pk: `RSVP#${rsvpId}`,
          sk: "METADATA",
        },
      })
    );

    return createSuccessResponse(200, {
      message: "RSVP deleted successfully",
    }, context);
  } catch (error) {
    logError({
      endpoint: "DELETE /rsvp/{id}",
      operation: "deleteRsvp",
      requestId: context.awsRequestId,
      input: { rsvpId },
    }, error);
    return createErrorResponse(500, "Internal server error", context, "DB_ERROR");
  }
};
