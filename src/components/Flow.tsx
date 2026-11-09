import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { PAGE_RATIO } from "../data/catalog.ts";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import type { Direction, TapZone } from "../domain/types.ts";
import { ZOOM_MAX, ZOOM_MIN } from "../services/SettingsStore.ts";
import { FlowPage } from "./FlowPage.tsx";

/** Space between two pages, space either side of a page at fit width, and room above the first page. */
const GAP = 30;
const GUTTER = 10;
const PAD_TOP = 64;
const TAIL = 160;
/** On wide screens the page stops growing here, so lines stay a readable length. */
const MAX_BASE = 900;
/** The page under this fraction of the screen height is the one being read. */
const READ_LINE = 0.38;
/** When a page is jumped to, this much of the space above it stays visible. */
const TOP_PEEK = 48;
const DOUBLE_TAP_MS = 280;

export interface FlowHandle {
  scrollToIndex(index: number, smooth?: boolean): void;
  /** Move by almost one screen. */
  scrollScreen(direction: Direction): void;
  /** Distance in pixels from one page to the next at the current zoom. */
  pxPerPage(): number;
  /** Start moving at a steady speed. Zero stops. */
  autoScroll(pxPerSecond: number): void;
  /** Change the zoom around the middle of the screen. */
  zoomTo(zoom: number): void;
}

interface Props {
  catalog: PageCatalog;
  /** Where to start. The reader reports its own position after that. */
  initialIndex: number;
  /** Page width as a multiple of the screen, 1 being fit to width. */
  zoom: number;
  /** The zoom a double tap goes to. */
  readZoom: number;
  edgeTaps: boolean;
  onIndex: (index: number) => void;
  onTap: (zone: TapZone) => void;
  onScrollDirection: (direction: "up" | "down") => void;
  onZoom: (zoom: number) => void;
  /** Auto scroll reached the last page. */
  onAutoEnd: () => void;
  /** The reader touched the screen while auto scroll was running. */
  onAutoStop: () => void;
  handleRef: Ref<FlowHandle>;
}

interface Anchor {
  /** Vertical place, in page pitches from the top of the first page. */
  q: number;
  /** Horizontal place, as a fraction of the page width. */
  px: number;
}

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/**
 * The continuous reader: every page of the book stacked in one scrolling column.
 *
 * Pages are laid out with CSS variables (width, height and pitch), so a zoom is one style change and
 * only the pages near the screen exist in the document. The browser does the scrolling, which keeps
 * momentum and edge behaviour native. Pinch, double tap and ctrl wheel change the zoom; the page
 * under the fingers stays under the fingers.
 */
export function Flow({ catalog, initialIndex, zoom, readZoom, edgeTaps, onIndex, onTap, onScrollDirection, onZoom, onAutoEnd, onAutoStop, handleRef }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const metrics = useRef({ fw: 0, fh: 0, pitch: 1 });
  const zoomRef = useRef(zoom);
  const emitted = useRef(initialIndex);
  const quietUntil = useRef(0);
  /** When the column last moved, so a touch that merely stops a fling is not taken for a tap. */
  const lastMoved = useRef(0);
  const autoFrame = useRef(0);
  const zoomFrame = useRef(0);
  const [range, setRange] = useState<[number, number]>(() => [Math.max(0, initialIndex - 1), Math.min(catalog.lastIndex, initialIndex + 1)]);

  const latest = useRef({ catalog, readZoom, edgeTaps, onIndex, onTap, onScrollDirection, onZoom, onAutoEnd, onAutoStop });
  latest.current = { catalog, readZoom, edgeTaps, onIndex, onTap, onScrollDirection, onZoom, onAutoEnd, onAutoStop };

  const reduced = useRef(typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null);

  /** Left edge of the pages inside the scrolling content, in pixels. */
  const leftEdge = useCallback((fw: number) => {
    const el = box.current!;
    return (Math.max(el.clientWidth, fw + 2 * GUTTER) - fw) / 2;
  }, []);

  /** Size every page for this zoom. */
  const layout = useCallback((z: number) => {
    const el = box.current!;
    const base = Math.max(120, Math.min(el.clientWidth - 2 * GUTTER, MAX_BASE));
    const fw = base * z;
    const fh = fw * PAGE_RATIO;
    metrics.current = { fw, fh, pitch: fh + GAP };
    const st = el.style;
    st.setProperty("--fw", `${fw}px`);
    st.setProperty("--fh", `${fh}px`);
    st.setProperty("--pitch", `${fh + GAP}px`);
    st.setProperty("--pad", `${PAD_TOP}px`);
    st.setProperty("--tail", `${TAIL}px`);
    st.setProperty("--g", `${GUTTER}px`);
    st.setProperty("--n", String(latest.current.catalog.total));
  }, []);

  const syncRange = useCallback(() => {
    const el = box.current!;
    const { pitch } = metrics.current;
    const n = latest.current.catalog.total;
    const top = el.scrollTop - PAD_TOP;
    const first = Math.max(0, Math.floor(top / pitch) - 1);
    const last = Math.min(n - 1, Math.max(first, Math.floor((top + el.clientHeight) / pitch) + 1));
    setRange((r) => (r[0] === first && r[1] === last ? r : [first, last]));
  }, []);

  const setFraction = useCallback(() => {
    const el = box.current!;
    const n = latest.current.catalog.total;
    const f = (el.scrollTop - PAD_TOP + TOP_PEEK) / metrics.current.pitch / Math.max(1, n - 1);
    el.parentElement?.style.setProperty("--frac", Math.min(1, Math.max(0, f)).toFixed(5));
  }, []);

  const readingIndex = useCallback(() => {
    const el = box.current!;
    const y = el.scrollTop - PAD_TOP + el.clientHeight * READ_LINE;
    return latest.current.catalog.clamp(Math.floor(y / metrics.current.pitch));
  }, []);

  const anchorAt = useCallback(
    (mx: number, my: number): Anchor => {
      const el = box.current!;
      const { fw, pitch } = metrics.current;
      return { q: (el.scrollTop + my - PAD_TOP) / pitch, px: (el.scrollLeft + mx - leftEdge(fw)) / fw };
    },
    [leftEdge],
  );

  /** Apply a zoom so the anchored point of the page sits under screen position (mx, my). */
  const zoomAround = useCallback(
    (z: number, anchor: Anchor, mx: number, my: number) => {
      const el = box.current!;
      layout(z);
      zoomRef.current = z;
      const { fw, pitch } = metrics.current;
      el.scrollTop = PAD_TOP + anchor.q * pitch - my;
      el.scrollLeft = leftEdge(fw) + anchor.px * fw - mx;
      setFraction();
      syncRange();
    },
    [layout, leftEdge, setFraction, syncRange],
  );

  const animateZoom = useCallback(
    (to: number, mx: number, my: number) => {
      cancelAnimationFrame(zoomFrame.current);
      const from = zoomRef.current;
      const anchor = anchorAt(mx, my);
      const start = performance.now();
      const duration = reduced.current?.matches ? 0 : 220;
      const step = (now: number) => {
        const k = duration ? Math.min(1, (now - start) / duration) : 1;
        const eased = 1 - Math.pow(1 - k, 3);
        zoomAround(from + (to - from) * eased, anchor, mx, my);
        if (k < 1) zoomFrame.current = requestAnimationFrame(step);
        else latest.current.onZoom(zoomRef.current);
      };
      zoomFrame.current = requestAnimationFrame(step);
    },
    [anchorAt, zoomAround],
  );

  const stopAuto = useCallback(() => {
    if (autoFrame.current) {
      cancelAnimationFrame(autoFrame.current);
      autoFrame.current = 0;
      return true;
    }
    return false;
  }, []);

  const scrollToIndex = useCallback(
    (index: number, smooth = false) => {
      const el = box.current!;
      const i = latest.current.catalog.clamp(index);
      quietUntil.current = performance.now() + 700;
      el.scrollTo({ top: PAD_TOP + i * metrics.current.pitch - TOP_PEEK, behavior: smooth && !reduced.current?.matches ? "smooth" : "auto" });
    },
    [],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      scrollToIndex,
      scrollScreen: (direction) => {
        const el = box.current!;
        quietUntil.current = performance.now() + 700;
        el.scrollBy({ top: direction * el.clientHeight * 0.86, behavior: reduced.current?.matches ? "auto" : "smooth" });
      },
      pxPerPage: () => metrics.current.pitch,
      autoScroll: (pxPerSecond) => {
        const el = box.current!;
        stopAuto();
        if (pxPerSecond <= 0) return;
        let last = performance.now();
        let pos = el.scrollTop;
        const step = (now: number) => {
          const dt = Math.min(64, now - last) / 1000;
          last = now;
          if (Math.abs(el.scrollTop - pos) > 3) pos = el.scrollTop;
          pos += pxPerSecond * dt;
          el.scrollTop = pos;
          if (el.scrollTop >= el.scrollHeight - el.clientHeight - 1) {
            autoFrame.current = 0;
            latest.current.onAutoEnd();
            return;
          }
          autoFrame.current = requestAnimationFrame(step);
        };
        autoFrame.current = requestAnimationFrame(step);
      },
      zoomTo: (z) => {
        const el = box.current!;
        animateZoom(clampZoom(z), el.clientWidth / 2, el.clientHeight * 0.4);
      },
    }),
    [scrollToIndex, stopAuto, animateZoom],
  );

  // First layout: size the pages and put the starting page at the top before anything is painted.
  useLayoutEffect(() => {
    const el = box.current!;
    layout(zoomRef.current);
    el.scrollTop = PAD_TOP + initialIndex * metrics.current.pitch - TOP_PEEK;
    setFraction();
    syncRange();
    // Only on mount: later moves are commands, not props.
  }, []);

  // A zoom chosen elsewhere (the display sheet) is applied around the middle of the screen.
  useEffect(() => {
    if (Math.abs(zoom - zoomRef.current) < 0.012) return;
    const el = box.current!;
    cancelAnimationFrame(zoomFrame.current);
    const mx = el.clientWidth / 2;
    const my = el.clientHeight * 0.4;
    zoomAround(zoom, anchorAt(mx, my), mx, my);
  }, [zoom, anchorAt, zoomAround]);

  // Keep the same place when the window changes size or the phone is turned.
  useEffect(() => {
    const el = box.current!;
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) {
        syncRange();
        return;
      }
      width = el.clientWidth;
      const q = (el.scrollTop - PAD_TOP + TOP_PEEK) / metrics.current.pitch;
      layout(zoomRef.current);
      el.scrollTop = PAD_TOP + q * metrics.current.pitch - TOP_PEEK;
      setFraction();
      syncRange();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout, setFraction, syncRange]);

  // Scrolling: which page is being read, which pages to keep in the document, and which way we move.
  useEffect(() => {
    const el = box.current!;
    let frame = 0;
    let lastTop = el.scrollTop;
    let travelled = 0;
    const tick = () => {
      frame = 0;
      const idx = readingIndex();
      if (idx !== emitted.current) {
        emitted.current = idx;
        latest.current.onIndex(idx);
      }
      setFraction();
      syncRange();
      const dy = el.scrollTop - lastTop;
      lastTop = el.scrollTop;
      if (performance.now() < quietUntil.current || autoFrame.current) {
        travelled = 0;
        return;
      }
      travelled = Math.sign(dy) === Math.sign(travelled) ? travelled + dy : dy;
      if (Math.abs(travelled) > 56) {
        latest.current.onScrollDirection(travelled > 0 ? "down" : "up");
        travelled = 0;
      }
    };
    const onScroll = () => {
      lastMoved.current = performance.now();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [readingIndex, setFraction, syncRange]);

  // Touch and pointer gestures: tap zones, double tap zoom, pinch zoom, ctrl wheel zoom.
  useEffect(() => {
    const el = box.current!;
    const local = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      return { x: cx - r.left, y: cy - r.top };
    };

    let down: { x: number; y: number; t: number; top: number; flung: boolean } | null = null;
    let lastTap: { t: number; x: number; y: number } | null = null;
    let tapTimer = 0;
    let pinch: { d0: number; z0: number; anchor: Anchor } | null = null;
    let pinching = false;
    let wheelTimer = 0;

    const onDown = (e: PointerEvent) => {
      cancelAnimationFrame(zoomFrame.current);
      if (stopAuto()) latest.current.onAutoStop();
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0) || (e.target as Element).closest("[data-no-gesture]")) {
        down = null;
        return;
      }
      down = { x: e.clientX, y: e.clientY, t: e.timeStamp, top: el.scrollTop, flung: performance.now() - lastMoved.current < 200 };
    };

    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || pinching) return;
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || Math.abs(el.scrollTop - d.top) > 3;
      if (moved || d.flung || e.timeStamp - d.t > 500) return;
      const p = local(e.clientX, e.clientY);
      if (lastTap && e.timeStamp - lastTap.t < DOUBLE_TAP_MS && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 32) {
        window.clearTimeout(tapTimer);
        lastTap = null;
        const target = zoomRef.current > 1.05 ? 1 : latest.current.readZoom;
        animateZoom(target, p.x, p.y);
        return;
      }
      lastTap = { t: e.timeStamp, x: p.x, y: p.y };
      tapTimer = window.setTimeout(() => {
        lastTap = null;
        const f = p.y / el.clientHeight;
        const zone: TapZone = !latest.current.edgeTaps ? "middle" : f < 0.2 ? "start" : f > 0.8 ? "end" : "middle";
        latest.current.onTap(zone);
      }, DOUBLE_TAP_MS);
    };

    const onCancel = () => {
      down = null;
    };

    const mid = (t: TouchList) => local((t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
    const gap = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      cancelAnimationFrame(zoomFrame.current);
      if (stopAuto()) latest.current.onAutoStop();
      window.clearTimeout(tapTimer);
      lastTap = null;
      const m = mid(e.touches);
      pinch = { d0: gap(e.touches), z0: zoomRef.current, anchor: anchorAt(m.x, m.y) };
      pinching = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      if (e.cancelable) e.preventDefault();
      const m = mid(e.touches);
      zoomAround(clampZoom((pinch.z0 * gap(e.touches)) / pinch.d0), pinch.anchor, m.x, m.y);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (pinch && e.touches.length < 2) {
        if (zoomRef.current < 1.04 && zoomRef.current !== 1) {
          zoomAround(1, pinch.anchor, el.clientWidth / 2, el.clientHeight / 2);
        }
        pinch = null;
        latest.current.onZoom(zoomRef.current);
      }
      if (e.touches.length === 0) window.setTimeout(() => (pinching = false), 60);
    };

    const onWheel = (e: WheelEvent) => {
      stopAuto();
      if (!e.ctrlKey) return;
      e.preventDefault();
      const p = local(e.clientX, e.clientY);
      const z = clampZoom(zoomRef.current * Math.exp(-e.deltaY * 0.01));
      zoomAround(z, anchorAt(p.x, p.y), p.x, p.y);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => latest.current.onZoom(zoomRef.current), 160);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(tapTimer);
      window.clearTimeout(wheelTimer);
      cancelAnimationFrame(zoomFrame.current);
      stopAuto();
    };
  }, [anchorAt, animateZoom, stopAuto, zoomAround]);

  const shown: number[] = [];
  for (let i = range[0]; i <= range[1]; i++) shown.push(i);

  return (
    <div ref={box} className="flow" role="region" aria-label="Book pages" tabIndex={-1}>
      <div className="flow__spacer">
        {shown.map((i) => (
          <FlowPage key={catalog.pageAt(i)} page={catalog.pageAt(i)} position={i} />
        ))}
      </div>
    </div>
  );
}
