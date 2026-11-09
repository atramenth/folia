/** A run of consecutive printed page numbers, such as the Introduction (1199 to 1220). */
export interface SectionDef {
  id: string;
  label: string;
  /** First printed page number, inclusive. */
  from: number;
  /** Last printed page number, inclusive. */
  to: number;
}

/** A named place inside the book, listed in Contents and shown as a tick on the scrubber. */
export interface ChapterDef {
  title: string;
  /** Short line under the title, such as "Sūrah 1 · Part 1". */
  sub?: string;
  /** Printed page number where it starts. */
  page: number;
  /** Last printed page of the chapter. Only needed while the chapter list is incomplete. */
  to?: number;
}

/** Which way a page turn goes: 1 is forward, -1 is back. */
export type Direction = 1 | -1;

/** Where a tap landed: the leading edge, the middle, or the trailing edge of the reading surface. */
export type TapZone = "start" | "middle" | "end";
