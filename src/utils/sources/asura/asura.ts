import type { Session } from "../../scraper/types.js";
import type { Comic } from "../types.js";
import {
  scrapeComicFromPaginationHandle,
  scrapeComicPage,
  scrapeFromPagination,
  scrapeUrlFromPaginationHandle,
} from "./scrape.js";
import { array2chunks, dynamicSort, stringCompare } from "./helpers.js";

export async function getComics(session: Session): Promise<Comic[] | null> {
  if (!session) return null;

  await session.page.getByRole("link", { name: "Comics" }).click();
  const urls = await scrapeFromPagination(session, scrapeUrlFromPaginationHandle);

  urls.sort(stringCompare);

  let comics: Comic[] = [];
  const chunks = array2chunks(urls, 3);

  for (const chunk of chunks) {
    const chunkComics = await Promise.all(chunk.map((url) => scrapeComicPage(session, url)));
    comics = comics.concat(chunkComics.filter(Boolean) as Comic[]);
  }

  return comics;
}

export async function getMatchingComics(
  session: Session,
  { query }: { query: string } = { query: "" }
): Promise<Comic[] | null> {
  if (!session) return null;

  await session.page.getByRole("link", { name: "Comics" }).click();
  await session.page.waitForSelector("div.grid > a");
  await session.page.goto(`${session.page.url()}&name=${query}`);

  const comics = await scrapeFromPagination(session, scrapeComicFromPaginationHandle);
  comics.sort(dynamicSort("name"));

  return comics;
}
