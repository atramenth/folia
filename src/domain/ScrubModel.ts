/**
 * Turns finger movement on the scrubber into a page position.
 * Moving the finger away from the bar slows the scrub, like a video scrubber,
 * so one page can be reached precisely among more than a thousand.
 */
export class ScrubModel {
  private readonly count: number;
  private width = 1;
  private lastX = 0;
  private pos = 0;

  constructor(count: number) {
    this.count = count;
  }

  get value(): number {
    return Math.round(this.pos);
  }

  /** The first touch jumps straight to where the finger landed. */
  begin(x: number, width: number): number {
    this.width = Math.max(1, width);
    this.lastX = x;
    this.pos = this.clamp((x / this.width) * (this.count - 1));
    return this.value;
  }

  move(x: number, distanceFromBar: number): number {
    const delta = ((x - this.lastX) / this.width) * (this.count - 1) * this.rate(distanceFromBar);
    this.lastX = x;
    this.pos = this.clamp(this.pos + delta);
    return this.value;
  }

  rate(distanceFromBar: number): number {
    if (distanceFromBar < 56) return 1;
    if (distanceFromBar < 120) return 0.5;
    if (distanceFromBar < 190) return 0.25;
    return 0.1;
  }

  rateLabel(distanceFromBar: number): string | null {
    const r = this.rate(distanceFromBar);
    if (r === 1) return null;
    if (r === 0.5) return "Half speed";
    if (r === 0.25) return "Quarter speed";
    return "Fine";
  }

  private clamp(v: number): number {
    return Math.min(this.count - 1, Math.max(0, v));
  }
}
