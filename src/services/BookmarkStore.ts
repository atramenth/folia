import { Store } from "./Store.ts";

export interface Bookmarks {
  /** Printed page numbers, ascending. */
  pages: number[];
}

export class BookmarkStore extends Store<Bookmarks> {
  constructor() {
    super("folia:bookmarks", { pages: [] });
  }

  has(page: number): boolean {
    return this.getSnapshot().pages.includes(page);
  }

  toggle(page: number): void {
    const { pages } = this.getSnapshot();
    this.patch({ pages: pages.includes(page) ? pages.filter((p) => p !== page) : [...pages, page].sort((a, b) => a - b) });
  }

  remove(page: number): void {
    this.patch({ pages: this.getSnapshot().pages.filter((p) => p !== page) });
  }
}

export const bookmarks = new BookmarkStore();
