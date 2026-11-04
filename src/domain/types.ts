/** A run of consecutive printed page numbers, such as the Introduction (1199 to 1220). */
export interface SectionDef {
  id: string;
  label: string;
  /** First printed page number, inclusive. */
  from: number;
  /** Last printed page number, inclusive. */
  to: number;
}

/** Which way a page turn goes: 1 is forward, -1 is back. */
export type Direction = 1 | -1;
