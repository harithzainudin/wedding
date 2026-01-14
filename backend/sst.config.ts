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
    const { api, addAdminRoutes, addRsvpAuthRoutes, addImageRoutes, addVenueRoutes, addWeddingDetailsRoutes, addScheduleRoutes, addContactsRoutes, addMusicRoutes } = await import("./infra/api");
    const { imageBucket } = await import("./infra/storage");

    // Add admin routes with secrets
    addAdminRoutes(adminPassword, brevoApiKey, senderEmail, adminLoginUrl, tokenSecret);

    // Add RSVP routes with auth
    addRsvpAuthRoutes(tokenSecret);

    // Add image management routes
    addImageRoutes(tokenSecret, imageBucket);

    // Add venue routes
    addVenueRoutes(tokenSecret);

    // Add wedding details routes
    addWeddingDetailsRoutes(tokenSecret);

    // Add schedule routes
    addScheduleRoutes(tokenSecret);

    // Add contacts routes
    addContactsRoutes(tokenSecret);

    // Add music management routes
    addMusicRoutes(tokenSecret, imageBucket);

    return {
      apiUrl: api.url,
      tableName: table.name,
      imageBucketName: imageBucket.name,
    };
  },
});
