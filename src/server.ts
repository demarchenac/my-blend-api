import { Hono } from "hono";
import { serve } from "@hono/node-server";
import puppeteer from "puppeteer";

const app = new Hono();

app.get("/", (c) => c.json({ status: "live" }));

app.get("/screenshot", async (c) => {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://example.com");

  const screenshot = await page.screenshot({ encoding: "base64" });
  await browser.close();

  return c.json({ screenshot });
});

// ✅ Correct way to start the server in Node.js
const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port });

console.log(`🚀 Server running on http://localhost:${port}`);
