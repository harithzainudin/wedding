import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createResponse, createErrorResponse } from "../shared/response";
import { requireMaster } from "../shared/auth";
import { Resource } from "sst";
import { sendPasswordResetEmail } from "../../services/email";
import crypto from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ForceResetPasswordResponse {
  success: boolean;
  message?: string;
  temporaryPassword?: string;
  emailSent?: boolean;
  emailError?: string;
}

function generateTemporaryPassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      password += chars[byte % chars.length];
    }
  }
  return password;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Require master admin access
  const authResult = requireMaster(event);
  if (!authResult.authenticated) {
    return createErrorResponse(authResult.statusCode, authResult.error);
  }

  // Get username from path parameters
  const targetUsername = event.pathParameters?.username?.trim().toLowerCase();

  if (!targetUsername) {
    return createErrorResponse(400, "Username is required");
  }

  // Prevent resetting master account password
  if (targetUsername === "master") {
    return createErrorResponse(403, "Cannot reset master account password");
  }

  // Fetch user from DynamoDB
  const result = await docClient.send(
    new GetCommand({
      TableName: Resource.AppDataTable.name,
      Key: {
        pk: `ADMIN#${targetUsername}`,
        sk: "PROFILE",
      },
    })
  );

  if (!result.Item) {
    return createErrorResponse(404, "User not found");
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword(12);

  // Hash the temporary password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(temporaryPassword, salt);

  // Update user in DynamoDB
  await docClient.send(
    new UpdateCommand({
      TableName: Resource.AppDataTable.name,
      Key: {
        pk: `ADMIN#${targetUsername}`,
        sk: "PROFILE",
      },
      UpdateExpression: "SET passwordHash = :hash, mustChangePassword = :must, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":hash": passwordHash,
        ":must": true,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  // Send password reset email if user has email
  let emailSent = false;
  let emailError: string | undefined;
  const userEmail = result.Item.email as string | undefined;

  if (userEmail) {
    const emailResult = await sendPasswordResetEmail({
      recipientEmail: userEmail,
      username: targetUsername,
      temporaryPassword: temporaryPassword,
    });

    emailSent = emailResult.success;
    if (!emailResult.success) {
      emailError = emailResult.error;
      console.error(`Failed to send password reset email to ${userEmail}:`, emailResult.error);
    }
  }

  return createResponse<ForceResetPasswordResponse>(200, {
    success: true,
    message: emailSent
      ? "Password reset successfully. Email sent with temporary password."
      : userEmail
        ? "Password reset successfully. Email failed to send - please share the temporary password manually."
        : "Password reset successfully. User has no email - please share the temporary password manually.",
    temporaryPassword,
    emailSent,
    ...(emailError && { emailError }),
  });
};
