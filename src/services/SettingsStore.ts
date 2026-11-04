import { Store } from "./Store.ts";

export type ThemeChoice = "auto" | "light" | "dark";
export type SlideSeconds = 3 | 5 | 8 | 12;

export interface Settings {
  theme: ThemeChoice;
  /** How long each page stays on screen during the slideshow. */
  seconds: SlideSeconds;
  /** Start again from the first page when the slideshow reaches the end. */
  loop: boolean;
}

export class SettingsStore extends Store<Settings> {
  constructor() {
    super("folia:settings", { theme: "auto", seconds: 5, loop: true });
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

  /** Reflect settings onto <html> so CSS can react. */
  private apply(): void {
    const { theme } = this.getSnapshot();
    const root = document.documentElement;
    if (theme === "auto") delete root.dataset.theme;
    else root.dataset.theme = theme;
    const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#08090b" : "#e3e6e5");
  }
}

export const settings = new SettingsStore();
