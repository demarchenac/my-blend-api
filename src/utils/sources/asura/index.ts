import { withSession } from "../../scraper/session.js";
import { asuraSource as source } from "../constants.js";
import { SourceScraper } from "../types.js";
import { getComicBySlug, getComicChapterImages, getComics, getMatchingComics } from "./asura.js";

export const asura: SourceScraper = {
  getComics: withSession(source, getComics),
  getMatchingComics: withSession(source, getMatchingComics),
  getComicBySlug: withSession(source, getComicBySlug),
  getComicChapterImages: withSession(source, getComicChapterImages, { headless: false }),
};
