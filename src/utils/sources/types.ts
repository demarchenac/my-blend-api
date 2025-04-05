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
  chapters: { first: number; last: number };
};

export type PaginatedComic = Omit<Comic, "url" | "chapters"> & { slug: string };

export type MatchingSource = {
  source: SourceName;
  name: string;
};

export type SourceScraper = {
  getComics(): Promise<Comic[] | null>;
  getMatchingComics(options: { query: string }): Promise<PaginatedComic[] | null>;
  getComicBySlug(options: { slug: string }): Promise<Comic | null>;
  getComicChapterImages(options: { slug: string; chapter: number }): Promise<string[] | null>;
};
