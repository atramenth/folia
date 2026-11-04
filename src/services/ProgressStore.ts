import { Store } from "./Store.ts";

export interface Progress {
  /** Last page shown, as a printed page number. 0 means nothing yet. */
  page: number;
  /** The first run gesture guide has been dismissed. */
  hintSeen: boolean;
}

export class ProgressStore extends Store<Progress> {
  constructor() {
    super("folia:progress", { page: 0, hintSeen: false });
  }

  setPage(page: number): void {
    if (page !== this.getSnapshot().page) this.patch({ page });
  }

  dismissHint(): void {
    this.patch({ hintSeen: true });
  }
}

export const progress = new ProgressStore();
