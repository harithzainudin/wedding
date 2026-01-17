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
    const { api, addAdminRoutes, addRsvpAuthRoutes, addImageRoutes, addVenueRoutes, addWeddingDetailsRoutes, addScheduleRoutes, addContactsRoutes, addThemeRoutes, addMusicRoutes, addGiftRoutes, addParkingRoutes, addQRCodeHubRoutes, addAuthRoutes, addSuperAdminRoutes } = await import("./infra/api");
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

    // Add theme routes
    addThemeRoutes(tokenSecret);

    // Add music management routes
    addMusicRoutes(tokenSecret, imageBucket);

    // Add gift registry routes
    addGiftRoutes(tokenSecret, imageBucket);

    // Add parking image routes
    addParkingRoutes(tokenSecret, imageBucket);

    // Add QR Code Hub routes
    addQRCodeHubRoutes(tokenSecret, imageBucket);

    // ============================================
    // MULTI-TENANT ROUTES
    // ============================================

    // Add unified auth routes (multi-tenant login/refresh)
    addAuthRoutes(adminPassword, tokenSecret);

    // Add super admin routes (wedding management)
    addSuperAdminRoutes(tokenSecret, brevoApiKey, senderEmail, adminLoginUrl);

    return {
      apiUrl: api.url,
      tableName: table.name,
      imageBucketName: imageBucket.name,
    };
  },
});
