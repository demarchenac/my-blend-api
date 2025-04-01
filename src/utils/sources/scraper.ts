import { SourceName, SourceScraper } from "./types.js";
import { asura } from "./asura.js";

export const scraper: Record<SourceName, SourceScraper> = { asura };
