import { Hono } from "hono";
import { sources } from "../utils/sources/constants.js";
import { scraper } from "../utils/sources/scraper.js";
import type { Comic, PaginatedComic } from "../utils/sources/types.js";

const series = new Hono();

series.get("/", async (c) => {
  const matches: Record<string, PaginatedComic[]> = sources.reduce(
    (map, { name }) => ({ ...map, [name]: [] }),
    {}
  );

  const query = c.req.query("q") ?? "";

  for (const source of sources) {
    const comics = await scraper[source.name].getMatchingComics({ query });
    if (!comics) continue;
    matches[source.name] = comics;
  }

  return c.json({ matches });
});

series.get("/:slug", async (c) => {
  const matches: Record<string, Comic> = sources.reduce(
    (map, { name }) => ({ ...map, [name]: [] }),
    {}
  );

  const slug = c.req.param("slug");

  for (const source of sources) {
    const comic = await scraper[source.name].getComicBySlug({ slug });
    if (!comic) continue;
    matches[source.name] = comic;
  }

  return c.json({ matches });
});

series.get("/:slug/chapter/:chapter", async (c) => {
  const { slug, chapter: chapterStr } = c.req.param();
  let chapter = Number.parseInt(chapterStr, 10);
  if (Number.isNaN(chapter)) chapter = -1;

  const sourceToScrape = c.req.query("source");
  const source = sources.find((s) => s.name === sourceToScrape);
  if (!source) return c.json({ ok: false }, 404);

  const pages = await scraper[source.name].getComicChapterImages({ slug, chapter });

  return c.json(pages);
});

export { series };
