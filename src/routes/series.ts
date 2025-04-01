import { Hono } from "hono";
import { sources } from "../utils/sources/constants.js";
import { scraper } from "../utils/sources/scraper.js";
import { Comic } from "../utils/sources/types.js";

const series = new Hono();

series.get("/", async (c) => {
  const matches: Record<string, Comic[]> = sources.reduce(
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

export { series };
