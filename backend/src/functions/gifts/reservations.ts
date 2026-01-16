import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import { logError } from "../shared/logger";
import type { MultilingualText } from "../shared/gift-validation";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ReservationWithGift {
  id: string;
  giftId: string;
  giftName: MultilingualText;
  guestName: string;
  guestPhone: string;
  rsvpId?: string;
  quantity: number;
  message?: string;
  reservedAt: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
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

    // Optional filter by giftId
    const giftIdFilter = event.queryStringParameters?.giftId;

    let reservations: ReservationWithGift[] = [];

    if (giftIdFilter) {
      // Query reservations for a specific gift
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
          ExpressionAttributeValues: {
            ":pk": `GIFT#${giftIdFilter}`,
            ":skPrefix": "RESERVATION#",
          },
        })
      );

      // Get the gift details
      const giftResult = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: {
            ":pk": `GIFT#${giftIdFilter}`,
            ":sk": "METADATA",
          },
        })
      );

      const gift = giftResult.Items?.[0];
      const giftName = (gift?.name as MultilingualText) ?? { ms: "", en: "", zh: "", ta: "" };

      reservations = (result.Items ?? []).map((item) => ({
        id: item.id as string,
        giftId: item.giftId as string,
        giftName,
        guestName: item.guestName as string,
        guestPhone: item.guestPhone as string,
        rsvpId: item.rsvpId as string | undefined,
        quantity: item.quantity as number,
        message: item.message as string | undefined,
        reservedAt: item.reservedAt as string,
      }));
    } else {
      // Query all reservations using GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: Resource.AppDataTable.name,
          IndexName: "byStatus",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "RESERVATIONS",
          },
          ScanIndexForward: false, // Most recent first
        })
      );

      const reservationItems = result.Items ?? [];

      // Get unique gift IDs
      const giftIds = [...new Set(reservationItems.map((item) => item.giftId as string))];

      // Batch get gift details
      let giftMap: Record<string, MultilingualText> = {};
      if (giftIds.length > 0) {
        // BatchGet has a limit of 100 items
        for (let i = 0; i < giftIds.length; i += 100) {
          const batchIds = giftIds.slice(i, i + 100);
          const batchResult = await docClient.send(
            new BatchGetCommand({
              RequestItems: {
                [Resource.AppDataTable.name]: {
                  Keys: batchIds.map((id) => ({
                    pk: `GIFT#${id}`,
                    sk: "METADATA",
                  })),
                },
              },
            })
          );

          const gifts = batchResult.Responses?.[Resource.AppDataTable.name] ?? [];
          for (const gift of gifts) {
            giftMap[gift.id as string] = gift.name as MultilingualText;
          }
        }
      }

      reservations = reservationItems.map((item) => ({
        id: item.id as string,
        giftId: item.giftId as string,
        giftName: giftMap[item.giftId as string] ?? { ms: "", en: "", zh: "", ta: "" },
        guestName: item.guestName as string,
        guestPhone: item.guestPhone as string,
        rsvpId: (item.rsvpId as string) || undefined,
        quantity: item.quantity as number,
        message: (item.message as string) || undefined,
        reservedAt: item.reservedAt as string,
      }));
    }

    // Sort by reservedAt (most recent first)
    reservations.sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime());

    // Calculate summary
    const totalReservations = reservations.length;
    const totalQuantity = reservations.reduce((sum, r) => sum + r.quantity, 0);
    const uniqueGuests = new Set(reservations.map((r) => r.guestPhone)).size;

    return createSuccessResponse(200, {
      reservations,
      summary: {
        totalReservations,
        totalQuantity,
        uniqueGuests,
      },
    }, context);
  } catch (error) {
    logError({
      endpoint: "GET /gifts/reservations",
      operation: "listReservations",
      requestId: context.awsRequestId,
    }, error);
    return createErrorResponse(500, "Internal server error", context, "DB_ERROR");
  }
};
