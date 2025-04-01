import type { Locator, Page } from "@playwright/test";
import type { Comic } from "../types.js";
import { asuraSource as source } from "../constants.js";
import { Session } from "../../scraper/types.js";

export async function scrapeUrlFromPaginationHandle(handle: Locator) {
  const url = await handle.getAttribute("href");
  return source.url.concat(url as string);
}

export async function scrapeComicFromPaginationHandle(handle: Locator): Promise<Comic> {
  const url = (await handle.getAttribute("href")) ?? "";
  const image = (await handle.locator("img").getAttribute("src")) ?? "";
  const spans = await handle.locator("span").all();
  const texts = await Promise.all(spans.map((span) => span.textContent()));
  const [status, type, name, lastChapter, ratingText] = texts.map((text) => (text ?? "").trim());
  const rating = Number(ratingText);

  return { name, status, type, rating, url, image, source };
}

export async function scrapeComicPage(session: NonNullable<Session>, url: string): Promise<Comic | null> {
  let page: Page;

  try {
    const newPage = await session.newPage(url);
    if (!newPage) return null;
    page = newPage;
  } catch (error) {
    return null;
  }

  const name = (await page.locator("span.text-xl").last().textContent()) ?? "";
  const metadata = page.locator(".rounded").first().locator("..");
  const image = await metadata.getByRole("img", { name: "poster" }).getAttribute("src");
  const rating = (await metadata.locator("p").nth(1).textContent()) ?? "";
  const h3s = await metadata.locator("h3").all();
  const [_, status, __, type] = await Promise.all(h3s.map((h3) => h3.textContent()));

  const comic: Comic = {
    name,
    url,
    source,
    status: (status ?? "").toLowerCase(),
    type: (type ?? "").toLowerCase(),
    rating: Number(rating),
    image: image ?? "",
  };

  await page.close();

  return comic;
}

export async function scrapeFromPagination<T>(session: NonNullable<Session>, parser: (locator: Locator) => Promise<T>) {
  let canGoNext: boolean;
  let results: T[] = [];

  // wait for the series page to load
  const comicHandlesLocator = session.page.locator("div.grid > a");

  try {
    await comicHandlesLocator.last().waitFor({ state: "visible", timeout: 1500 });
  } catch (error) {
    return results;
  }

  do {
    const nextButton = session.page.getByText("Next");
    canGoNext = await nextButton.evaluate((el) => el.style.pointerEvents !== "none");

    const comicHandles = await comicHandlesLocator.all();
    const currentUrl = new URL(session.page.url()).toString();

    const parsed = await Promise.all(comicHandles.map((handle) => parser(handle)));

    results = results.concat(parsed);

    if (!canGoNext) return results;

    await Promise.all([
      session.page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 1500 }),
      nextButton.scrollIntoViewIfNeeded(),
      nextButton.click(),
    ]).catch(() => {
      console.log("-> failed to interact with pagination page");
      canGoNext = false;
    });
  } while (canGoNext);

  return results;
}
