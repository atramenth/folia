/** One shot timer used to advance the slideshow; restarted for every page. */
export class Slideshow {
  private timer: number | undefined;

  start(ms: number, onTick: () => void): void {
    this.stop();
    this.timer = window.setTimeout(onTick, ms);
  }

  stop(): void {
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
