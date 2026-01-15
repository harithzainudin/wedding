/**
 * Standardized error logging utility for API endpoints
 * Produces structured JSON logs for easy debugging in CloudWatch
 */

const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "authorization",
]);

interface LogContext {
  endpoint: string;
  operation: string;
  requestId: string;
  input?: Record<string, unknown>;
}

function sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeInput(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function logError(context: LogContext, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logEntry = {
    level: "ERROR",
    endpoint: context.endpoint,
    operation: context.operation,
    requestId: context.requestId,
    ...(context.input && { input: sanitizeInput(context.input) }),
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(logEntry));
}
