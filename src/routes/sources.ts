import { Hono } from "hono";
import { sources as sourceList } from "../utils/sources/constants.js";
import { scraper } from "../utils/sources/scraper.js";

const sources = new Hono();

sources.get("/", (c) => c.json(sourceList));

sources.get("/:source/comics", async (c) => {
  const expectedSource = c.req.param("source");
  const source = sourceList.find((s) => s.name === expectedSource);

  if (!source) return c.json({ ok: false }, 404);

  const comics = await scraper[source.name].getComics();

  return c.json({ comics });
});

export { sources };
