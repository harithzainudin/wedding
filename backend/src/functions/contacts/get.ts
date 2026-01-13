import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { createResponse, createErrorResponse } from "../shared/response";
import { DEFAULT_CONTACTS, type ContactsData } from "../shared/contacts-validation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: Resource.AppDataTable.name,
        Key: { pk: "SETTINGS", sk: "CONTACTS" },
      })
    );

    if (!result.Item) {
      // Return default contacts if none exists in database
      return createResponse(200, {
        success: true,
        data: DEFAULT_CONTACTS,
      });
    }

    const contactsData: ContactsData = {
      contacts: result.Item.contacts,
      updatedAt: result.Item.updatedAt,
      updatedBy: result.Item.updatedBy,
    };

    return createResponse(200, {
      success: true,
      data: contactsData,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return createErrorResponse(500, "Failed to fetch contacts");
  }
};
