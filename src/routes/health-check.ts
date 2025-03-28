import { chromium } from "@playwright/test";
import { Hono } from "hono";

const healthCheck = new Hono();

healthCheck.get("/", (c) => c.json({ ok: true }));

healthCheck.get("/example", async (c) => {
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto("https://example.com");

  const buffer = await page.screenshot();
  const screenshot = buffer.toString("base64");

  await browser.close();

  return c.json({ screenshot });
});

export { healthCheck };
