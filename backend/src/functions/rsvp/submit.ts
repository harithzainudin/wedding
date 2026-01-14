import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { validateRsvpInput } from "../shared/validation";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? "{}");
    } catch {
      return createErrorResponse(400, "Invalid JSON in request body", context, "INVALID_JSON");
    }

    // Validate input
    const validation = validateRsvpInput(body);
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
    }

    const { data } = validation;

    // Generate unique ID and timestamp
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const status = data.isAttending ? "attending" : "not_attending";

    // Create RSVP record
    const rsvpItem = {
      pk: `RSVP#${id}`,
      sk: "METADATA",
      gsi1pk: `STATUS#${status}`,
      gsi1sk: timestamp,
      id,
      title: data.title,
      fullName: data.fullName,
      isAttending: data.isAttending,
      numberOfGuests: data.numberOfGuests,
      phoneNumber: data.phoneNumber,
      message: data.message ?? "",
      submittedAt: timestamp,
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: rsvpItem,
      })
    );

    return createSuccessResponse(201, {
      id,
      submittedAt: timestamp,
    }, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error submitting RSVP:", {
      requestId: context.awsRequestId,
      error: errorMessage,
    });
    return createErrorResponse(500, "Internal server error", context, "DB_ERROR");
  }
};
