import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { logError } from "../shared/logger";
import type {
  MultilingualText,
  GiftCategory,
  GiftPriority,
} from "../shared/gift-validation";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface GiftItem {
  id: string;
  name: MultilingualText;
  description: MultilingualText;
  imageUrl?: string;
  externalLink: string;
  priceRange: string;
  category: GiftCategory;
  priority: GiftPriority;
  notes?: string;
  quantityTotal: number;
  quantityReserved: number;
  order: number;
  createdAt: string;
}

interface GiftSettings {
  enabled: boolean;
  maxItems: number;
  maxFileSize: number;
  allowedFormats: string[];
}

const DEFAULT_SETTINGS: GiftSettings = {
  enabled: false,
  maxItems: 50,
  maxFileSize: 5 * 1024 * 1024,
  allowedFormats: ["image/jpeg", "image/png", "image/webp"],
};

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    // Get gift settings to check if feature is enabled
    const settingsResult = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "GIFTS" },
      }),
    );

    const settings: GiftSettings = settingsResult.Item
      ? {
          enabled: settingsResult.Item.enabled ?? DEFAULT_SETTINGS.enabled,
          maxItems: settingsResult.Item.maxItems ?? DEFAULT_SETTINGS.maxItems,
          maxFileSize:
            settingsResult.Item.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFormats:
            settingsResult.Item.allowedFormats ??
            DEFAULT_SETTINGS.allowedFormats,
        }
      : DEFAULT_SETTINGS;

    // If feature is disabled, return empty list for public users
    if (!settings.enabled) {
      return createSuccessResponse(
        200,
        {
          gifts: [],
          total: 0,
          enabled: false,
        },
        context,
      );
    }

    // Query all gifts using GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: Resource.AppDataTable.name,
        IndexName: "byStatus",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "GIFTS",
        },
      }),
    );

    const gifts: GiftItem[] = (result.Items ?? [])
      .map((item) => ({
        id: item.id as string,
        name: item.name as MultilingualText,
        description: item.description as MultilingualText,
        imageUrl: item.imageUrl as string | undefined,
        externalLink: item.externalLink as string,
        priceRange: item.priceRange as string,
        category: item.category as GiftCategory,
        priority: item.priority as GiftPriority,
        notes: item.notes as string | undefined,
        quantityTotal: item.quantityTotal as number,
        quantityReserved: item.quantityReserved as number,
        order: item.order as number,
        createdAt: item.createdAt as string,
      }))
      .sort((a, b) => a.order - b.order);

    return createSuccessResponse(
      200,
      {
        gifts,
        total: gifts.length,
        enabled: true,
      },
      context,
    );
  } catch (error) {
    logError(
      {
        endpoint: "GET /gifts",
        operation: "listGifts",
        requestId: context.awsRequestId,
      },
      error,
    );
    return createErrorResponse(
      500,
      "Internal server error",
      context,
      "DB_ERROR",
    );
  }
};
