import type { Direction, TapZone } from "../domain/types.ts";

export interface StageHooks {
  canNavigate(direction: Direction): boolean;
  onNavigate(direction: Direction): void;
  onTap(zone: TapZone): void;
  onZoomChange(zoomed: boolean): void;
}

interface Point {
  x: number;
  y: number;
}

type Mode = "idle" | "swipe" | "pan" | "pinch" | "ignore";

const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.4;
const TAP_WINDOW_MS = 260;
const SLOP = 8;
/** A tap this close to the left or right edge turns the page instead of toggling the controls. */
const EDGE_ZONE = 0.2;
const SLIDE_MS = 280;
const ZOOM_EASE = "transform 0.25s cubic-bezier(0, 0, 0.2, 1)";

/**
 * Touch, mouse and wheel handling for the page stage.
 *
 * - one finger drags the three slide track to turn pages (with momentum and edge resistance)
 * - two fingers pinch to zoom, one finger pans while zoomed
 * - double tap toggles zoom; a single tap at the edge turns the page, in the middle it toggles the controls
 *
 * It moves elements directly (no React renders while a finger is down), which keeps
 * dragging smooth on phones. React only hears about finished page turns and taps.
 */
export class StageController {
  private readonly stage: HTMLElement;
  private readonly track: HTMLElement;
  private hooks: StageHooks;
  private readonly pointers = new Map<number, Point>();
  private readonly reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  private mode: Mode = "idle";
  private moved = false;
  private origin: Point = { x: 0, y: 0 };
  private samples: { x: number; t: number }[] = [];
  private dragX = 0;
  private busy = false;
  private tapTimer: number | undefined;
  private lastTap: { t: number; x: number; y: number } | null = null;

  private scale = 1;
  private tx = 0;
  private ty = 0;
  private pan0: Point = { x: 0, y: 0 };
  private pinch0: { dist: number; scale: number; tx: number; ty: number; mid: Point } | null = null;
  private zoomReported = false;

  constructor(stage: HTMLElement, track: HTMLElement, hooks: StageHooks) {
    this.stage = stage;
    this.track = track;
    this.hooks = hooks;
  }

  setHooks(hooks: StageHooks): void {
    this.hooks = hooks;
  }

  get zoomed(): boolean {
    return this.scale > 1.001;
  }

  attach(): () => void {
    const s = this.stage;
    s.addEventListener("pointerdown", this.onDown);
    s.addEventListener("pointermove", this.onMove);
    s.addEventListener("pointerup", this.onUp);
    s.addEventListener("pointercancel", this.onUp);
    s.addEventListener("wheel", this.onWheel, { passive: false });
    return () => {
      s.removeEventListener("pointerdown", this.onDown);
      s.removeEventListener("pointermove", this.onMove);
      s.removeEventListener("pointerup", this.onUp);
      s.removeEventListener("pointercancel", this.onUp);
      s.removeEventListener("wheel", this.onWheel);
      window.clearTimeout(this.tapTimer);
    };
  }

  /** Turn a page with the slide animation (used by buttons, keys and the slideshow). */
  slideBy(direction: Direction): boolean {
    if (this.busy || !this.hooks.canNavigate(direction)) return false;
    if (this.zoomed) this.resetZoom(false);
    this.animateTo(direction);
    return true;
  }

  resetZoom(animate: boolean): void {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.applyZoom(animate);
    this.reportZoom();
  }

  /** Called right after React shows a new current page: clear every transform. */
  reset(): void {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.dragX = 0;
    this.busy = false;
    this.mode = "idle";
    this.track.style.transition = "none";
    this.track.style.transform = "";
    this.track.querySelectorAll<HTMLElement>(".slide__zoom").forEach((el) => {
      el.style.transition = "";
      el.style.transform = "";
    });
    this.reportZoom();
  }

  // ---- pointer handling ----

  private readonly onDown = (e: PointerEvent): void => {
    if ((e.target as Element).closest("[data-no-gesture]")) return;
    if (this.busy || (e.pointerType === "mouse" && e.button !== 0)) return;
    this.stage.setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) {
      this.origin = { x: e.clientX, y: e.clientY };
      this.mode = "idle";
      this.moved = false;
      this.dragX = 0;
      this.samples = [{ x: e.clientX, t: e.timeStamp }];
    } else if (this.pointers.size === 2) {
      this.startPinch();
    }
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.mode === "pinch" && this.pointers.size >= 2 && this.pinch0) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const next = Math.min(MAX_SCALE, Math.max(1, (this.pinch0.scale * dist) / this.pinch0.dist));
      const mid = this.toStage({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const anchor = {
        x: (this.pinch0.mid.x - this.pinch0.tx) / this.pinch0.scale,
        y: (this.pinch0.mid.y - this.pinch0.ty) / this.pinch0.scale,
      };
      this.scale = next;
      this.tx = mid.x - anchor.x * next;
      this.ty = mid.y - anchor.y * next;
      this.applyZoom(false);
      this.reportZoom();
      return;
    }
    if (this.pointers.size !== 1) return;

    const dx = e.clientX - this.origin.x;
    const dy = e.clientY - this.origin.y;
    if (this.mode === "idle" && Math.hypot(dx, dy) > SLOP) {
      this.moved = true;
      window.clearTimeout(this.tapTimer);
      this.lastTap = null;
      if (this.zoomed) {
        this.mode = "pan";
        this.pan0 = { x: this.tx, y: this.ty };
      } else {
        this.mode = Math.abs(dx) > Math.abs(dy) ? "swipe" : "ignore";
      }
    }
    if (this.mode === "swipe") {
      const direction: Direction = dx < 0 ? 1 : -1;
      this.dragX = this.hooks.canNavigate(direction) ? dx : dx * 0.3;
      this.setTrack(this.dragX, 0);
      this.samples.push({ x: e.clientX, t: e.timeStamp });
      if (this.samples.length > 6) this.samples.shift();
    } else if (this.mode === "pan") {
      this.tx = this.pan0.x + dx;
      this.ty = this.pan0.y + dy;
      this.applyZoom(false);
    }
  };

  private readonly onUp = (e: PointerEvent): void => {
    if (!this.pointers.delete(e.pointerId)) return;

    if (this.mode === "pinch") {
      if (this.pointers.size < 2) {
        this.mode = "ignore";
        if (this.scale < 1.02) this.resetZoom(true);
      }
      if (this.pointers.size === 0) this.mode = "idle";
      return;
    }
    if (this.pointers.size > 0) return;

    if (this.mode === "swipe") this.finishSwipe();
    else if (this.mode === "idle" && !this.moved && e.type === "pointerup") this.handleTap(e);
    this.mode = "idle";
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if ((e.target as Element).closest("[data-no-gesture]")) return;
    const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025));
    this.zoomAt(this.toStage({ x: e.clientX, y: e.clientY }), this.scale * factor);
    if (this.scale < 1.02) {
      this.scale = 1;
      this.tx = 0;
      this.ty = 0;
    }
    this.applyZoom(false);
    this.reportZoom();
  };

  // ---- gestures ----

  private startPinch(): void {
    window.clearTimeout(this.tapTimer);
    this.lastTap = null;
    if (this.dragX !== 0) {
      this.setTrack(0, SLIDE_MS);
      this.dragX = 0;
    }
    const [a, b] = [...this.pointers.values()];
    this.mode = "pinch";
    this.pinch0 = {
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      scale: this.scale,
      tx: this.tx,
      ty: this.ty,
      mid: this.toStage({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
    };
  }

  private finishSwipe(): void {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const velocity = last && first && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
    const direction: Direction = this.dragX < 0 ? 1 : -1;
    const far = Math.abs(this.dragX) > this.stage.clientWidth * 0.18;
    const flick = Math.abs(velocity) > 0.4 && Math.sign(velocity) === Math.sign(this.dragX);
    if (this.hooks.canNavigate(direction) && (far || flick)) {
      this.animateTo(direction);
    } else {
      this.setTrack(0, SLIDE_MS);
      this.dragX = 0;
    }
  }

  private handleTap(e: PointerEvent): void {
    const now = e.timeStamp;
    const last = this.lastTap;
    if (last && now - last.t < TAP_WINDOW_MS && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 28) {
      window.clearTimeout(this.tapTimer);
      this.lastTap = null;
      this.toggleZoom(this.toStage({ x: e.clientX, y: e.clientY }));
      return;
    }
    this.lastTap = { t: now, x: e.clientX, y: e.clientY };
    const r = this.stage.getBoundingClientRect();
    const f = (e.clientX - r.left) / Math.max(1, r.width);
    const zone: TapZone = f < EDGE_ZONE ? "start" : f > 1 - EDGE_ZONE ? "end" : "middle";
    this.tapTimer = window.setTimeout(() => {
      this.lastTap = null;
      this.hooks.onTap(zone);
    }, TAP_WINDOW_MS);
  }

  private toggleZoom(p: Point): void {
    if (this.zoomed) {
      this.scale = 1;
      this.tx = 0;
      this.ty = 0;
    } else {
      this.zoomAt(p, DOUBLE_TAP_SCALE);
    }
    this.applyZoom(true);
    this.reportZoom();
  }

  // ---- movement ----

  private animateTo(direction: Direction): void {
    this.busy = true;
    const ms = this.reduceMotion.matches ? 0 : SLIDE_MS;
    this.setTrack(-direction * this.stage.clientWidth, ms);
    window.setTimeout(() => {
      this.busy = false;
      this.hooks.onNavigate(direction);
    }, ms + (ms ? 30 : 0));
  }

  private setTrack(px: number, ms: number): void {
    this.track.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.16, 0.4, 0.15, 1)` : "none";
    this.track.style.transform = `translate3d(${px}px,0,0)`;
  }

  /** Zoom to `next` keeping the point under `p` (stage centre coordinates) fixed. */
  private zoomAt(p: Point, next: number): void {
    const s = Math.min(MAX_SCALE, Math.max(1, next));
    const ax = (p.x - this.tx) / this.scale;
    const ay = (p.y - this.ty) / this.scale;
    this.scale = s;
    this.tx = p.x - ax * s;
    this.ty = p.y - ay * s;
  }

  private applyZoom(animate: boolean): void {
    const el = this.zoomEl();
    if (!el) return;
    this.clampPan(el);
    const moving = this.scale !== 1 || this.tx !== 0 || this.ty !== 0;
    el.style.transition = animate && !this.reduceMotion.matches ? `${ZOOM_EASE}, padding 0.3s cubic-bezier(0, 0, 0.2, 1)` : "";
    el.style.transform = moving ? `translate3d(${this.tx}px,${this.ty}px,0) scale(${this.scale})` : "";
  }

  /** Keep the zoomed page covering the screen; centre it when it is smaller than the screen. */
  private clampPan(zoomEl: HTMLElement): void {
    const img = zoomEl.querySelector("img");
    const W = this.stage.clientWidth;
    const H = this.stage.clientHeight;
    const w = img?.clientWidth || W;
    const h = img?.clientHeight || H;
    const style = getComputedStyle(zoomEl);
    const oy = (parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / 2 || 0;
    const s = this.scale;

    const limX = Math.max(0, (s * w - W) / 2);
    this.tx = Math.min(limX, Math.max(-limX, this.tx));
    if (s * h > H) {
      const lo = H / 2 - s * (oy + h / 2);
      const hi = s * (h / 2 - oy) - H / 2;
      this.ty = Math.min(hi, Math.max(lo, this.ty));
    } else {
      this.ty = oy * (1 - s);
    }
  }

  private zoomEl(): HTMLElement | null {
    return this.track.querySelector<HTMLElement>('.slide[data-current="true"] .slide__zoom');
  }

  /** Pointer position relative to the stage centre, which is the zoom origin. */
  private toStage(p: Point): Point {
    const r = this.stage.getBoundingClientRect();
    return { x: p.x - r.left - r.width / 2, y: p.y - r.top - r.height / 2 };
  }

  private reportZoom(): void {
    const z = this.zoomed;
    if (z !== this.zoomReported) {
      this.zoomReported = z;
      this.hooks.onZoomChange(z);
    }
  }
}
