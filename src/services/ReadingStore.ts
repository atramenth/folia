import { Store } from "./Store.ts";

export interface Reading {
  /** One character per printed page number: "1" once the page has been read. */
  seen: string;
  /** Pages opened today, so a day can be counted without storing every visit. */
  today: { date: string; pages: number[] };
  /** Finished days: date to number of distinct pages read. */
  history: Record<string, number>;
  /** Pages the reader wants to get through each day. */
  goal: number;
}

const KEEP_DAYS = 120;

/** Local calendar date as YYYY-MM-DD. */
function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

/**
 * What has been read, and how much today. A page counts as read once it has stayed in view for a
 * moment, so flicking past a hundred pages on the way somewhere does not mark them.
 */
export class ReadingStore extends Store<Reading> {
  constructor() {
    super("folia:reading", { seen: "", today: { date: dayKey(), pages: [] }, history: {}, goal: 10 });
    this.rollDay();
  }

  isRead(page: number): boolean {
    return this.getSnapshot().seen.charAt(page) === "1";
  }

  /** How many of the given printed pages have been read. */
  countRead(pages: readonly number[]): number {
    const { seen } = this.getSnapshot();
    let n = 0;
    for (const p of pages) if (seen.charAt(p) === "1") n++;
    return n;
  }

  get todayCount(): number {
    this.rollDay();
    return this.getSnapshot().today.pages.length;
  }

  /** Consecutive days with at least one page read, counting today when it has one. */
  get streak(): number {
    const { history, today } = this.getSnapshot();
    const days = { ...history, [today.date]: today.pages.length };
    let cursor = today.date;
    if (!days[cursor]) cursor = shiftDay(cursor, -1);
    let n = 0;
    while (days[cursor] > 0) {
      n++;
      cursor = shiftDay(cursor, -1);
    }
    return n;
  }

  markRead(page: number): void {
    this.rollDay();
    const s = this.getSnapshot();
    const known = s.seen.charAt(page) === "1";
    const counted = s.today.pages.includes(page);
    if (known && counted) return;
    let seen = s.seen;
    if (!known) {
      if (seen.length <= page) seen = seen.padEnd(page + 1, "0");
      seen = seen.slice(0, page) + "1" + seen.slice(page + 1);
    }
    this.patch({ seen, today: counted ? s.today : { ...s.today, pages: [...s.today.pages, page] } });
  }

  setGoal(goal: number): void {
    this.patch({ goal });
  }

  /** Start a new day's tally when midnight has passed since the last visit. */
  private rollDay(): void {
    const s = this.getSnapshot();
    const now = dayKey();
    if (s.today.date === now) return;
    const history = { ...s.history };
    if (s.today.pages.length) history[s.today.date] = s.today.pages.length;
    const cutoff = shiftDay(now, -KEEP_DAYS);
    for (const k of Object.keys(history)) if (k < cutoff) delete history[k];
    this.patch({ today: { date: now, pages: [] }, history });
  }
}
