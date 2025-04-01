import { SourceName, SourceScraper } from "./types.js";
import { asura } from "./asura/index.js";

export const scraper: Record<SourceName, SourceScraper> = { asura };
