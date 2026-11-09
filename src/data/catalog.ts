import type { ChapterDef, SectionDef } from "../domain/types.ts";

/**
 * The page images, by printed page number. Every page N must exist as
 * public/pages/N.avif. Pages 1197 and 1198 are intentionally skipped.
 */
export const SECTIONS: readonly SectionDef[] = [
  { id: "book", label: "Book", from: 1, to: 1196 },
  { id: "introduction", label: "Introduction", from: 1199, to: 1220 },
  { id: "index", label: "Index", from: 1221, to: 1223 },
];

/**
 * Named places inside the book. They appear in Contents, as ticks on the page scrubber and as the
 * running title at the top of the reader. Add one line per entry, using the printed page number
 * from the book's own table of contents. Entries may be in any order; pages that are not in the
 * catalog are ignored.
 */
export const CHAPTERS: readonly ChapterDef[] = [
  { title: "Fātiha", sub: "Sūrah 1 · Part 1", page: 1, to: 3 },
];

/**
 * Set to true once CHAPTERS lists every chapter of the book. Until then a chapter is only named at
 * the top of the reader on the pages from its start to its "to" page, so a half finished list never
 * labels a page with the wrong title. When this is true, "to" can be left out: a chapter runs until
 * the next one begins.
 */
export const CHAPTERS_COMPLETE = false;

/** Folder inside public/ that holds the images, and their file extension. */
export const PAGES_DIR = "pages";
export const PAGE_EXTENSION = "avif";

/**
 * Height divided by width of a typical scanned page. The continuous reader reserves this much room
 * for every page so the scroll position stays exact before images arrive. Scans that differ a
 * little are fitted inside that room without distortion.
 */
export const PAGE_RATIO = 1.4235;
