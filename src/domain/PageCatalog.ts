import type { ChapterDef, Direction, SectionDef } from "./types.ts";

/**
 * The ordered set of pages. Positions are zero based indexes into the set;
 * page numbers are the printed numbers, which have a gap between sections.
 */
export class PageCatalog {
  readonly sections: readonly SectionDef[];
  readonly pages: readonly number[];
  /** Chapters that exist in this catalog, in page order. */
  readonly chapters: readonly ChapterDef[];
  private readonly positions: ReadonlyMap<number, number>;

  private readonly chaptersComplete: boolean;

  constructor(sections: readonly SectionDef[], chapters: readonly ChapterDef[] = [], chaptersComplete = false) {
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
    this.chaptersComplete = chaptersComplete;
    this.chapters = chapters.filter((c) => this.positions.has(c.page)).sort((a, b) => a.page - b.page);
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

  /** The chapter that is open at this position, or null when none is known to be. */
  chapterAt(index: number): ChapterDef | null {
    const page = this.pageAt(index);
    for (let k = this.chapters.length - 1; k >= 0; k--) {
      const c = this.chapters[k];
      if (c.page > page) continue;
      const end = c.to ?? (this.chaptersComplete ? Infinity : c.page);
      return page <= end ? c : null;
    }
    return null;
  }

  /** Positions where each chapter begins, for the ticks on the scrubber. */
  chapterMarks(): number[] {
    return this.chapters.map((c) => this.indexOf(c.page));
  }

  /** How far through the book a position is, from 0 to 1. */
  fraction(index: number): number {
    return this.lastIndex > 0 ? this.clamp(index) / this.lastIndex : 0;
  }
}
