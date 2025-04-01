import { chromium, type LaunchOptions } from "@playwright/test";
import { fullLists, PlaywrightBlocker } from "@ghostery/adblocker-playwright";
import fetch from "cross-fetch";
import type { Session } from "./types.js";
import { Source } from "../sources/types.js";

export async function startSession(
  source: Source,
  { headless = false }: LaunchOptions = { headless: false }
): Promise<Session> {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();

  if (headless) {
    await context.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("style").forEach((el) => el.remove());
      });
    });
  }

  const newPage = async (url?: string) => {
    const page = await context.newPage();

    const blocker = await PlaywrightBlocker.fromLists(fetch, fullLists, {
      enableCompression: true,
    });

    blocker.enableBlockingInPage(page);

    try {
      await page.goto(url ?? source.url);
    } catch (error) {
      await page.close();
      return null;
    }

    return page;
  };

  const page = await newPage();

  if (!page) return null;

  return { browser, page, newPage };
}

export async function closeSession(session: NonNullable<Session>) {
  await session.page.close();
  await session.browser.close();
}

export function withSession<T>(
  source: Source,
  scrape: (session: Session) => Promise<T>,
  options?: LaunchOptions
): () => Promise<T | null> {
  return async (): Promise<T | null> => {
    const session = await startSession(source, options);
    if (!session) return null;

    const result = await scrape(session);

    await closeSession(session);

    return result;
  };
}
