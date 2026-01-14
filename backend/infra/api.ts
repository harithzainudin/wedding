import { table } from "./database";

const functionConfig = {
  runtime: "nodejs22.x" as const,
};

export const api = new sst.aws.ApiGatewayV2("WeddingApi", {
  cors: {
    allowOrigins: [
      "http://localhost:5173",
      "http://192.168.0.2:5173",
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

// GET /rsvp - List all RSVPs (admin) - configured via addRsvpAuthRoutes for auth

// Function to add admin routes with secrets
export function addAdminRoutes(
  adminPassword: sst.Secret,
  brevoApiKey: sst.Secret,
  senderEmail: sst.Secret,
  adminLoginUrl: sst.Secret,
  tokenSecret: sst.Secret
) {
  // POST /admin/login - Admin login
  api.route("POST /admin/login", {
    handler: "src/functions/admin/login.handler",
    link: [adminPassword, table, tokenSecret],
    ...functionConfig,
  });

  // POST /admin/users - Create admin user (with email notification, master-only)
  api.route("POST /admin/users", {
    handler: "src/functions/admin/create.handler",
    link: [table, brevoApiKey, senderEmail, adminLoginUrl, tokenSecret],
    ...functionConfig,
  });

  // GET /admin/users - List admin users (auth required)
  api.route("GET /admin/users", {
    handler: "src/functions/admin/list.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });

  // DELETE /admin/users/{username} - Delete admin user (master-only)
  api.route("DELETE /admin/users/{username}", {
    handler: "src/functions/admin/delete.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });

  // PUT /admin/users/password - Change admin password (auth required)
  api.route("PUT /admin/users/password", {
    handler: "src/functions/admin/change-password.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });

  // GET /admin/users/me - Get current user profile (auth required)
  api.route("GET /admin/users/me", {
    handler: "src/functions/admin/get-profile.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });

  // PUT /admin/users/me/email - Update current user email (auth required)
  api.route("PUT /admin/users/me/email", {
    handler: "src/functions/admin/update-email.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}

// Function to add RSVP routes with token secret for protected endpoints
export function addRsvpAuthRoutes(tokenSecret: sst.Secret) {
  // Update GET /rsvp to require auth
  api.route("GET /rsvp", {
    handler: "src/functions/rsvp/list.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}

// Function to add image management routes
export function addImageRoutes(
  tokenSecret: sst.Secret,
  imageBucket: sst.aws.Bucket
) {
  // POST /images/presigned-url - Request presigned URL for upload
  api.route("POST /images/presigned-url", {
    handler: "src/functions/images/request-upload.handler",
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  });

  // POST /images/confirm - Confirm upload after successful S3 upload
  api.route("POST /images/confirm", {
    handler: "src/functions/images/confirm-upload.handler",
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  });

  // GET /images - List all images
  api.route("GET /images", {
    handler: "src/functions/images/list.handler",
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  });

  // DELETE /images/{id} - Delete an image
  api.route("DELETE /images/{id}", {
    handler: "src/functions/images/delete.handler",
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  });

  // PUT /images/reorder - Reorder images
  api.route("PUT /images/reorder", {
    handler: "src/functions/images/reorder.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });

  // GET /images/settings - Get image settings
  api.route("GET /images/settings", {
    handler: "src/functions/images/get-settings.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });

  // PUT /images/settings - Update image settings
  api.route("PUT /images/settings", {
    handler: "src/functions/images/update-settings.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}

// Function to add venue routes
export function addVenueRoutes(tokenSecret: sst.Secret) {
  // GET /venue - Public endpoint to fetch venue data
  api.route("GET /venue", {
    handler: "src/functions/venue/get.handler",
    link: [table],
    ...functionConfig,
  });

  // PUT /venue - Update venue data (auth required)
  api.route("PUT /venue", {
    handler: "src/functions/venue/update.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}

// Function to add wedding details routes
export function addWeddingDetailsRoutes(tokenSecret: sst.Secret) {
  // GET /wedding-details - Public endpoint to fetch wedding details
  api.route("GET /wedding-details", {
    handler: "src/functions/wedding-details/get.handler",
    link: [table],
    ...functionConfig,
  });

  // PUT /wedding-details - Update wedding details (auth required)
  api.route("PUT /wedding-details", {
    handler: "src/functions/wedding-details/update.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}

// Function to add schedule routes
export function addScheduleRoutes(tokenSecret: sst.Secret) {
  // GET /schedule - Public endpoint to fetch schedule
  api.route("GET /schedule", {
    handler: "src/functions/schedule/get.handler",
    link: [table],
    ...functionConfig,
  });

  // PUT /schedule - Update schedule (auth required)
  api.route("PUT /schedule", {
    handler: "src/functions/schedule/update.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}

// Function to add contacts routes
export function addContactsRoutes(tokenSecret: sst.Secret) {
  // GET /contacts - Public endpoint to fetch contacts
  api.route("GET /contacts", {
    handler: "src/functions/contacts/get.handler",
    link: [table],
    ...functionConfig,
  });

  // PUT /contacts - Update contacts (auth required)
  api.route("PUT /contacts", {
    handler: "src/functions/contacts/update.handler",
    link: [table, tokenSecret],
    ...functionConfig,
  });
}
