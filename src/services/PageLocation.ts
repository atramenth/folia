/**
 * Keeps the current page in the address bar as a plain path, such as /folia/p/812, so any page can be linked to
 * with no "#". GitHub Pages answers an unknown path with 404.html, which is a copy of index.html (see vite.config.ts),
 * so the app starts on any address and reads the page from the path itself.
 */
export class PageLocation {
  private readonly base: string;

  /** `base` is the folder the site is served from, such as "/folia/". */
  constructor(base: string) {
    this.base = base.endsWith("/") ? base : `${base}/`;
  }

  static parse(path: string, base: string): number | null {
    if (!path.startsWith(base)) return null;
    const match = /^p\/(\d{1,5})\/?$/.exec(path.slice(base.length));
    return match ? Number(match[1]) : null;
  }

  format(page: number): string {
    return `${this.base}p/${page}`;
  }

  /** The page the address asks for. Links made before this change (#/p/812) are read once and rewritten. */
  read(): number | null {
    const legacy = /^#\/p\/(\d{1,5})$/.exec(window.location.hash);
    if (legacy) {
      const page = Number(legacy[1]);
      window.history.replaceState(null, "", this.format(page));
      return page;
    }
    return PageLocation.parse(window.location.pathname, this.base);
  }

  /** Replaces the entry, so turning pages never fills the browser history. */
  write(page: number): void {
    const next = this.format(page);
    if (window.location.pathname !== next || window.location.hash) window.history.replaceState(null, "", next);
  }

  subscribe(onPage: (page: number) => void): () => void {
    const handler = () => {
      const page = this.read();
      if (page !== null) onPage(page);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }
}
