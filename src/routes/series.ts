import { Hono } from "hono";
import { sources } from "../utils/sources/constants.js";
import { scraper } from "../utils/sources/scraper.js";
import type { Comic, PaginatedComic } from "../utils/sources/types.js";
import { imageToRaw } from "../utils/image/index.js";

const series = new Hono();

series.get("/", async (c) => {
  const matches: Record<string, PaginatedComic[]> = sources.reduce((map, { name }) => ({ ...map, [name]: [] }), {});

  const query = c.req.query("q") ?? "";

  for (const source of sources) {
    const comics = await scraper[source.name].getMatchingComics({ query });
    if (!comics) continue;
    matches[source.name] = comics;
  }

  return c.json({ matches });
});

series.get("/:slug", async (c) => {
  const matches: Record<string, Comic> = sources.reduce((map, { name }) => ({ ...map, [name]: [] }), {});

  const slug = c.req.param("slug");

  for (const source of sources) {
    const comic = await scraper[source.name].getComicBySlug({ slug });
    if (!comic) continue;

    const image = await imageToRaw(comic.image);
    matches[source.name] = { ...comic, image };
  }

  return c.json({ matches });
});

export { series };
