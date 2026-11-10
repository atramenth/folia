/** A run of consecutive printed page numbers, such as the Introduction (1199 to 1220). */
export interface SectionDef {
  id: string;
  label: string;
  /** First printed page number, inclusive. */
  from: number;
  /** Last printed page number, inclusive. */
  to: number;
}

export type Place = "Makkah" | "Madinah";

/** One of the 114 sūrahs. */
export interface SurahDef {
  number: number;
  name: string;
  place: Place;
  /** Printed page on which it begins. */
  page: number;
  /** Number of āyāt. */
  ayat: number;
}

/** One of the 30 parts. */
export interface PartDef {
  part: number;
  /** Printed page on which it begins. */
  page: number;
  /** The sūrah and āyah it begins at. */
  surah: number;
  ayah: number;
  /** The page was worked out from the position of the āyah rather than read from the text, so it may be a page off. */
  about?: boolean;
}

/** Which way a page turn goes: 1 is forward, -1 is back. */
export type Direction = 1 | -1;

/** Where a tap landed: the leading edge, the middle, or the trailing edge of the reading surface. */
export type TapZone = "start" | "middle" | "end";
