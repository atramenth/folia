import type { SectionDef } from "../domain/types.ts";

/**
 * The page images, by printed page number. Every page N must exist as
 * public/pages/N.avif. Pages 1197 and 1198 are intentionally skipped.
 */
export const SECTIONS: readonly SectionDef[] = [
  { id: "book", label: "Book", from: 1, to: 1196 },
  { id: "introduction", label: "Introduction", from: 1199, to: 1220 },
  { id: "index", label: "Index", from: 1221, to: 1223 },
];

/** Folder inside public/ that holds the images, and their file extension. */
export const PAGES_DIR = "pages";
export const PAGE_EXTENSION = "avif";
