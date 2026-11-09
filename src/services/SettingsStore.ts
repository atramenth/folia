import { Store } from "./Store.ts";

export type ThemeChoice = "auto" | "light" | "dark";
export type SlideSeconds = 3 | 5 | 8 | 12;
/** Continuous scrolling, or one page at a time with a swipe. */
export type ReadMode = "flow" | "pages";
/** How the scanned pages are tinted: untouched, warmed like old paper, or inverted for the dark. */
export type ToneChoice = "original" | "warm" | "night";

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

export interface Settings {
  theme: ThemeChoice;
  /** How long each page stays on screen during the slideshow or auto scroll. */
  seconds: SlideSeconds;
  /** Start again from the first page when the slideshow reaches the end. */
  loop: boolean;
  mode: ReadMode;
  /** Current width of a page in the continuous reader, as a multiple of the screen. Remembered. */
  zoom: number;
  /** The zoom a double tap goes to. Follows the last zoom the reader chose by hand. */
  readZoom: number;
  tone: ToneChoice;
  /** Page brightness from 0.55 to 1. */
  dim: number;
  /** In the continuous reader, tap the top or bottom edge to scroll a screen. Off by default so a tap never moves the page. */
  edgeScroll: boolean;
}

export class SettingsStore extends Store<Settings> {
  constructor() {
    super("folia:settings", { theme: "auto", seconds: 5, loop: true, mode: "flow", zoom: 1, readZoom: 1.8, tone: "original", dim: 1, edgeScroll: false });
    this.apply();
  }

  setTheme(theme: ThemeChoice): void {
    this.patch({ theme });
    this.apply();
  }

  setSeconds(seconds: SlideSeconds): void {
    this.patch({ seconds });
  }

  setLoop(loop: boolean): void {
    this.patch({ loop });
  }

  setMode(mode: ReadMode): void {
    this.patch({ mode });
  }

  setZoom(zoom: number): void {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom * 100) / 100));
    this.patch(z > 1.05 ? { zoom: z, readZoom: z } : { zoom: 1 });
  }

  setTone(tone: ToneChoice): void {
    this.patch({ tone });
    this.apply();
  }

  setDim(dim: number): void {
    this.patch({ dim: Math.min(1, Math.max(0.55, dim)) });
    this.apply();
  }

  setEdgeScroll(edgeScroll: boolean): void {
    this.patch({ edgeScroll });
  }

  /** Reflect settings onto <html> so CSS can react. */
  private apply(): void {
    const { theme, tone, dim } = this.getSnapshot();
    const root = document.documentElement;
    if (theme === "auto") delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.dataset.tone = tone;
    root.style.setProperty("--dim", String(dim));
    const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#07080a" : "#dfe3e1");
  }
}

export const settings = new SettingsStore();
