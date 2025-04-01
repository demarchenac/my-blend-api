import { LaunchOptions } from "@playwright/test";
import { Session } from "../scraper/types.js";

export type SourceName = "asura";

export type Source = {
  name: SourceName;
  url: string;
};

export type Comic = {
  source: SourceName;
  rating: number;
  name: string;
  url: string;
  sourceUrl: string;
  status: string;
  type: string;
  image: string;
};

export type SourceScraper = {
  getComics(): Promise<Comic[] | null>;
};
