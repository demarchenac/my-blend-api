import type { Browser, Page } from "@playwright/test";

export type Session = {
  browser: Browser;
  page: Page;
  newPage: (url?: string) => Promise<Page | null>;
} | null;
