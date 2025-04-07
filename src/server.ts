import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { healthCheck } from "./routes/health-check.js";
import { sources } from "./routes/sources.js";
import { series } from "./routes/series.js";

const app = new Hono();

app.use(prettyJSON());
app.use(logger());
app.use(poweredBy());

app.notFound((c) => c.json({ ok: false }, 404));

app.get("/docs", swaggerUI({ url: "/doc" }));

app.route("/health-check", healthCheck);
app.route("/sources", sources);
app.route("/series", series);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port });

console.log(`🚀 Server running on port: ${port}`);
console.log(`- Locally: http://localhost:${port}`);
