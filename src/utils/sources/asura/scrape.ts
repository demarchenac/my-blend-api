import type { Locator, Page } from "@playwright/test";
import type { Comic, PaginatedComic } from "../types.js";
import { asuraSource as source } from "../constants.js";
import { Session } from "../../scraper/types.js";

export async function scrapeUrlFromPaginationHandle(handle: Locator) {
  const url = await handle.getAttribute("href");
  return source.url.concat(url as string);
}

export async function scrapeComicFromPaginationHandle(handle: Locator): Promise<PaginatedComic> {
  const url = (await handle.getAttribute("href")) ?? "";
  const slug = url.replace("series/", "");
  const image = (await handle.locator("img").getAttribute("src")) ?? "";
  const spans = await handle.locator("span").all();
  const texts = await Promise.all(spans.map((span) => span.textContent()));
  const [status, type, name, _, ratingText] = texts.map((text) => (text ?? "").trim());
  const rating = Number(ratingText);

  return { name, status, type, rating, slug, image, source };
}

export async function scrapeComicPage(
  session: NonNullable<Session>,
  url: string
): Promise<Comic | null> {
  let page: Page;

  try {
    const newPage = await session.newPage(url);
    if (!newPage) return null;
    page = newPage;
  } catch (error) {
    return null;
  }

  const name = (await page.locator("a + svg + h3").textContent()) ?? "";

  const metadata = page.getByAltText("poster").first().locator("..");
  const image = await metadata.getByRole("img", { name: "poster" }).getAttribute("src");
  const rating = (await metadata.locator("span").textContent()) ?? "";

  const h3s = await metadata.locator("h3").all();
  const [_, status, __, type] = await Promise.all(h3s.map((h3) => h3.textContent()));

  const chapters = page.getByText(`chapter ${name}`).locator("..").locator("div.grid");
  const first = await chapters.locator("a").first().locator("h3").last().textContent();
  const last = await chapters.locator("a").last().locator("h3").last().textContent();

  const comic: Comic = {
    name,
    url,
    source,
    status: (status ?? "").toLowerCase(),
    type: (type ?? "").toLowerCase(),
    rating: Number(rating),
    image: image ?? "",
    chapters: {
      first: Number(first?.replace(/\D+/g, "")),
      last: Number(last?.replace(/\D+/g, "")),
    },
  };

  await page.close();

  return comic;
}

export async function scrapeFromPagination<T>(
  session: NonNullable<Session>,
  parser: (locator: Locator) => Promise<T>
) {
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

export async function scrapeComicChapterImages(session: NonNullable<Session>): Promise<string[]> {
  await session.page.getByText(/related series/i).waitFor();

  let previous: undefined | number;
  let current = await session.page.evaluate(() => window.scrollY);

  console.log(previous, current);
  while (previous !== current) {
    await session.page.keyboard.press("End");
    await session.page.waitForLoadState("networkidle");
    previous = current;
    current = await session.page.evaluate(() => window.scrollY);

    console.log(previous, current);
  }

  const images = await session.page.locator("#chapter-above-ads + div").locator("img").all();
  const urls = await Promise.all(images.map((image) => image.getAttribute("src")));

  return urls.filter(Boolean) as string[];
}
