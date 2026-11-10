import type { Direction, PartDef, SectionDef, SurahDef } from "./types.ts";

/**
 * The ordered set of pages. Positions are zero based indexes into the set;
 * page numbers are the printed numbers, which have a gap between sections.
 */
export class PageCatalog {
  readonly sections: readonly SectionDef[];
  readonly pages: readonly number[];
  /** The sūrahs that exist in this catalog, in page order. */
  readonly surahs: readonly SurahDef[];
  /** The parts that exist in this catalog, in page order. */
  readonly parts: readonly PartDef[];
  private readonly positions: ReadonlyMap<number, number>;

  constructor(sections: readonly SectionDef[], surahs: readonly SurahDef[] = [], parts: readonly PartDef[] = []) {
    const pages: number[] = [];
    let previousEnd = 0;
    for (const s of sections) {
      if (!Number.isInteger(s.from) || !Number.isInteger(s.to) || s.from > s.to) {
        throw new Error(`Section "${s.id}" has an invalid range`);
      }
      if (s.from <= previousEnd) throw new Error(`Section "${s.id}" overlaps the one before it`);
      for (let p = s.from; p <= s.to; p++) pages.push(p);
      previousEnd = s.to;
    }
    if (pages.length === 0) throw new Error("The catalog has no pages");
    this.sections = sections;
    this.pages = pages;
    this.positions = new Map(pages.map((p, i) => [p, i]));
    this.surahs = surahs.filter((x) => this.positions.has(x.page)).sort((a, b) => a.page - b.page);
    this.parts = parts.filter((x) => this.positions.has(x.page)).sort((a, b) => a.page - b.page);
  }

  get total(): number {
    return this.pages.length;
  }

  get lastIndex(): number {
    return this.pages.length - 1;
  }

  get firstPage(): number {
    return this.pages[0];
  }

  get lastPage(): number {
    return this.pages[this.lastIndex];
  }

  clamp(index: number): number {
    return Math.min(this.lastIndex, Math.max(0, Math.round(index)));
  }

  pageAt(index: number): number {
    return this.pages[this.clamp(index)];
  }

  /** Position of a page number, or -1 when that page is not in the set. */
  indexOf(page: number): number {
    return this.positions.get(page) ?? -1;
  }

  has(page: number): boolean {
    return this.positions.has(page);
  }

  /** The page itself when present, otherwise the next page after it, otherwise the last page. */
  nearestIndex(page: number): number {
    const exact = this.indexOf(page);
    if (exact >= 0) return exact;
    const next = this.pages.findIndex((p) => p > page);
    return next >= 0 ? next : this.lastIndex;
  }

  canMove(index: number, direction: Direction): boolean {
    const target = index + direction;
    return target >= 0 && target <= this.lastIndex;
  }

  sectionAt(index: number): SectionDef {
    const page = this.pageAt(index);
    return this.sections.find((s) => page >= s.from && page <= s.to) ?? this.sections[this.sections.length - 1];
  }

  sectionStartIndex(section: SectionDef): number {
    return this.indexOf(section.from);
  }

  /** Positions where each later section begins, for the marks on the scrubber. */
  sectionMarks(): number[] {
    return this.sections.slice(1).map((s) => this.sectionStartIndex(s));
  }

  pageCount(section: SectionDef): number {
    return this.pages.filter((p) => p >= section.from && p <= section.to).length;
  }

  /** The sūrah that is open at this position, or null in the Introduction and the Index. */
  surahAt(index: number): SurahDef | null {
    const page = this.pageAt(index);
    const quran = this.sections[0];
    if (page > quran.to) return null;
    let found: SurahDef | null = null;
    for (const x of this.surahs) {
      if (x.page <= page) found = x;
      else break;
    }
    return found;
  }

  /** The part (1 to 30) that is open at this position, or 0 outside the Qur'ān. */
  partAt(index: number): number {
    const page = this.pageAt(index);
    if (page > this.sections[0].to) return 0;
    let found = 0;
    for (const x of this.parts) {
      if (x.page <= page) found = x.part;
      else break;
    }
    return found;
  }

  /** The part that holds a given āyah of a sūrah. */
  partOfAyah(surah: number, ayah: number): number {
    let part = 1;
    for (const x of this.parts) if (x.surah < surah || (x.surah === surah && x.ayah <= ayah)) part = x.part;
    return part;
  }

  /** The first and last part a sūrah runs through. */
  partsOfSurah(x: SurahDef): { first: number; last: number } {
    return { first: this.partOfAyah(x.number, 1), last: this.partOfAyah(x.number, x.ayat) };
  }

  /** Every sūrah that has āyāt in a part, with whether it began in an earlier part. */
  surahsInPart(part: number): { surah: SurahDef; continues: boolean }[] {
    const out: { surah: SurahDef; continues: boolean }[] = [];
    for (const x of this.surahs) {
      const { first, last } = this.partsOfSurah(x);
      if (part >= first && part <= last) out.push({ surah: x, continues: part > first });
    }
    return out;
  }

  /** Last printed page of a sūrah: the page before the next one begins (they can share a page). */
  surahEnd(x: SurahDef): number {
    const i = this.surahs.indexOf(x);
    const next = this.surahs[i + 1];
    return next ? Math.max(x.page, next.page - 1) : this.sections[0].to;
  }

  /** Positions where each of the 30 parts begins, for the ticks on the scrubber. */
  partMarks(): number[] {
    return this.parts.map((p) => this.indexOf(p.page));
  }

  /** How far through the book a position is, from 0 to 1. */
  fraction(index: number): number {
    return this.lastIndex > 0 ? this.clamp(index) / this.lastIndex : 0;
  }
}
