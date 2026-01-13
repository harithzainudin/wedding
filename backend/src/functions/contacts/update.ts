import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireAuth } from "../shared/auth";
import {
  validateContactsUpdate,
  type ContactsData,
} from "../shared/contacts-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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

  const validation = validateContactsUpdate(body);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  try {
    const now = new Date().toISOString();

    const contactsItem = {
      pk: "SETTINGS",
      sk: "CONTACTS",
      contacts: validation.data.contacts,
      updatedAt: now,
      updatedBy: authResult.user.username,
    };

    await docClient.send(
      new PutCommand({
        TableName: Resource.AppDataTable.name,
        Item: contactsItem,
      })
    );

    const responseData: ContactsData = {
      contacts: contactsItem.contacts,
      updatedAt: contactsItem.updatedAt,
      updatedBy: contactsItem.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating contacts:", error);
    return createErrorResponse(500, "Failed to update contacts");
  }
};
