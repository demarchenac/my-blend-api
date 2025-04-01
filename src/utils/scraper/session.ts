import { chromium, type LaunchOptions } from "@playwright/test";
import { fullLists, PlaywrightBlocker } from "@ghostery/adblocker-playwright";
import fetch from "cross-fetch";
import type { Session } from "./types.js";
import { Source } from "../sources/types.js";

export async function startSession(
  source: Source,
  { headless = true }: LaunchOptions = { headless: true }
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

export function withSession<ReturnType, Options extends object>(
  source: Source,
  scrape: (session: Session, options?: Options) => Promise<ReturnType>,
  launchOptions?: LaunchOptions
): (options?: Options) => Promise<ReturnType | null> {
  return async (options?: Options): Promise<ReturnType | null> => {
    const session = await startSession(source, launchOptions);
    if (!session) return null;

    const result = await scrape(session, options);

    await closeSession(session);

    return result;
  };
}
