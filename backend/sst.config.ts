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

    const { table } = await import("./infra/database");
    const { api, addAdminRoutes } = await import("./infra/api");

    // Add admin routes with secret
    addAdminRoutes(adminPassword);

    return {
      apiUrl: api.url,
      tableName: table.name,
    };
  },
});
