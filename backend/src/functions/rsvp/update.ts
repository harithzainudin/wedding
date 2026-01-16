import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const VALID_TITLES = [
  "Tan Sri",
  "Puan Sri",
  "Dato' Seri",
  "Datin Seri",
  "Dato'",
  "Datin",
  "Tuan",
  "Puan",
  "Encik",
  "Cik",
] as const;

type HonorificTitle = (typeof VALID_TITLES)[number];

interface AdminRsvpInput {
  title?: string;
  fullName: string;
  isAttending: boolean;
  numberOfGuests: number;
  phoneNumber?: string;
  message?: string;
}

function validateAdminRsvpInput(input: unknown): {
  valid: true;
  data: AdminRsvpInput;
} | { valid: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { valid: false, error: "Invalid request body" };
  }

  const body = input as Record<string, unknown>;

  // Validate fullName (required)
  if (typeof body.fullName !== "string" || body.fullName.trim().length < 2) {
    return {
      valid: false,
      error: "Full name is required and must be at least 2 characters",
    };
  }

  // Validate title (optional, but must be valid if provided)
  if (body.title !== undefined && body.title !== "") {
    if (
      typeof body.title !== "string" ||
      !VALID_TITLES.includes(body.title as HonorificTitle)
    ) {
      return { valid: false, error: "Invalid title selected" };
    }
  }

  // Validate attendance (required)
  if (typeof body.isAttending !== "boolean") {
    return { valid: false, error: "Attendance status is required" };
  }

  // Validate number of guests
  if (body.isAttending) {
    if (
      typeof body.numberOfGuests !== "number" ||
      body.numberOfGuests < 1 ||
      body.numberOfGuests > 10
    ) {
      return {
        valid: false,
        error: "Number of guests must be between 1 and 10",
      };
    }
  }

  // Validate phoneNumber (optional)
  let cleanPhone = "";
  if (body.phoneNumber !== undefined && body.phoneNumber !== "") {
    if (typeof body.phoneNumber !== "string") {
      return { valid: false, error: "Phone number must be a string" };
    }
    cleanPhone = body.phoneNumber.replace(/[-\s]/g, "");
    const phoneRegex = /^(\+?60|0)[1-9]\d{7,9}$/;
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      return { valid: false, error: "Invalid phone number format" };
    }
  }

  // Validate message (optional)
  if (body.message !== undefined) {
    if (typeof body.message !== "string") {
      return { valid: false, error: "Message must be a string" };
    }
    if (body.message.length > 500) {
      return { valid: false, error: "Message must be less than 500 characters" };
    }
  }

  return {
    valid: true,
    data: {
      title: body.title as string | undefined,
      fullName: body.fullName.trim(),
      isAttending: body.isAttending,
      numberOfGuests: body.isAttending ? (body.numberOfGuests as number) : 0,
      phoneNumber: cleanPhone || undefined,
      message: typeof body.message === "string" ? body.message.trim() : undefined,
    },
  };
}

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

    // Fetch existing record
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

    const existingItem = existingResult.Item;

    // Parse request body
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? "{}");
    } catch {
      return createErrorResponse(400, "Invalid JSON in request body", context, "INVALID_JSON");
    }

    // Validate input
    const validation = validateAdminRsvpInput(body);
    if (!validation.valid) {
      return createErrorResponse(400, validation.error, context, "VALIDATION_ERROR");
    }

    const { data } = validation;
    const timestamp = new Date().toISOString();
    const status = data.isAttending ? "attending" : "not_attending";

    // Update RSVP record (preserving original submittedAt and source)
    const updatedItem = {
      pk: `RSVP#${rsvpId}`,
      sk: "METADATA",
      gsi1pk: `STATUS#${status}`,
      gsi1sk: existingItem.submittedAt, // Keep original submission time for ordering
      id: rsvpId,
      title: data.title ?? "",
      fullName: data.fullName,
      isAttending: data.isAttending,
      numberOfGuests: data.numberOfGuests,
      phoneNumber: data.phoneNumber ?? "",
      message: data.message ?? "",
      submittedAt: existingItem.submittedAt, // Preserve original
      source: existingItem.source ?? "public", // Preserve original source
      createdBy: existingItem.createdBy, // Preserve original creator
      updatedAt: timestamp,
      updatedBy: authResult.user.username,
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: updatedItem,
      })
    );

    return createSuccessResponse(200, {
      id: rsvpId,
      updatedAt: timestamp,
    }, context);
  } catch (error) {
    logError({
      endpoint: "PUT /rsvp/{id}",
      operation: "updateRsvp",
      requestId: context.awsRequestId,
      input: { rsvpId },
    }, error);
    return createErrorResponse(500, "Internal server error", context, "DB_ERROR");
  }
};
