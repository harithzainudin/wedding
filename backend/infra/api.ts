import { table } from "./database";

export const api = new sst.aws.ApiGatewayV2("WeddingApi", {
  cors: {
    allowOrigins: [
      "http://localhost:5173",
      "https://harithzainudin.github.io",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowCredentials: false,
  },
});

// POST /rsvp - Submit RSVP
api.route("POST /rsvp", {
  handler: "src/functions/rsvp/submit.handler",
  link: [table],
});

// GET /rsvp - List all RSVPs (admin)
api.route("GET /rsvp", {
  handler: "src/functions/rsvp/list.handler",
  link: [table],
});
