import { Hono } from "hono";
import { sources as sourceList } from "../utils/sources/constants.js";
import { scraper } from "../utils/sources/scraper.js";

const sources = new Hono();

sources.get("/", (c) => c.json(sourceList));

sources.get("/:source/series", async (c) => {
  const expectedSource = c.req.param("source");
  const source = sourceList.find((s) => s.name === expectedSource);

  if (!source) return c.json({ ok: false }, 404);

  const comics = await scraper[source.name].getComics();

  return c.json({ comics });
});

sources.get("/:source/series/:slug/chapter/:chapter", async (c) => {
  const { source: sourceName, slug, chapter: chapterStr } = c.req.param();
  let chapter = Number.parseInt(chapterStr, 10);
  if (Number.isNaN(chapter)) chapter = -1;

  const source = sourceList.find((s) => s.name === sourceName);
  if (!source) return c.json({ ok: false }, 404);

  const pages = await scraper[source.name].getComicChapterImages({ slug, chapter });

  return c.json(pages);
});

export { sources };
