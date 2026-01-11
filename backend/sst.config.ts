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
    const { table } = await import("./infra/database");
    const { api } = await import("./infra/api");

    return {
      apiUrl: api.url,
      tableName: table.name,
    };
  },
});
