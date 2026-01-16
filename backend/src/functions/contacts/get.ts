import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createSuccessResponse, createErrorResponse } from "../shared/response";
import { logError } from "../shared/logger";
import {
  DEFAULT_CONTACTS,
  type ContactsData,
} from "../shared/contacts-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async (_event, context) => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "CONTACTS" },
      }),
    );

    if (!result.Item) {
      // Return default contacts if none exists in database
      return createSuccessResponse(200, DEFAULT_CONTACTS, context);
    }

    const contactsData: ContactsData = {
      contacts: result.Item.contacts,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createSuccessResponse(200, contactsData, context);
  } catch (error) {
    logError(
      {
        endpoint: "GET /contacts",
        operation: "fetchContacts",
        requestId: context.awsRequestId,
      },
      error,
    );
    return createErrorResponse(
      500,
      "Failed to fetch contacts",
      context,
      "DB_ERROR",
    );
  }
};
