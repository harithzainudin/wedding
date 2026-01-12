/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "wedding",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage ?? ""),
      home: "aws",
      providers: {
        aws: {
          region: "ap-southeast-5",
        },
      },
    };
  },
  async run() {
    // Admin password secret
    const adminPassword = new sst.Secret("AdminPassword");

    // Email configuration secrets
    const brevoApiKey = new sst.Secret("BrevoApiKey");
    const senderEmail = new sst.Secret("SenderEmail");
    const adminLoginUrl = new sst.Secret("AdminLoginUrl");

    // Token secret for authentication
    const tokenSecret = new sst.Secret("TokenSecret");

    const { table } = await import("./infra/database");
    const { api, addAdminRoutes, addRsvpAuthRoutes } = await import("./infra/api");

    // Add admin routes with secrets
    addAdminRoutes(adminPassword, brevoApiKey, senderEmail, adminLoginUrl, tokenSecret);

    // Add RSVP routes with auth
    addRsvpAuthRoutes(tokenSecret);

    return {
      apiUrl: api.url,
      tableName: table.name,
    };
  },
});
