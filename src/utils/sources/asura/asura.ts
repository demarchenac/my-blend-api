import type { Session } from "../../scraper/types.js";
import type { Comic, PaginatedComic } from "../types.js";
import {
  scrapeComicChapterImages,
  scrapeComicFromPaginationHandle,
  scrapeComicPage,
  scrapeFromPagination,
  scrapeUrlFromPaginationHandle,
} from "./scrape.js";
import { array2chunks, dynamicSort, stringCompare } from "./helpers.js";
import { asuraSource as source } from "../constants.js";

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
): Promise<PaginatedComic[] | null> {
  if (!session) return null;
  if (!query) return null;

  await session.page.getByRole("link", { name: "Comics" }).click();
  await session.page.waitForSelector("div.grid > a");
  await session.page.goto(`${session.page.url()}&name=${query}`);

  const comics = await scrapeFromPagination(session, scrapeComicFromPaginationHandle);
  comics.sort(dynamicSort("name"));

  return comics;
}

export async function getComicBySlug(
  session: Session,
  { slug }: { slug: string } = { slug: "" }
): Promise<Comic | null> {
  if (!session) return null;
  if (!slug) return null;

  const url = source.url + `series/${slug}`;
  return scrapeComicPage(session, url);
}

export async function getComicChapterImages(
  session: Session,
  { slug, chapter }: { slug: string; chapter: number } = { slug: "", chapter: -1 }
): Promise<string[]> {
  if (!session) return [];
  if (!slug) return [];
  if (chapter < 0) return [];

  const url = source.url + `series/${slug}/chapter/${chapter}`;
  await session.page.goto(url);

  return scrapeComicChapterImages(session);
}
