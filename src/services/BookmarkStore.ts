import { Store } from "./Store.ts";

export interface Bookmarks {
  /** Printed page numbers, ascending. */
  pages: number[];
  /** Optional short note for a bookmarked page. */
  notes: Record<number, string>;
}

export class BookmarkStore extends Store<Bookmarks> {
  constructor() {
    super("folia:bookmarks", { pages: [], notes: {} });
  }

  has(page: number): boolean {
    return this.getSnapshot().pages.includes(page);
  }

  toggle(page: number): void {
    if (this.has(page)) this.remove(page);
    else {
      const { pages } = this.getSnapshot();
      this.patch({ pages: [...pages, page].sort((a, b) => a - b) });
    }
  }

  remove(page: number): void {
    const { pages, notes } = this.getSnapshot();
    const next = { ...notes };
    delete next[page];
    this.patch({ pages: pages.filter((p) => p !== page), notes: next });
  }

  setNote(page: number, text: string): void {
    const notes = { ...this.getSnapshot().notes };
    if (text.trim()) notes[page] = text.slice(0, 160);
    else delete notes[page];
    this.patch({ notes });
  }
}

export const bookmarks = new BookmarkStore();
