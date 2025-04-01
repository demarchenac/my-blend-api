import type { Page } from "@playwright/test";
import { withSession } from "../scraper/session.js";
import type { Session } from "../scraper/types.js";
import { asuraSource as source } from "./constants.js";
import type { Comic, SourceScraper } from "./types.js";

const stringCompare = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());

function array2chunks<T>(array: Array<T>, chunkSize: number) {
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
}

const scrapeComicPage = async (
  session: NonNullable<Session>,
  url: string
): Promise<Comic | null> => {
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
    source: source.name,
    sourceUrl: source.url,
    name,
    url,
    status: (status ?? "").toLowerCase(),
    type: (type ?? "").toLowerCase(),
    rating: Number(rating),
    image: image ?? "",
  };

  await page.close();

  return comic;
};

const scrapeComicUrls = async (session: NonNullable<Session>) => {
  let canGoNext: boolean;
  let comics: string[] = [];

  // wait for the series page to load
  const comicHandlesLocator = session.page.locator("div.grid > a");

  await comicHandlesLocator.last().waitFor({ state: "visible" });

  do {
    const nextButton = session.page.getByText("Next");
    canGoNext = await nextButton.evaluate((el) => el.style.pointerEvents !== "none");

    const comicHandles = await comicHandlesLocator.all();
    const currentUrl = new URL(session.page.url()).toString();

    const urls = await Promise.all(comicHandles.map((handle) => handle.getAttribute("href")));

    comics = comics.concat(urls.map((url) => source.url.concat(url as string)));

    if (!canGoNext) return comics;

    await Promise.all([
      session.page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 1500 }),
      nextButton.scrollIntoViewIfNeeded(),
      nextButton.click(),
    ]).catch(() => {
      console.log("-> failed to interact with comic page");
      canGoNext = false;
    });
  } while (canGoNext);

  return comics;
};

export async function getComics(session: Session | null): Promise<Comic[] | null> {
  if (!session) return null;

  await session.page.getByRole("link", { name: "Comics" }).click();
  const urls = await scrapeComicUrls(session);

  urls.sort(stringCompare);

  let comics: Comic[] = [];
  const chunks = array2chunks(urls, 3);

  for (const chunk of chunks) {
    const chunkComics = await Promise.all(chunk.map((url) => scrapeComicPage(session, url)));
    comics = comics.concat(chunkComics.filter(Boolean) as Comic[]);
  }

  return comics;
}

export const asura: SourceScraper = {
  getComics: withSession(source, getComics, { headless: false }),
};
