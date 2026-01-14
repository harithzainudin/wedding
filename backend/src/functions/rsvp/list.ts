import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface RsvpRecord {
  pk: string;
  sk: string;
  id: string;
  title: string;
  fullName: string;
  isAttending: boolean;
  numberOfGuests: number;
  phoneNumber: string;
  message: string;
  submittedAt: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  // Check authentication (optional - public can view wishes, admin gets full data)
  const authResult = requireAuth(event);
  const isAuthenticated = authResult.authenticated;

  try {
    // Get optional status filter from query params
    const status = event.queryStringParameters?.status;

    let items: RsvpRecord[] = [];

    if (status && ["attending", "not_attending"].includes(status)) {
      // Query by status using GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: "byStatus",
          KeyConditionExpression: "gsi1pk = :status",
          ExpressionAttributeValues: {
            ":status": `STATUS#${status}`,
          },
          ScanIndexForward: false, // Most recent first
        })
      );
      items = (result.Items ?? []) as RsvpRecord[];
    } else {
      // Scan all RSVPs
      const result = await docClient.send(
        new ScanCommand({
          TableName: Resource.AppDataTable.name,
          FilterExpression: "begins_with(pk, :prefix)",
          ExpressionAttributeValues: {
            ":prefix": "RSVP#",
          },
        })
      );
      items = (result.Items ?? []) as RsvpRecord[];
    }

    // Transform items for response
    const rsvps = items.map((item) => ({
      id: item.id,
      title: item.title,
      fullName: item.fullName,
      isAttending: item.isAttending,
      numberOfGuests: item.numberOfGuests,
      phoneNumber: item.phoneNumber,
      message: item.message,
      submittedAt: item.submittedAt,
    }));

    // Public response - only wishes for guestbook (no sensitive data)
    if (!isAuthenticated) {
      const wishes = rsvps
        .filter((r) => r.message && r.message.trim() !== "")
        .map((r) => ({
          title: r.title,
          fullName: r.fullName,
          message: r.message,
          submittedAt: r.submittedAt,
        }));

      return createSuccessResponse(200, { rsvps: wishes }, context);
    }

    // Authenticated response - full data with summary statistics
    const attending = rsvps.filter((r) => r.isAttending);
    const totalGuests = attending.reduce((sum, r) => sum + r.numberOfGuests, 0);

    return createSuccessResponse(200, {
      rsvps,
      summary: {
        total: rsvps.length,
        attending: attending.length,
        notAttending: rsvps.length - attending.length,
        totalGuests,
      },
    }, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error listing RSVPs:", {
      requestId: context.awsRequestId,
      error: errorMessage,
    });
    return createErrorResponse(500, "Internal server error", context, "DB_ERROR");
  }
};
