import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { chromium } from "playwright";

const app = new Hono();

app.get("/", (c) => c.json({ status: "live" }));

app.get("/screenshot", async (c) => {
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto("https://example.com");

  const buffer = await page.screenshot();
  const screenshot = buffer.toString("base64");

  await browser.close();

  return c.json({ screenshot });
});

// Iniciar servidor con Hono.js
const port = Number(process.env.PORT) || 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Server running on http://localhost:${port}`);
