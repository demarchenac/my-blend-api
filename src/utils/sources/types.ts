import { LaunchOptions } from "@playwright/test";
import { Session } from "../scraper/types.js";

export type SourceName = "asura";

export type Source = {
  name: SourceName;
  url: string;
};

export type Comic = {
  rating: number;
  name: string;
  url: string;
  status: string;
  type: string;
  image: string;
  source: Source;
};

export type MatchingSource = {
  source: SourceName;
  name: string;
};

export type SourceScraper = {
  getComics(): Promise<Comic[] | null>;
  getMatchingComics(options: { query: string }): Promise<Comic[] | null>;
};
