/** Keeps the current page in the address bar as #/p/812, so any page can be linked to. */
export class HashLocation {
  static parse(hash: string): number | null {
    const match = /^#\/p\/(\d{1,5})$/.exec(hash);
    return match ? Number(match[1]) : null;
  }

  static format(page: number): string {
    return `#/p/${page}`;
  }

  read(): number | null {
    return HashLocation.parse(window.location.hash);
  }

  /** Replaces the entry, so turning pages never fills the browser history. */
  write(page: number): void {
    const next = HashLocation.format(page);
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }

  subscribe(onPage: (page: number) => void): () => void {
    const handler = () => {
      const page = this.read();
      if (page !== null) onPage(page);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }
}
