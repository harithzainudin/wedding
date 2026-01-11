import type { APIGatewayProxyResultV2 } from "aws-lambda";

export function createResponse<T>(
  statusCode: number,
  body: T
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

export function createErrorResponse(
  statusCode: number,
  message: string
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  };
}
