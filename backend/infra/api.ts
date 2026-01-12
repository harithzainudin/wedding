import { table } from "./database";

const functionConfig = {
  runtime: "nodejs22.x" as const,
};

export const api = new sst.aws.ApiGatewayV2("WeddingApi", {
  cors: {
    allowOrigins: [
      "http://localhost:5173",
      "https://harithzainudin.github.io",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowCredentials: false,
  },
});

// POST /rsvp - Submit RSVP
api.route("POST /rsvp", {
  handler: "src/functions/rsvp/submit.handler",
  link: [table],
  ...functionConfig,
});

// GET /rsvp - List all RSVPs (admin)
api.route("GET /rsvp", {
  handler: "src/functions/rsvp/list.handler",
  link: [table],
  ...functionConfig,
});

// Function to add admin routes with secrets
export function addAdminRoutes(
  adminPassword: sst.Secret,
  brevoApiKey: sst.Secret,
  senderEmail: sst.Secret,
  adminLoginUrl: sst.Secret
) {
  // POST /admin/login - Admin login
  api.route("POST /admin/login", {
    handler: "src/functions/admin/login.handler",
    link: [adminPassword, table],
    ...functionConfig,
  });

  // POST /admin/users - Create admin user (with email notification)
  api.route("POST /admin/users", {
    handler: "src/functions/admin/create.handler",
    link: [table, brevoApiKey, senderEmail, adminLoginUrl],
    ...functionConfig,
  });

  // GET /admin/users - List admin users
  api.route("GET /admin/users", {
    handler: "src/functions/admin/list.handler",
    link: [table],
    ...functionConfig,
  });

  // DELETE /admin/users/{username} - Delete admin user
  api.route("DELETE /admin/users/{username}", {
    handler: "src/functions/admin/delete.handler",
    link: [table],
    ...functionConfig,
  });

  // PUT /admin/users/password - Change admin password
  api.route("PUT /admin/users/password", {
    handler: "src/functions/admin/change-password.handler",
    link: [table],
    ...functionConfig,
  });
}
