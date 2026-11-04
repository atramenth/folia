type NetworkInformation = { saveData?: boolean };

/** Builds page image addresses and warms the browser cache for the pages about to be shown. */
export class PageImages {
  private readonly base: string;
  private readonly dir: string;
  private readonly ext: string;
  private readonly capacity: number;
  private readonly warm = new Map<number, HTMLImageElement>();

  constructor(base: string, dir: string, ext: string, capacity = 6) {
    this.base = base;
    this.dir = dir;
    this.ext = ext;
    this.capacity = capacity;
  }

  url(page: number): string {
    return `${this.base}${this.dir}/${page}.${this.ext}`;
  }

  /** Quietly start loading pages. Does nothing when the device asks to save data. */
  preload(pages: readonly number[]): void {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return;
    for (const page of pages) {
      const existing = this.warm.get(page);
      if (existing) {
        this.warm.delete(page);
        this.warm.set(page, existing);
        continue;
      }
      const img = new Image();
      img.decoding = "async";
      img.src = this.url(page);
      this.warm.set(page, img);
    }
    while (this.warm.size > this.capacity) {
      const oldest = this.warm.keys().next().value as number;
      this.warm.delete(oldest);
    }
  }
}
